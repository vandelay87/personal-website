import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import { describe, expect, it } from 'vitest'

import {
  checkComposesTies,
  checkPair,
  discoverVariantComponentsFromSources,
  extractJsxTags,
  extractTopLevelClassNames,
  findCompoundSelectorsForClass,
  findLayerBlock,
  parseTagUsage,
  scanComposesRepo,
  scanRepo,
} from './check-descendant-selectors'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

// Mirrors the real Tag.module.css shape (issue #331 context): a genuine
// `@layer component-defaults` wrapping only `.remove` — but Tag.tsx has no
// `variant` prop at all (active/removable booleans instead).
const TAG_CSS = `
.tag {
  display: inline-flex;
}

@layer component-defaults {
  .remove {
    color: inherit;
  }
}
`

const TYPOGRAPHY_LAYERED = extractTopLevelClassNames(findLayerBlock(TYPOGRAPHY_CSS, 'component-defaults')!)
const LINK_LAYERED = extractTopLevelClassNames(findLayerBlock(LINK_CSS, 'component-defaults')!)
const TAG_LAYERED = extractTopLevelClassNames(findLayerBlock(TAG_CSS, 'component-defaults')!)

const COMPONENTS = [
  { tag: 'Typography', layered: TYPOGRAPHY_LAYERED },
  { tag: 'Link', layered: LINK_LAYERED },
  { tag: 'Tag', layered: TAG_LAYERED },
]

const check = (tsxSource: string, cssSource: string) =>
  checkPair({ tsxSource, cssSource, components: COMPONENTS })

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

    const findings = check(tsxSource, cssSource)

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

    const findings = check(tsxSource, cssSource)

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

    const findings = check(tsxSource, cssSource)

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

    const findings = check(tsxSource, cssSource)

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

    const findings = check(tsxSource, cssSource)

    expect(findings).toHaveLength(0)
  })

  it('does not flag Tag despite a genuine @layer component-defaults on Tag.module.css, because Tag has no variant prop', () => {
    // Tag.module.css has a real `@layer component-defaults` (`.remove`), so
    // it's discovered as a candidate — but Tag.tsx has no `variant` prop at
    // all (active/removable booleans instead, `.tag` applied
    // unconditionally). No `<Tag variant="...">` usage can exist, so
    // parseTagUsage never finds a variant value and `!variant` always
    // short-circuits — this must produce zero findings, not a silently
    // swallowed false negative.
    const tsxSource = `
      <span className={styles.tag}>
        {children}
        <button className={\`\${styles.remove} \${removeClassName}\`} onClick={onRemove} />
      </span>
    `
    const cssSource = '.chips .remove {\n  color: red;\n}\n'

    const findings = check(tsxSource, cssSource)

    expect(findings).toHaveLength(0)
  })
})

describe('discoverVariantComponentsFromSources — generalized component discovery (extension 1)', () => {
  it('discovers Typography and Link automatically from their CSS modules, not via hardcoded paths', () => {
    const discovered = discoverVariantComponentsFromSources([
      { path: 'src/components/Typography/Typography.module.css', source: TYPOGRAPHY_CSS },
      { path: 'src/components/Link/Link.module.css', source: LINK_CSS },
    ])

    expect(discovered).toHaveLength(2)
    expect(discovered.find((c) => c.tag === 'Typography')?.layered).toEqual(new Set(['heading1', 'body', 'label']))
    expect(discovered.find((c) => c.tag === 'Link')?.layered).toEqual(new Set(['link', 'ghost', 'solid']))
  })

  it('discovers Tag (a real @layer component-defaults with no variant prop) as a candidate', () => {
    const discovered = discoverVariantComponentsFromSources([
      { path: 'src/components/Tag/Tag.module.css', source: TAG_CSS },
    ])

    expect(discovered).toHaveLength(1)
    expect(discovered[0]).toMatchObject({ tag: 'Tag', layered: new Set(['remove']) })
  })

  it('discovers a synthetic third component with a variant-shaped prop, without any code change', () => {
    // Proves discovery generalizes beyond the two originally-hardcoded
    // paths: a brand-new component CSS module with a real
    // `@layer component-defaults` block is picked up automatically.
    const genericCss = `
      @layer component-defaults {
        .primary {
          color: blue;
        }
        .secondary {
          color: gray;
        }
      }
    `
    const discovered = discoverVariantComponentsFromSources([
      { path: 'src/components/Badge/Badge.module.css', source: genericCss },
    ])

    expect(discovered).toHaveLength(1)
    expect(discovered[0]).toMatchObject({ tag: 'Badge', layered: new Set(['primary', 'secondary']) })

    // And checkPair picks up a <Badge variant="primary"> tie using exactly
    // that discovered entry, with no bespoke "Badge" handling anywhere.
    const tsxSource = `
      <div className={styles.row}>
        <Badge variant="primary" className={styles.count}>3</Badge>
      </div>
    `
    const cssSource = '.row .count {\n  font-weight: bold;\n}\n'
    const findings = checkPair({ tsxSource, cssSource, components: discovered })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ component: 'Badge', variant: 'primary', className: 'count' })
  })

  it('does not mistake a comment mentioning "@layer component-defaults" for a real at-rule (RecipeSteps.module.css shape)', () => {
    // RecipeSteps.module.css/TagInput.module.css/RecipeDetailView.module.css
    // all have prose comments mentioning "@layer component-defaults" (a fix
    // made in a *different* file) with no actual @layer at-rule of their
    // own. A naive marker search would find the comment text and then treat
    // the next unrelated rule block as the "layer" — findLayerBlock strips
    // comments first specifically to avoid this.
    const commentOnlyCss = `
      /* Bare .text override: Typography's own .body now lives in
         \`@layer component-defaults\` (Typography.module.css, #263), so this
         plain unlayered class deterministically wins. */
      .text {
        font-size: 16.5px;
      }
    `
    const discovered = discoverVariantComponentsFromSources([
      { path: 'src/components/RecipeSteps/RecipeSteps.module.css', source: commentOnlyCss },
    ])

    expect(discovered).toHaveLength(0)
  })
})

describe('scanRepo — integration against the current repo state', () => {
  it('produces zero findings (the codebase is already clean, per issues #326-#336)', () => {
    const findings = scanRepo()
    expect(findings).toEqual([])
  })

  it('discovers Typography, Link, and Tag from real component CSS modules (not Button, which has no layer yet)', () => {
    // Regression guard for the generalized discovery against real files —
    // confirms it isn't only exercised via the synthetic fixtures above.
    const repoRoot = resolve(__dirname, '..')
    const cssFiles = globSync('src/components/**/*.module.css', { cwd: repoRoot, absolute: true })
    const files = cssFiles.map((absPath) => ({
      path: relative(repoRoot, absPath),
      source: readFileSync(absPath, 'utf8'),
    }))

    const discovered = discoverVariantComponentsFromSources(files)
    const tags = discovered.map((c) => c.tag).sort()

    expect(tags).toContain('Typography')
    expect(tags).toContain('Link')
    expect(tags).toContain('Tag')
    expect(tags).not.toContain('Button')
    expect(tags).not.toContain('RecipeSteps')
    expect(tags).not.toContain('TagInput')
    expect(tags).not.toContain('RecipeDetailView')
  })
})

describe('checkComposesTies — the composes:-based tie (extension 2)', () => {
  // Mirrors text.module.css's real @layer component-defaults shape (a subset).
  const TEXT_MODULE_CSS = `
    @layer component-defaults {
      .eyebrow {
        font-size: 12px;
      }
      .pageHeading {
        font-size: 2rem;
      }
    }
  `
  const TEXT_MODULE_LAYERED = extractTopLevelClassNames(findLayerBlock(TEXT_MODULE_CSS, 'component-defaults')!)
  const REPO_ROOT = '/repo'
  const TEXT_MODULE_ABS_PATH = '/repo/src/styles/text.module.css'

  it('flags the pre-#334 Recipes.module.css shape: composes: tie + a separate compound selector for the same local class', () => {
    const cssSource = `
      .eyebrow {
        composes: eyebrow from '../../styles/text.module.css';
        font-size: 12px;
        color: var(--color-text-faint);
      }

      .hero .eyebrow {
        margin-block-end: 8px;
      }
    `

    const findings = checkComposesTies({
      cssSource,
      cssFilePath: 'src/pages/Recipes/Recipes.module.css',
      repoRoot: REPO_ROOT,
      textModuleAbsPath: TEXT_MODULE_ABS_PATH,
      textModuleLayered: TEXT_MODULE_LAYERED,
    })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      localClassName: 'eyebrow',
      variant: 'eyebrow',
      selector: '.hero .eyebrow',
    })
    expect(findings[0].reason).toContain('@layer component-defaults')
  })

  it('does not flag when there is a composes: tie but no separate compound selector for that class', () => {
    const cssSource = `
      .eyebrow {
        composes: eyebrow from '../../styles/text.module.css';
        font-size: 12px;
      }
    `

    const findings = checkComposesTies({
      cssSource,
      cssFilePath: 'src/pages/Recipes/Recipes.module.css',
      repoRoot: REPO_ROOT,
      textModuleAbsPath: TEXT_MODULE_ABS_PATH,
      textModuleLayered: TEXT_MODULE_LAYERED,
    })

    expect(findings).toHaveLength(0)
  })

  it('does not flag a composes: tie to a name not confirmed inside the layer', () => {
    const cssSource = `
      .caption {
        composes: caption from '../../styles/text.module.css';
      }

      .hero .caption {
        opacity: 0.8;
      }
    `

    const findings = checkComposesTies({
      cssSource,
      cssFilePath: 'src/pages/Recipes/Recipes.module.css',
      repoRoot: REPO_ROOT,
      textModuleAbsPath: TEXT_MODULE_ABS_PATH,
      textModuleLayered: TEXT_MODULE_LAYERED,
    })

    expect(findings).toHaveLength(0)
  })

  it('does not flag a composes: from an unrelated CSS module (not text.module.css)', () => {
    const cssSource = `
      .focusable {
        composes: focusRing from '../../styles/interactions.module.css';
      }

      .row .focusable {
        outline-offset: 2px;
      }
    `

    const findings = checkComposesTies({
      cssSource,
      cssFilePath: 'src/pages/Recipes/Recipes.module.css',
      repoRoot: REPO_ROOT,
      textModuleAbsPath: TEXT_MODULE_ABS_PATH,
      textModuleLayered: TEXT_MODULE_LAYERED,
    })

    expect(findings).toHaveLength(0)
  })

  it('resolves the composes: import path relative to varying consumer depths', () => {
    // A deeper consumer, e.g. src/components/Foo/Bar/Baz.module.css, would
    // use a longer '../../../styles/text.module.css' — confirm resolution
    // still lands on the same absolute text.module.css path.
    const cssSource = `
      .metaLabel {
        composes: eyebrow from '../../../styles/text.module.css';
      }

      .header .metaLabel {
        margin: 0;
      }
    `

    const findings = checkComposesTies({
      cssSource,
      cssFilePath: 'src/components/Foo/Bar/Baz.module.css',
      repoRoot: REPO_ROOT,
      textModuleAbsPath: TEXT_MODULE_ABS_PATH,
      textModuleLayered: TEXT_MODULE_LAYERED,
    })

    expect(findings).toHaveLength(1)
  })
})

describe('scanComposesRepo — integration against the current repo state', () => {
  it('produces zero findings (issue #334 already fixed the only known instance)', () => {
    const findings = scanComposesRepo()
    expect(findings).toEqual([])
  })
})
