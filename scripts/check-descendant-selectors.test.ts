import { describe, expect, it } from 'vitest'

import {
  checkPair,
  extractJsxTags,
  extractTopLevelClassNames,
  findCompoundSelectorsForClass,
  findLayerBlock,
  parseTagUsage,
  scanRepo,
} from './check-descendant-selectors'

// Mirrors the real Typography.module.css shape (issue #263): a handful of
// variant rules inside `@layer component-defaults`.
const TYPOGRAPHY_CSS = `
@layer component-defaults {
  .heading1 {
    font-size: 2rem;
  }

  .body {
    font-size: 1rem;
  }

  .label {
    font-size: 0.875rem;
  }
}
`

// Mirrors the real Link.module.css shape: .link/.ghost/.solid layered,
// .inherit/.muted/.accent (tone) deliberately left unlayered.
const LINK_CSS = `
@layer component-defaults {
  .link {
    color: blue;
  }

  .ghost,
  .solid {
    padding: 8px;
  }
}

.inherit {
  color: inherit;
}
`

const TYPOGRAPHY_LAYERED = extractTopLevelClassNames(findLayerBlock(TYPOGRAPHY_CSS, 'component-defaults')!)
const LINK_LAYERED = extractTopLevelClassNames(findLayerBlock(LINK_CSS, 'component-defaults')!)

describe('findLayerBlock / extractTopLevelClassNames', () => {
  it('extracts the layered class names from a @layer component-defaults block', () => {
    expect(TYPOGRAPHY_LAYERED).toEqual(new Set(['heading1', 'body', 'label']))
    expect(LINK_LAYERED).toEqual(new Set(['link', 'ghost', 'solid']))
  })

  it('returns null when the layer is absent', () => {
    expect(findLayerBlock('.foo { color: red; }', 'component-defaults')).toBeNull()
  })
})

describe('extractJsxTags', () => {
  it('extracts a single-line self-closing tag', () => {
    const source = `<Typography variant="body" className={styles.foo} />`
    const tags = extractJsxTags(source, 'Typography')
    expect(tags).toHaveLength(1)
    expect(tags[0].text).toBe(source)
  })

  it('extracts a multi-line tag regardless of prop order', () => {
    const source = `
      <Typography
        className={styles.rowTitle}
        variant="heading2"
      >
        Title
      </Typography>
    `
    const tags = extractJsxTags(source, 'Typography')
    expect(tags).toHaveLength(1)
    expect(tags[0].text).toContain('variant="heading2"')
    expect(tags[0].text).toContain('styles.rowTitle')
  })

  it('does not match the closing tag', () => {
    const source = `<Typography variant="body" className={styles.foo}>text</Typography>`
    const tags = extractJsxTags(source, 'Typography')
    expect(tags).toHaveLength(1)
  })

  it('handles a template-literal className combining multiple classes', () => {
    // Same shape as RecipeList.tsx's `${interactions.focusRing} ${styles.actionButton}`
    const source = '<Link to="/x" className={`${interactions.focusRing} ${styles.actionButton}`} nudge="none">Edit</Link>'
    const tags = extractJsxTags(source, 'Link')
    expect(tags).toHaveLength(1)
    const usage = parseTagUsage(tags[0].text)
    expect(usage.classNames).toEqual(['actionButton'])
    expect(usage.variant).toBeUndefined()
  })
})

describe('parseTagUsage', () => {
  it('extracts variant and all styles.* references', () => {
    const usage = parseTagUsage('<Typography variant="heading1" className={`${a} ${styles.foo} ${styles.bar}`}>')
    expect(usage.variant).toBe('heading1')
    expect(usage.classNames).toEqual(['foo', 'bar'])
  })

  it('reports undefined variant when absent', () => {
    const usage = parseTagUsage('<Link to="/x" className={styles.actionButton} nudge="none">')
    expect(usage.variant).toBeUndefined()
  })
})

describe('findCompoundSelectorsForClass', () => {
  it('finds a simple two-part compound descendant selector', () => {
    const css = '.parent .child {\n  color: red;\n}\n'
    const matches = findCompoundSelectorsForClass(css, 'child')
    expect(matches).toHaveLength(1)
    expect(matches[0].selector).toBe('.parent .child')
  })

  it('ignores explicit combinators and 3+-level selectors', () => {
    const css = '.a > .child { color: red; }\n.a .b .child { color: blue; }\n'
    expect(findCompoundSelectorsForClass(css, 'child')).toHaveLength(0)
  })

  it('ignores selectors inside @media/@layer preludes as non-selectors but still finds nested rules', () => {
    const css = '@media (prefers-reduced-motion: reduce) {\n  .parent .child {\n    transition: none;\n  }\n}\n'
    const matches = findCompoundSelectorsForClass(css, 'child')
    expect(matches).toHaveLength(1)
  })
})

describe('checkPair — true positive (the anti-pattern this gate exists to catch)', () => {
  it('flags a Typography variant tied to a compound descendant selector via className', () => {
    const tsxSource = `
      const Row = () => (
        <div className={styles.someParent}>
          <Typography variant="heading1" className={styles.someName}>
            Title
          </Typography>
        </div>
      )
    `
    const cssSource = '.someParent .someName {\n  font-weight: bold;\n}\n'

    const findings = checkPair({
      tsxSource,
      cssSource,
      typographyLayered: TYPOGRAPHY_LAYERED,
      linkLayered: LINK_LAYERED,
    })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      component: 'Typography',
      variant: 'heading1',
      className: 'someName',
      selector: '.someParent .someName',
    })
    expect(findings[0].reason).toContain('@layer component-defaults')
  })

  it('flags a Link variant="solid" tied to a compound descendant selector', () => {
    const tsxSource = `
      <Link to="/new" variant="solid" className={styles.newButton}>
        Create
      </Link>
    `
    const cssSource = '.header .newButton {\n  padding: 10px;\n}\n'

    const findings = checkPair({
      tsxSource,
      cssSource,
      typographyLayered: TYPOGRAPHY_LAYERED,
      linkLayered: LINK_LAYERED,
    })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      component: 'Link',
      variant: 'solid',
      className: 'newButton',
      selector: '.header .newButton',
    })
  })
})

describe('checkPair — named false-positive cases', () => {
  it('does not flag Callout-shaped coincidental class-name collisions (no Typography/Link usage at all)', () => {
    // Callout.module.css literally has `.tip .label`/`.warning .label`/`.info .label`,
    // and Typography.module.css literally has a `.label` variant — but Callout.tsx
    // never renders <Typography variant="label">, it applies `.label` to a plain
    // <div>. A naive literal-name-only check would flag this; this gate must not.
    const tsxSource = `
      const Callout = ({ type, children }) => (
        <div className={\`\${styles.callout} \${styles[type]}\`}>
          <div className={styles.label}>{indicators[type].label}</div>
          <div>{children}</div>
        </div>
      )
    `
    const cssSource = `
      .tip .label {
        color: green;
      }
      .warning .label {
        color: orange;
      }
      .info .label {
        color: blue;
      }
    `

    const findings = checkPair({
      tsxSource,
      cssSource,
      typographyLayered: TYPOGRAPHY_LAYERED,
      linkLayered: LINK_LAYERED,
    })

    expect(findings).toHaveLength(0)
  })

  it('does not flag ProcessingPlaceholder-shaped size-modifier selectors (unrelated to Typography/Link)', () => {
    const tsxSource = `
      const ProcessingPlaceholder = ({ small }) => (
        <figure className={small ? styles.small : styles.root}>
          <div className={styles.inner} />
        </figure>
      )
    `
    const cssSource = '.small .inner {\n  border-radius: 8px;\n}\n'

    const findings = checkPair({
      tsxSource,
      cssSource,
      typographyLayered: TYPOGRAPHY_LAYERED,
      linkLayered: LINK_LAYERED,
    })

    expect(findings).toHaveLength(0)
  })

  it('does not flag a Link tied to a compound selector when no variant prop is passed (RecipeList\'s .rowActions .actionButton)', () => {
    // No `variant` prop → Link's default `tone="inherit"` class applies instead,
    // and Link's tone classes are deliberately left unlayered — the compound
    // selector may still be load-bearing here, so this must not be flagged.
    const tsxSource = `
      <Link
        to={\`/admin/recipes/\${recipe.id}/edit\`}
        className={\`\${interactions.focusRing} \${styles.actionButton}\`}
        nudge="none"
      >
        Edit
      </Link>
    `
    const cssSource = '.rowActions .actionButton {\n  color: gray;\n}\n'

    const findings = checkPair({
      tsxSource,
      cssSource,
      typographyLayered: TYPOGRAPHY_LAYERED,
      linkLayered: LINK_LAYERED,
    })

    expect(findings).toHaveLength(0)
  })
})

describe('scanRepo — integration against the current repo state', () => {
  it('produces zero findings (the codebase is already clean, per issues #326-#336)', () => {
    const findings = scanRepo()
    expect(findings).toEqual([])
  })
})
