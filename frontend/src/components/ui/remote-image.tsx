import { useState, type ReactNode } from 'react'

type RemoteImageProps = {
  src: string | string[]
  alt: string
  className?: string
  fallback?: ReactNode
}

export function RemoteImage({ src, alt, className, fallback = null }: RemoteImageProps) {
  const sources = Array.isArray(src) ? src : [src]
  return <ImageAttempt key={JSON.stringify(sources)} sources={sources} alt={alt} className={className} fallback={fallback} />
}

function ImageAttempt({ sources, alt, className, fallback }: Omit<RemoteImageProps, 'src'> & { sources: string[] }) {
  const [attempt, setAttempt] = useState(0)

  if (attempt >= sources.length) return <>{fallback}</>

  return (
    <img
      key={sources[attempt]}
      src={sources[attempt]}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setAttempt((value) => value + 1)}
    />
  )
}
