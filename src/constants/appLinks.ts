export type AppLinkName = 'Storybook' | 'Pokedex' | 'Sandbox'

export interface AppLink {
  name: AppLinkName
  href: string
}

/** Pokedex/Sand-box/Storybook app hrefs shared by the Apps and Home pages. */
export const APP_LINKS: AppLink[] = [
  { name: 'Pokedex', href: 'https://pokedex.akli.dev' },
  { name: 'Sandbox', href: 'https://sandbox.akli.dev' },
  { name: 'Storybook', href: 'https://storybook.akli.dev' },
]

export const getAppLink = (name: AppLinkName): AppLink => {
  const link = APP_LINKS.find((appLink) => appLink.name === name)
  if (!link) throw new Error(`No app link found for "${name}"`)
  return link
}
