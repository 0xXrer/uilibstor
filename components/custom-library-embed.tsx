"use client"

type CustomLibraryEmbedProps = {
  src: string
  title: string
}

export function CustomLibraryEmbed({ src, title }: CustomLibraryEmbedProps) {
  return (
    <iframe
      src={src}
      title={title}
      className="min-h-[calc(100svh-3.5rem)] w-full flex-1 border-0 bg-background"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
