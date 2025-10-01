// Custom image loader for CDN optimization
export default function imageLoader({ src, width, quality }: {
  src: string
  width: number
  quality?: number
}) {
  // For local images, use default Next.js optimization
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
  }
  
  // For Supabase images, add optimization parameters
  if (src.includes('supabase')) {
    const url = new URL(src)
    url.searchParams.set('width', width.toString())
    url.searchParams.set('quality', (quality || 75).toString())
    url.searchParams.set('format', 'webp')
    return url.toString()
  }
  
  // For external images, return as-is
  return src
}