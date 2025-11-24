import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const PLACEHOLDER_IMAGE = '/images/placeholder-milestone.png'
const MAX_IMAGES_PER_PDF = 4
const MAX_PDF_BYTES = 2 * 1024 * 1024 // 2MB

type StorybookPage = {
  category?: string | null
  page_number: number
  milestone_code: string
  display_text: string
  narrative_text: string
  image_url?: string
  visual_flag?: string
  status?: string
  recommended_articles?: Array<{
    title: string
    url: string
    source: string
    description?: string
  }>
  items?: Array<{
    milestone_code?: string
    display_text?: string
    micro_narrative?: string
    visual_flag?: string
  }>
}

type StorybookInput = {
  pages: StorybookPage[]
}

type ChildProfile = {
  first_name: string
  age_months: number
  gender: string
}

function toPdfImageSource(imageSrc: string): any {
  try {
    if (imageSrc.startsWith('data:image/')) {
      // Extract format from data URI (e.g., data:image/jpeg;base64,...)
      const formatMatch = imageSrc.match(/data:image\/([^;]+)/)
      const format = formatMatch?.[1] === 'png' ? 'png' : 'jpeg'
      const base64 = imageSrc.split(',')[1] ?? ''
      const buffer = Buffer.from(base64, 'base64')
      return { data: buffer, format: format as 'jpeg' | 'png' }
    }
    // For URLs, return as-is - @react-pdf/renderer will handle fetching
    return imageSrc
  } catch (error) {
    console.error('[pdf] Error processing image source:', error)
    // Return original src as fallback
    return imageSrc
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#431407',
    backgroundColor: '#fff7ed',
  },
  // Header and Footer
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#ea580c',
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#c2410c',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerPageNumber: {
    fontSize: 11,
    color: '#ffedd5',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#fed7aa',
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f97316',
  },
  footerText: {
    fontSize: 10,
    color: '#78350f',
    textAlign: 'center',
  },
  // Content area with padding for header/footer
  content: {
    padding: 40,
    paddingTop: 80,
    paddingBottom: 60,
    minHeight: '100%',
  },
  // Cover page styles
  cover: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#fff7ed',
    height: '100%',
    padding: 40,
  },
  coverLogo: {
    fontSize: 32,
    fontWeight: 700,
    color: '#ea580c',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  coverLogoSubtitle: {
    fontSize: 10,
    color: '#9a3412',
    letterSpacing: 2,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: 28,
    color: '#ea580c',
    marginBottom: 16,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 16,
    color: '#9a3412',
    marginBottom: 32,
    fontWeight: 500,
  },
  coverDetails: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 8,
    lineHeight: 1.6,
  },
  coverDivider: {
    width: 100,
    height: 3,
    backgroundColor: '#ea580c',
    marginVertical: 24,
    borderRadius: 2,
  },
  // Content page styles
  heading: {
    fontSize: 20,
    color: '#ea580c',
    marginBottom: 16,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  subheading: {
    fontSize: 16,
    color: '#c2410c',
    marginBottom: 12,
    fontWeight: 600,
  },
  body: {
    fontSize: 13,
    lineHeight: 1.7,
    marginBottom: 14,
    color: '#431407',
  },
  image: {
    width: '100%',
    maxHeight: 400,
    borderRadius: 8,
    marginBottom: 20,
    objectFit: 'contain', // Changed from 'cover' to 'contain' to show full image without cropping
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 11,
    alignSelf: 'flex-start',
    marginBottom: 16,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusMet: {
    backgroundColor: '#ecfccb',
    color: '#365314',
    borderWidth: 1,
    borderColor: '#65a30d',
  },
  statusSupport: {
    backgroundColor: '#fef3c7',
    color: '#78350f',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  flag: {
    marginTop: 10,
    fontSize: 11,
    color: '#dc2626',
    fontWeight: 600,
    backgroundColor: '#fee2e2',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  // Articles section styles
  articlesSection: {
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fed7aa',
    borderStyle: 'solid',
  },
  articlesHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  articlesTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#c2410c',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  articlesSubtitle: {
    fontSize: 10,
    color: '#78350f',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  articleCard: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 0,
  },
  articleCardSpacing: {
    marginBottom: 12,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceBadgeCDC: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  sourceBadgeHealthyChildren: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  sourceBadgeAAP: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
  },
  sourceBadgeOther: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: 700,
  },
  articleTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#ea580c',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  articleDescription: {
    fontSize: 10,
    color: '#78350f',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  articleLink: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#fed7aa',
  },
  articleLinkText: {
    fontSize: 9,
    color: '#9a3412',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  pageHeader: {
    marginBottom: 12,
    fontSize: 11,
    color: '#9a3412',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryTag: {
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 600,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  // Summary and list styles
  summarySection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  summaryItem: {
    fontSize: 13,
    marginBottom: 8,
    color: '#431407',
    lineHeight: 1.6,
  },
  listItem: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ea580c',
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#c2410c',
    marginBottom: 4,
  },
  listItemText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 1.6,
  },
  milestoneItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#c2410c',
    marginBottom: 6,
  },
  milestoneNarrative: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  // Footer note
  footerNote: {
    fontSize: 10,
    color: '#9a3412',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#fed7aa',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

async function downloadAndCompressImage(url: string | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Unable to download image: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const compressedBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer()

    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`
  } catch (error) {
    console.error('[pdf] image compression failed:', error)
    return null
  }
}

async function compressPdfBuffer(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= MAX_PDF_BYTES) {
    return buffer
  }

  try {
    const pdfDoc = await PDFDocument.load(buffer)
    const optimized = await pdfDoc.save({
      useObjectStreams: true,
    })
    const optimizedBuffer = Buffer.from(optimized)
    if (optimizedBuffer.length <= MAX_PDF_BYTES || optimizedBuffer.length < buffer.length) {
      return optimizedBuffer
    }
    return buffer
  } catch (error) {
    console.warn('[pdf] compression failed, using original buffer:', error)
    return buffer
  }
}

function StorybookPDFDocument({
  storybook,
  child,
  version,
  compressedImages,
}: {
  storybook: StorybookInput
  child: ChildProfile
  version: 'parent' | 'physician'
  compressedImages: Record<number, string>
}) {
  const pages = storybook.pages ?? []
  const total = pages.length
  const metCount = pages.filter(
    (page) => (page.status ?? '').toLowerCase() === 'met'
  ).length
  const needsSupportCount = total - metCount
  const progressPercent = total > 0 ? Math.round((metCount / total) * 100) : 0

  const keyMilestones = pages
    .filter((page) => (page.status ?? '').toLowerCase() === 'met')
    .slice(0, 5)
  const nextSteps = pages
    .filter((page) => (page.status ?? '').toLowerCase() !== 'met')
    .slice(0, 5)

  const coverTitle =
    version === 'parent'
      ? `${child.first_name}'s Developmental Journey`
      : `Developmental Assessment - Child A, ${child.age_months} months`

  const coverSubtitle =
    version === 'parent'
      ? 'Celebrating milestones with FirstSignFirst'
      : `Prepared for Pediatric Review • ${new Date().toLocaleDateString()}`

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={styles.coverLogo}>FirstSignFirst</Text>
          <Text style={styles.coverLogoSubtitle}>Developmental Milestone Assessment</Text>
        </View>
        <View style={styles.coverDivider} />
        <Text style={styles.coverTitle}>{coverTitle}</Text>
        <Text style={styles.coverSubtitle}>{coverSubtitle}</Text>
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={styles.coverDetails}>
            <Text style={{ fontWeight: 600 }}>Child:</Text> {child.first_name}
          </Text>
          <Text style={styles.coverDetails}>
            <Text style={{ fontWeight: 600 }}>Age:</Text> {child.age_months} months
          </Text>
        <Text style={styles.coverDetails}>
            <Text style={{ fontWeight: 600 }}>Gender:</Text> {child.gender}
          </Text>
          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <Text style={[styles.coverDetails, { fontSize: 14, fontWeight: 600 }]}>
              Progress Summary
            </Text>
            <Text style={[styles.coverDetails, { marginTop: 8 }]}>
              {metCount} of {total} milestones met ({progressPercent}%)
        </Text>
        <Text style={styles.coverDetails}>
              {needsSupportCount} areas needing support
            </Text>
          </View>
        </View>
        <View style={styles.coverDivider} />
        <Text style={[styles.coverDetails, { fontSize: 11, marginTop: 24 }]}>
          Generated on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        {version === 'parent' && (
          <Text style={[styles.coverDetails, { fontSize: 11, marginTop: 8, fontStyle: 'italic' }]}>
            This personalized storybook celebrates your child&apos;s developmental journey
          </Text>
        )}
      </Page>

      {pages.map((page, pageIndex) => {
        const status = (page.status ?? '').toLowerCase()
        const statusLabel = status === 'met' ? '✓ Milestone Met' : '⚠ Needs Support'
        const statusStyle = status === 'met' ? styles.statusMet : styles.statusSupport
        const imageSrc = compressedImages[page.page_number]
        const pageNumber = pageIndex + 2 // +1 for cover, +1 for 1-based indexing

        return (
          <Page key={page.page_number} size="A4" style={styles.page} wrap>
            {/* Header */}
            <View style={styles.header} fixed>
              <Text style={styles.headerLogo}>FirstSignFirst</Text>
              <Text style={styles.headerPageNumber}>Page {pageNumber}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {page.category && (
                <Text style={styles.categoryTag}>{page.category}</Text>
              )}
            <Text style={[styles.statusBadge, statusStyle]}>{statusLabel}</Text>
              
            {imageSrc ? (
              <Image style={styles.image} src={toPdfImageSource(imageSrc)} alt="" />
            ) : (
              <View
                style={[
                  styles.image,
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                      backgroundColor: '#ffedd5',
                  },
                ]}
              >
                  <Text style={{ color: '#9a3412', fontSize: 12 }}>Image unavailable</Text>
              </View>
            )}
              
            <Text style={styles.heading}>{page.display_text}</Text>
            <Text style={styles.body}>{page.narrative_text}</Text>
              
              {/* Recommended Articles Section - Only for "needs support" pages */}
              {(page.status ?? '').toLowerCase() === 'missed' && page.recommended_articles && page.recommended_articles.length > 0 && (
                <View style={styles.articlesSection}>
                  <View style={styles.articlesHeader}>
                    <Text style={styles.articlesTitle}>📚 Helpful Resources</Text>
                    <Text style={styles.articlesSubtitle}>Evidence-based articles to support your child&apos;s development</Text>
                  </View>
                  {page.recommended_articles.map((article, idx) => (
                    <View key={idx} style={[
                      styles.articleCard,
                      ...(idx < page.recommended_articles!.length - 1 ? [styles.articleCardSpacing] : [])
                    ]}>
                      <View style={styles.articleHeader}>
                        <View style={[
                          styles.sourceBadge,
                          ...(article.source === 'CDC' ? [styles.sourceBadgeCDC] : []),
                          ...(article.source === 'HealthyChildren' ? [styles.sourceBadgeHealthyChildren] : []),
                          ...(article.source === 'AAP' ? [styles.sourceBadgeAAP] : []),
                          ...(article.source === 'Other' ? [styles.sourceBadgeOther] : [])
                        ]}>
                          <Text style={styles.sourceBadgeText}>{article.source}</Text>
                        </View>
                      </View>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      {article.description && (
                        <Text style={styles.articleDescription}>{article.description}</Text>
                      )}
                      <View style={styles.articleLink}>
                        <Text style={styles.articleLinkText}>{article.url}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {Array.isArray(page.items) && page.items.length > 0 && (
                <View style={{ marginTop: 16, marginBottom: 12 }}>
                  <Text style={styles.subheading}>Key Milestones:</Text>
                {page.items.slice(0, 6).map((it, idx) => (
                    <View key={`${it.milestone_code ?? idx}`} style={styles.milestoneItem}>
                      <Text style={styles.milestoneTitle}>
                        {it.display_text ?? 'Milestone'}
                    </Text>
                    {it.micro_narrative ? (
                        <Text style={styles.milestoneNarrative}>
                        {it.micro_narrative}
                      </Text>
                    ) : null}
                    {it.visual_flag ? (
                        <Text style={styles.flag}>🚩 {it.visual_flag}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
              )}
              
              {page.visual_flag && !Array.isArray(page.items) && (
              <Text style={styles.flag}>🚩 {page.visual_flag}</Text>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>
                FirstSignFirst • Developmental Milestone Assessment • Page {pageNumber}
              </Text>
            </View>
          </Page>
        )
      })}

      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text style={styles.headerLogo}>FirstSignFirst</Text>
          <Text style={styles.headerPageNumber}>Summary</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
        <Text style={styles.heading}>Summary & Next Steps</Text>
          
        <View style={styles.summarySection}>
            <Text style={[styles.subheading, { marginBottom: 12 }]}>Overall Progress</Text>
            <Text style={styles.summaryItem}>
              <Text style={{ fontWeight: 600 }}>Progress:</Text> {progressPercent}% milestones met ({metCount} of {total} total milestones)
            </Text>
          <Text style={styles.summaryItem}>
              <Text style={{ fontWeight: 600 }}>Areas needing support:</Text> {needsSupportCount} milestone{needsSupportCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.summaryItem}>
              <Text style={{ fontWeight: 600 }}>Milestones celebrated:</Text> {metCount} achievement{metCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {keyMilestones.length > 0 && (
          <View style={styles.summarySection}>
              <Text style={styles.subheading}>Milestones Celebrated</Text>
            {keyMilestones.map((milestone) => (
              <View key={`celebrated-${milestone.page_number}`} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{milestone.display_text}</Text>
                  <Text style={styles.listItemText}>
                  {milestone.narrative_text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {nextSteps.length > 0 && (
          <View style={styles.summarySection}>
              <Text style={styles.subheading}>Recommended Next Steps</Text>
            {nextSteps.map((milestone) => (
              <View key={`next-${milestone.page_number}`} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{milestone.display_text}</Text>
                  <Text style={styles.listItemText}>
                  {milestone.narrative_text}
                </Text>
              </View>
            ))}
          </View>
        )}

          <Text style={styles.footerNote}>
            This report was generated by FirstSignFirst AI to support developmental monitoring.{'\n'}
            For questions or concerns, please consult with your pediatrician.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            FirstSignFirst • Developmental Milestone Assessment • Summary Page
        </Text>
        </View>
      </Page>
    </Document>
  )
}

async function buildPdfBuffer(
  storybook: StorybookInput,
  child: ChildProfile,
  version: 'parent' | 'physician',
  compressedImages: Record<number, string>
): Promise<Buffer> {
  const instance = pdf(
    <StorybookPDFDocument
      storybook={storybook}
      child={child}
      version={version}
      compressedImages={compressedImages}
    />
  )
  
  // @react-pdf/renderer's pdf() returns a PDF instance
  // Use toBlob() which returns a Promise<Blob>
  const blob = await instance.toBlob()
  
  // Convert Blob to Buffer
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function uploadPdfToStorage(
  buffer: Buffer,
  assessmentId: string,
  version: 'parent' | 'physician'
): Promise<string> {
  // Prefer service-role for server-side uploads to bypass RLS
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = createServiceClient() as unknown as Awaited<
      ReturnType<typeof createClient>
    >
    console.log('[pdf] Using service-role client for storage upload')
  } catch (error) {
    console.warn('[pdf] Service-role client failed, using regular client:', error)
    supabase = await createClient()
  }
  
  const storagePath = `${assessmentId}/${version}.pdf`
  console.log(`[pdf] Uploading to storage path: ${storagePath}`)

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('storybook-pdfs')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    console.error('[pdf] Storage upload error:', uploadError)
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      console.error('[pdf] Failed to list buckets:', listError)
    } else {
      const bucketExists = buckets?.some(b => b.name === 'storybook-pdfs')
      if (!bucketExists) {
        console.error('[pdf] Bucket "storybook-pdfs" does not exist! Available buckets:', buckets?.map(b => b.name))
      }
    }
    throw uploadError
  }

  console.log('[pdf] Upload successful, getting public URL')
  const {
    data: { publicUrl },
  } = supabase.storage.from('storybook-pdfs').getPublicUrl(storagePath)

  if (!publicUrl) {
    throw new Error('Failed to get public URL for uploaded PDF')
  }

  console.log(`[pdf] Public URL: ${publicUrl}`)
  return publicUrl
}

export async function generateStorybookPDF(
  storybook: StorybookInput,
  child: ChildProfile,
  assessmentId: string,
  version: 'parent' | 'physician'
): Promise<string | null> {
  console.log(`[pdf] Starting PDF generation for ${version} version, assessment: ${assessmentId}`)
  console.log(`[pdf] Storybook has ${storybook.pages?.length ?? 0} pages`)
  
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      console.log(`[pdf] Attempt ${attempt} of 2`)
      const compressedImages: Record<number, string> = {}

      const compressionResults = await Promise.allSettled(
        (storybook.pages ?? []).map(async (page) => {
          if (!page.image_url) {
            console.log(`[pdf] Page ${page.page_number} has no image_url, skipping compression`)
            return null
          }
          console.log(`[pdf] Compressing image for page ${page.page_number}: ${page.image_url}`)
          const compressed = await downloadAndCompressImage(page.image_url)
          return { pageNumber: page.page_number, compressed }
        })
      )

      let compressedCount = 0
      compressionResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const value = result.value
          if (value?.compressed) {
            compressedImages[value.pageNumber] = value.compressed
            compressedCount++
          }
        } else {
          console.error('[pdf] image compression failed:', result.reason)
        }
      })
      console.log(`[pdf] Successfully compressed ${compressedCount} images`)

      console.log(`[pdf] Building PDF buffer for ${version} version`)
      const pdfBuffer = await buildPdfBuffer(storybook, child, version, compressedImages)
      console.log(`[pdf] PDF buffer created, size: ${pdfBuffer.length} bytes`)

      console.log(`[pdf] Uploading PDF to storage`)
      const publicUrl = await uploadPdfToStorage(pdfBuffer, assessmentId, version)
      console.log(`[pdf] PDF uploaded successfully: ${publicUrl}`)

      return publicUrl
    } catch (error) {
      console.error(`[pdf] generation attempt ${attempt} failed:`, error)
      if (error instanceof Error) {
        console.error(`[pdf] Error stack:`, error.stack)
      }
      if (attempt === 2) {
        console.error(`[pdf] All attempts failed, returning null`)
        return null
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.error(`[pdf] PDF generation failed after all attempts`)
  return null
}

