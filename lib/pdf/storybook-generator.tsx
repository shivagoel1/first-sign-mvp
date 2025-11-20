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
      const base64 = imageSrc.split(',')[1] ?? ''
      const buffer = Buffer.from(base64, 'base64')
      return { data: buffer, format: 'jpeg' as const }
    }
  } catch {
    // fall through; return original src
  }
  return imageSrc
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 14,
    fontFamily: 'Helvetica',
    color: '#1F2937',
  },
  cover: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#EEF2FF',
    height: '100%',
  },
  coverTitle: {
    fontSize: 24,
    color: '#4F46E5',
    marginBottom: 12,
    fontWeight: 700,
  },
  coverSubtitle: {
    fontSize: 18,
    color: '#7C3AED',
    marginBottom: 24,
  },
  coverDetails: {
    fontSize: 14,
    color: '#4B5563',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    color: '#4F46E5',
    marginBottom: 12,
    fontWeight: 600,
  },
  body: {
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 12,
    color: '#374151',
  },
  image: {
    width: '100%',
    maxHeight: 320,
    borderRadius: 12,
    marginBottom: 16,
    objectFit: 'cover',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusMet: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
  },
  statusSupport: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  flag: {
    marginTop: 8,
    fontSize: 12,
    color: '#B91C1C',
  },
  pageHeader: {
    marginBottom: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryItem: {
    fontSize: 14,
    marginBottom: 6,
  },
  listItem: {
    marginBottom: 8,
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
      <Page size="A4" style={[styles.page, styles.cover]}>
        <Image
          style={styles.logo}
          src="https://cdn.jsdelivr.net/gh/tabler/tabler-icons@latest/icons/png/brand-openai.png"
        />
        <Text style={styles.coverTitle}>{coverTitle}</Text>
        <Text style={styles.coverSubtitle}>{coverSubtitle}</Text>
        <Text style={styles.coverDetails}>
          Age: {child.age_months} months • Gender: {child.gender}
        </Text>
        <Text style={styles.coverDetails}>
          Generated on {new Date().toLocaleDateString()}
        </Text>
      </Page>

      {pages.map((page) => {
        const status = (page.status ?? '').toLowerCase()
        const statusLabel = status === 'met' ? '✅ Milestone Met' : '⚠️ Needs Support'
        const statusStyle = status === 'met' ? styles.statusMet : styles.statusSupport
        const imageSrc = compressedImages[page.page_number]

        return (
          <Page key={page.page_number} size="A4" style={styles.page} wrap>
            <Text style={styles.pageHeader}>
              {page.category ? `${page.category}` : 'Storybook'} • Page {page.page_number}
            </Text>
            <Text style={[styles.statusBadge, statusStyle]}>{statusLabel}</Text>
            {imageSrc ? (
              <Image style={styles.image} src={toPdfImageSource(imageSrc)} />
            ) : (
              <View
                style={[
                  styles.image,
                  {
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ color: '#9CA3AF' }}>Image unavailable</Text>
              </View>
            )}
            <Text style={styles.heading}>{page.display_text}</Text>
            <Text style={styles.body}>{page.narrative_text}</Text>
            {Array.isArray(page.items) && page.items.length ? (
              <View style={{ marginTop: 6, marginBottom: 8 }}>
                {page.items.slice(0, 6).map((it, idx) => (
                  <View key={`${it.milestone_code ?? idx}`} style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: 600 }}>
                      • {it.display_text ?? 'Milestone'}
                    </Text>
                    {it.micro_narrative ? (
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        {it.micro_narrative}
                      </Text>
                    ) : null}
                    {it.visual_flag ? (
                      <Text style={{ fontSize: 12, color: '#B91C1C' }}>🚩 {it.visual_flag}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
            {page.visual_flag ? (
              <Text style={styles.flag}>🚩 {page.visual_flag}</Text>
            ) : null}
          </Page>
        )
      })}

      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Summary & Next Steps</Text>
        <View style={styles.summarySection}>
          <Text style={styles.summaryItem}>
            Overall Progress: {progressPercent}% milestones met ({metCount} of {total})
          </Text>
          <Text style={styles.summaryItem}>
            Milestones needing support: {needsSupportCount}
          </Text>
        </View>

        {keyMilestones.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={[styles.heading, { fontSize: 16 }]}>Milestones Celebrated</Text>
            {keyMilestones.map((milestone) => (
              <View key={`celebrated-${milestone.page_number}`} style={styles.listItem}>
                <Text style={{ fontWeight: 600 }}>{milestone.display_text}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {milestone.narrative_text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {nextSteps.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={[styles.heading, { fontSize: 16 }]}>Recommended Next Steps</Text>
            {nextSteps.map((milestone) => (
              <View key={`next-${milestone.page_number}`} style={styles.listItem}>
                <Text style={{ fontWeight: 600 }}>{milestone.display_text}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {milestone.narrative_text}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 24 }}>
          This report was generated by FirstSignFirst AI to support developmental monitoring.
        </Text>
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
  const instance = pdf()
  instance.updateContainer(
    <StorybookPDFDocument
      storybook={storybook}
      child={child}
      version={version}
      compressedImages={compressedImages}
    />
  )
  const result = await instance.toBuffer()
  // @react-pdf/renderer's toBuffer() returns a Buffer directly
  if (Buffer.isBuffer(result)) {
    return result
  }
  // Fallback: if it's a ReadableStream, convert it
  if (result && typeof result === 'object' && 'getReader' in result) {
    const chunks: Uint8Array[] = []
    const reader = (result as unknown as ReadableStream<Uint8Array>).getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    return Buffer.concat(chunks)
  }
  // Last resort: try to convert to Buffer
  return Buffer.from(result as unknown as ArrayBuffer)
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

