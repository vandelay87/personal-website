export type AppLinkName = 'Pokedex' | 'Sandbox'

export interface AppLink {
  name: AppLinkName
  href: string
}

/** Pokedex/Sand-box app hrefs shared by the Apps and Home pages. */
export const APP_LINKS: AppLink[] = [
  { name: 'Pokedex', href: 'https://pokedex.akli.dev' },
  { name: 'Sandbox', href: 'https://sandbox.akli.dev' },
]
