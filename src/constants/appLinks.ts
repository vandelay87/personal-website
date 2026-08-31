export type AppLinkName = 'Storybook' | 'Pokedex' | 'Sandbox'

/** Pokedex/Sand-box/Storybook app hrefs shared by the Apps and Home pages. */
export const APP_LINKS: Record<AppLinkName, string> = {
  Pokedex: 'https://pokedex.akli.dev',
  Sandbox: 'https://sandbox.akli.dev',
  Storybook: 'https://storybook.akli.dev',
}
