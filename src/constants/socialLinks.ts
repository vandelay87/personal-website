export interface SocialLink {
  name: string
  href: string
}

const EMAIL_ADDRESS = 'akliaissat@outlook.com'

/** GitHub/LinkedIn/Email link data shared by Footer and SocialCard. */
export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'GitHub', href: 'https://github.com/vandelay87' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/akli-aissat-b08119115/' },
  { name: 'Email', href: `mailto:${EMAIL_ADDRESS}` },
]

// SocialCard's email link prefills a subject line; Footer's stays a bare mailto. This split is
// an intentional Resolved Decision (docs/prds/paper-redesign.md #1), not drift to be fixed.
export const SOCIAL_LINKS_WITH_EMAIL_SUBJECT: SocialLink[] = SOCIAL_LINKS.map((link) =>
  link.name === 'Email' ? { ...link, href: `mailto:${EMAIL_ADDRESS}?subject=Hello` } : link
)
