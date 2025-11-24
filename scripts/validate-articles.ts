/**
 * Script to validate article URLs in the database
 * Checks if URLs are accessible and updates validation_status
 * 
 * Run with: npx tsx scripts/validate-articles.ts
 */

import { createAdminClient } from '@/lib/supabase/admin'

// Import the validation function from article-agent
// We'll need to extract it or recreate it here
async function isUrlAccessible(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // Try HEAD request first (more efficient)
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FirstSignFirst/1.0; +https://firstsignfirst.com)',
        },
        redirect: 'follow',
      })
      clearTimeout(timeoutId)
      
      // Check for 404 explicitly
      if (response.status === 404) {
        console.warn(`[validate-articles] URL returned 404: ${url}`)
        return false
      }
      
      // Consider 2xx as accessible
      if (response.ok) {
        return true
      }
      
      // Consider 3xx redirects as accessible
      if (response.status >= 300 && response.status < 400) {
        return true
      }
      
      // If HEAD doesn't work, try GET
      if (response.status === 405 || response.status === 501) {
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FirstSignFirst/1.0; +https://firstsignfirst.com)',
          },
          redirect: 'follow',
        })
        clearTimeout(timeoutId)
        
        if (getResponse.status === 404) {
          return false
        }
        
        return getResponse.ok || (getResponse.status >= 300 && getResponse.status < 400)
      }
      
      return false
    } catch (headError) {
      clearTimeout(timeoutId)
      // If HEAD fails, try GET
      const getResponse = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FirstSignFirst/1.0; +https://firstsignfirst.com)',
        },
        redirect: 'follow',
      })
      clearTimeout(timeoutId)
      
      if (getResponse.status === 404) {
        return false
      }
      
      return getResponse.ok || (getResponse.status >= 300 && getResponse.status < 400)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[validate-articles] URL check timeout for: ${url}`)
    }
    return false
  }
}

async function validateArticles() {
  const supabase = createAdminClient()
  
  console.log('🔍 Fetching articles with validation_status = "pending"...')
  
  // Get all pending articles
  type ArticleRow = {
    id: string
    title: string
    url: string
    validation_status: string
  }
  
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, url, validation_status')
    .eq('validation_status', 'pending')
    .returns<ArticleRow[]>()
  
  if (fetchError) {
    console.error('❌ Error fetching articles:', fetchError)
    return
  }
  
  if (!articles || articles.length === 0) {
    console.log('✅ No pending articles to validate!')
    return
  }
  
  console.log(`📋 Found ${articles.length} articles to validate\n`)
  
  let validCount = 0
  let invalidCount = 0
  let errorCount = 0
  
  // Validate articles one by one (with delay to avoid rate limiting)
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    console.log(`[${i + 1}/${articles.length}] Validating: ${article.title}`)
    console.log(`  URL: ${article.url}`)
    
    try {
      const isValid = await isUrlAccessible(article.url)
      
      if (isValid) {
        // Update to valid
        const updatePayload = {
          validation_status: 'valid',
          is_validated: true,
          validation_date: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        }
        const { error: updateError } = await supabase
          .from('articles')
          .update(updatePayload as never)
          .eq('id', article.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating article:`, updateError)
          errorCount++
        } else {
          console.log(`  ✅ Valid`)
          validCount++
        }
      } else {
        // Update to invalid
        const updatePayload = {
          validation_status: 'invalid',
          is_validated: true,
          validation_date: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        }
        const { error: updateError } = await supabase
          .from('articles')
          .update(updatePayload as never)
          .eq('id', article.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating article:`, updateError)
          errorCount++
        } else {
          console.log(`  ❌ Invalid (404 or error)`)
          invalidCount++
        }
      }
      
      // Small delay to avoid overwhelming servers
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
      }
    } catch (error) {
      console.error(`  ❌ Error validating:`, error)
      errorCount++
      
      // Update to timeout or keep as pending
      const timeoutPayload = {
        validation_status: 'timeout',
        last_checked_at: new Date().toISOString(),
      }
      await supabase
        .from('articles')
        .update(timeoutPayload as never)
        .eq('id', article.id)
    }
    
    console.log('') // Empty line for readability
  }
  
  // Summary
  console.log('\n📊 Validation Summary:')
  console.log(`  ✅ Valid: ${validCount}`)
  console.log(`  ❌ Invalid: ${invalidCount}`)
  console.log(`  ⚠️  Errors: ${errorCount}`)
  console.log(`  📋 Total: ${articles.length}`)
}

// Run validation
validateArticles()
  .then(() => {
    console.log('\n✅ Validation complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  })

