import type { Metadata } from "next"

export const SITE_NAME = "uilib"

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return url.replace(/\/$/, "")
}

export function excerpt(text: string, max = 160) {
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (plain.length <= max) return plain
  return `${plain.slice(0, max - 1).trim()}…`
}

const defaultDescription =
  "Community gallery of UI libraries for Roblox and ImGui overlays. Browse screenshots, read docs, and grab the source."

export const defaultMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — UI library gallery`,
    template: `%s · ${SITE_NAME}`,
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  keywords: [
    "Roblox UI",
    "Luau UI",
    "ImGui",
    "UI library",
    "Roblox scripts",
    "menu library",
    "uilib",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — UI library gallery`,
    description: defaultDescription,
    url: "/",
    images: [
      {
        url: "/hero/telescope-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "uilib gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — UI library gallery`,
    description: defaultDescription,
    images: ["/hero/telescope-poster.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export function libraryMetadata(input: {
  slug: string
  name: string
  author: string
  platform: string
  description: string
  cover?: string
}): Metadata {
  const description =
    input.description.trim().length > 0
      ? excerpt(input.description)
      : `${input.name} by ${input.author} — ${input.platform} UI library on ${SITE_NAME}.`

  const images = input.cover
    ? [{ url: input.cover, width: 1200, height: 750, alt: `${input.name} preview` }]
    : defaultMetadata.openGraph?.images

  return {
    title: input.name,
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: input.name,
      description,
      url: `/library/${input.slug}`,
      images,
    },
    twitter: {
      card: input.cover ? "summary_large_image" : "summary",
      title: input.name,
      description,
      images: input.cover ? [input.cover] : undefined,
    },
  }
}
