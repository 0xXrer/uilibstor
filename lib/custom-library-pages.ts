/** Slug → external page to embed on /library/[slug] */
export const CUSTOM_LIBRARY_PAGES: Record<string, string> = {
  windui: "https://footagesus.github.io/treehub-web/about/windui",
}

export function getCustomLibraryPageUrl(slug: string) {
  return CUSTOM_LIBRARY_PAGES[slug] ?? null
}
