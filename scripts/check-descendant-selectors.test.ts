import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import { describe, expect, it, vi } from 'vitest'

import {
  checkComposesTies,
  checkPair,
  discoverVariantComponentsFromPackageSources,
  discoverVariantComponentsFromSources,
  extractJsxTags,
  extractTopLevelClassNames,
  findCompoundSelectorsForClass,
  findLayerBlock,
  parsePackageModuleMap,
  parseTagUsage,
  scanComposesRepo,
  scanRepo,
} from './check-descendant-selectors'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Test-only helper mirroring the script's own `globAndReadFiles`: globs `pattern` under `repoRoot` and reads each match into a `{path, source}` pair. */
const readCssFiles = (repoRoot: string, pattern: string) =>
  globSync(pattern, { cwd: repoRoot, absolute: true }).map((absPath) => ({
    path: relative(repoRoot, absPath),
    source: readFileSync(absPath, 'utf8'),
  }))

/**
 * Test-only helper mirroring the script's own `globAndReadPackageComponentSources`:
 * builds on `readCssFiles`, keeps only CSS with a real `@layer component-defaults`
 * (Button has none, so its sidecar is never even read here — same as production),
 * and reads each survivor's sibling `.module.js` sidecar into a
 * `PackageComponentSource`-shaped object.
 */
const readPackageComponentSources = (repoRoot: string, cssPattern: string) =>
  readCssFiles(repoRoot, cssPattern)
    .filter(({ source }) => findLayerBlock(source, 'component-defaults') !== null)
    .map(({ path, source }) => ({
      cssPath: path,
      cssSource: source,
      moduleJsSource: readFileSync(resolve(repoRoot, path).replace(/\.css$/, '.module.js'), 'utf8'),
    }))

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

// Mirrors the real @akli-dev/ui@2.1.0 shipped `dist/components/Typography/Typography.css`
// shape (issue #413): compiled CSS-Modules output, minified, class names
// hashed by Vite's default `generateScopedName` (`_<name>_<5-char-hash>_<digits>`).
// Hash confirmed real (`q94bf`) via `grep -n "@layer" node_modules/@akli-dev/ui/dist/components/Typography/Typography.css`.
const TYPOGRAPHY_PACKAGE_CSS =
  '@layer component-defaults{._heading1_q94bf_8{font-size:2rem}._body_q94bf_36{font-size:1rem}._label_q94bf_50{font-size:.875rem}}'

// Mirrors the real shipped `dist/components/Typography/Typography.module.js` sidecar shape —
// the bundler-emitted semantic-name -> hashed-classname mapping (see `parsePackageModuleMap`).
// Trimmed to the three names the CSS fixture above actually declares.
const TYPOGRAPHY_PACKAGE_MODULE_JS = `import './Typography.css';//#region src/components/Typography/Typography.module.css
var e = "_heading1_q94bf_8", i = "_body_q94bf_36", o = "_label_q94bf_50", c = {
	heading1: e,
	body: i,
	label: o
};
//#endregion
export { i as body, c as default, e as heading1, o as label };
`

// Mirrors the real shipped `dist/components/Link/Link.css` shape: `.link`/`.ghost`/`.solid`
// layered (hash `1lv4c`), `.inherit` deliberately left unlayered — same shape as the local
// LINK_CSS fixture above, just hashed.
const LINK_PACKAGE_CSS =
  '@layer component-defaults{._link_1lv4c_3{color:blue}._ghost_1lv4c_27,._solid_1lv4c_28{padding:8px}}._inherit_1lv4c_85{color:inherit}'

// Mirrors the real shipped `dist/components/Link/Link.module.js` sidecar shape, trimmed to the
// names the CSS fixture above actually declares.
const LINK_PACKAGE_MODULE_JS = `import './Link.css';//#region src/components/Link/Link.module.css
var e = "_link_1lv4c_3", t = "_ghost_1lv4c_27", n = "_solid_1lv4c_28", i = "_inherit_1lv4c_85", c = {
	link: e,
	ghost: t,
	solid: n,
	inherit: i
};
//#endregion
export { c as default, t as ghost, i as inherit, e as link, n as solid };
`

// Mirrors the real shipped `dist/components/Input/Input.css` shape: a genuine
// `@layer component-defaults` wrapping only `.field` (hash `19wrf`) — but the rest of
// Input's own CSS uses a *different* hash (`a84mr`) for its own (non-layered) `.field`-named
// rule, confirming the layer's content isn't assumed to share one hash per file. Input.tsx has
// no `variant` prop at all, so this should be discovered as a candidate but never produce a
// `checkPair` finding (same as the local Tag.module.css case above).
const INPUT_PACKAGE_CSS =
  '@layer component-defaults{._field_19wrf_36{width:100%}}._wrapper_a84mr_6{position:relative}._field_a84mr_13{border:1px solid gray}'

// Mirrors the real shipped `dist/components/Input/Input.module.js` sidecar shape — note
// `field`'s value is a *space-separated pair* of hashed class names (`_field_a84mr_13
// _field_19wrf_36`, a CSS Modules `composes:` result): only the second token is inside the
// layer, which is exactly what `parsePackageModuleMap`/`discoverVariantComponentsFromPackageSources`
// must handle to still resolve `field` as layered.
const INPUT_PACKAGE_MODULE_JS = `import './Input.css';//#region src/components/Input/Input.module.css
var e = "_wrapper_a84mr_6", t = "_field_a84mr_13 _field_19wrf_36", c = {
	wrapper: e,
	field: t
};
//#endregion
export { c as default, t as field, e as wrapper };
`

// Mirrors the real shipped `dist/components/Button/Button.css` shape: variant-shaped hashed
// classes (`toneDanger`, `fullWidth` — confirmed real names/hash `88dh1`), but NO
// `@layer component-defaults` at all (`grep -n "@layer" .../Button.css` is empty) — Button's
// variant rules haven't migrated into the layer in the package yet.
const BUTTON_PACKAGE_CSS = '._toneDanger_88dh1_85{color:red}._fullWidth_88dh1_109{width:100%}'

// Mirrors the real shipped `dist/components/Button/Button.module.js` sidecar shape. Never
// actually parsed by discovery below — Button.css has no `@layer component-defaults` at all,
// so `discoverVariantComponentsFromPackageSources` skips it before ever reading the sidecar.
const BUTTON_PACKAGE_MODULE_JS = `import './Button.css';//#region src/components/Button/Button.module.css
var e = "_toneDanger_88dh1_85", t = "_fullWidth_88dh1_109", c = {
	toneDanger: e,
	fullWidth: t
};
//#endregion
export { c as default, t as fullWidth, e as toneDanger };
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

describe('parsePackageModuleMap — parsing @akli-dev/ui\'s .module.js sidecar (issue #413 follow-up)', () => {
  it('parses the Typography sidecar shape into a semantic-name -> hashed-classname map', () => {
    const map = parsePackageModuleMap(TYPOGRAPHY_PACKAGE_MODULE_JS)
    expect(map).toEqual(
      new Map([
        ['heading1', '_heading1_q94bf_8'],
        ['body', '_body_q94bf_36'],
        ['label', '_label_q94bf_50'],
      ])
    )
  })

  it('parses the Link sidecar shape', () => {
    const map = parsePackageModuleMap(LINK_PACKAGE_MODULE_JS)
    expect(map).toEqual(
      new Map([
        ['link', '_link_1lv4c_3'],
        ['ghost', '_ghost_1lv4c_27'],
        ['solid', '_solid_1lv4c_28'],
        ['inherit', '_inherit_1lv4c_85'],
      ])
    )
  })

  it('keeps a composed multi-token value intact (Input\'s field: two space-separated hashed class names)', () => {
    const map = parsePackageModuleMap(INPUT_PACKAGE_MODULE_JS)
    expect(map?.get('field')).toBe('_field_a84mr_13 _field_19wrf_36')
    expect(map?.get('wrapper')).toBe('_wrapper_a84mr_6')
  })

  it('returns null when there is no var declaration list at all', () => {
    expect(parsePackageModuleMap('export { default } from "./Whatever.js"')).toBeNull()
  })

  it('returns null when there is no object-literal block (var declarations with no default-export map)', () => {
    expect(parsePackageModuleMap('var e = "_heading1_q94bf_8", t = "_body_q94bf_36";')).toBeNull()
  })
})

describe('discoverVariantComponentsFromPackageSources — package CSS + sidecar discovery (issue #413 follow-up)', () => {
  it('discovers Typography and Link from CSS + sidecar fixture pairs, resolved back to their semantic names', () => {
    const discovered = discoverVariantComponentsFromPackageSources([
      {
        cssPath: 'node_modules/@akli-dev/ui/dist/components/Typography/Typography.css',
        cssSource: TYPOGRAPHY_PACKAGE_CSS,
        moduleJsSource: TYPOGRAPHY_PACKAGE_MODULE_JS,
      },
      {
        cssPath: 'node_modules/@akli-dev/ui/dist/components/Link/Link.css',
        cssSource: LINK_PACKAGE_CSS,
        moduleJsSource: LINK_PACKAGE_MODULE_JS,
      },
    ])

    expect(discovered).toHaveLength(2)
    expect(discovered.find((c) => c.tag === 'Typography')?.layered).toEqual(new Set(['heading1', 'body', 'label']))
    expect(discovered.find((c) => c.tag === 'Link')?.layered).toEqual(new Set(['link', 'ghost', 'solid']))
  })

  it('discovers Input as a real candidate (a genuine @layer exists) even though it has no variant prop, resolving field\'s composed multi-token value', () => {
    // Mirror-image of Button below: a real layer, but checkPair alone (unchanged) is what
    // ensures this never produces a finding, since Input.tsx has no variant= to tie against.
    const discovered = discoverVariantComponentsFromPackageSources([
      {
        cssPath: 'node_modules/@akli-dev/ui/dist/components/Input/Input.css',
        cssSource: INPUT_PACKAGE_CSS,
        moduleJsSource: INPUT_PACKAGE_MODULE_JS,
      },
    ])

    expect(discovered).toHaveLength(1)
    expect(discovered[0]).toMatchObject({ tag: 'Input', layered: new Set(['field']) })
  })

  it('does not discover Button — its shipped CSS has variant-shaped classes but no @layer component-defaults at all (sidecar never even parsed)', () => {
    const discovered = discoverVariantComponentsFromPackageSources([
      {
        cssPath: 'node_modules/@akli-dev/ui/dist/components/Button/Button.css',
        cssSource: BUTTON_PACKAGE_CSS,
        moduleJsSource: BUTTON_PACKAGE_MODULE_JS,
      },
    ])

    expect(discovered).toHaveLength(0)
  })

  it('skips a component with a clear console.warn when its sidecar fails to parse, instead of crashing discovery for the rest', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const discovered = discoverVariantComponentsFromPackageSources([
      {
        cssPath: 'node_modules/@akli-dev/ui/dist/components/Typography/Typography.css',
        cssSource: TYPOGRAPHY_PACKAGE_CSS,
        moduleJsSource: TYPOGRAPHY_PACKAGE_MODULE_JS,
      },
      {
        // A layer exists, so this is a candidate — but its sidecar is malformed junk.
        cssPath: 'node_modules/@akli-dev/ui/dist/components/Broken/Broken.css',
        cssSource: '@layer component-defaults{._foo_abcde_1{color:red}}',
        moduleJsSource: 'export default {};',
      },
    ])

    expect(discovered).toHaveLength(1)
    expect(discovered[0].tag).toBe('Typography')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Broken'))

    warnSpy.mockRestore()
  })
})

describe('discoverVariantComponentsFromPackageSources — integration against the real installed @akli-dev/ui package (issue #413)', () => {
  // Computed once for the whole block — pure and deterministic given the same installed
  // node_modules, so there's no need to re-glob/re-read/re-parse it per `it`.
  const repoRoot = resolve(__dirname, '..')
  const discovered = discoverVariantComponentsFromPackageSources(
    readPackageComponentSources(repoRoot, 'node_modules/@akli-dev/ui/dist/components/**/*.css')
  )

  it('discovers Typography and Link from the real shipped, build-hashed dist CSS resolved via the real sidecar .module.js files — restoring the coverage lost when their local .module.css files were deleted', () => {
    const byTag = Object.fromEntries(discovered.map((c) => [c.tag, c.layered]))

    expect(byTag.Typography).toEqual(
      new Set(['heading1', 'heading2', 'heading3', 'heading4', 'body', 'bodyLarge', 'label', 'caption'])
    )
    // Link's real shipped layer also includes `textOnly` (confirmed via the same grep) — per
    // Link.js's compiled source, this class is applied when neither an icon nor a `variant`
    // is passed (`!icon && !variant && styles.textOnly`), never through `variant=` itself, so
    // no `<Link variant="textOnly">` usage can exist. It's discovered as a candidate but can
    // never produce a `checkPair` finding, same shape as the Input/Tag cases.
    expect(byTag.Link).toEqual(new Set(['link', 'ghost', 'solid', 'textOnly']))
  })

  it('does not discover Button (no @layer shipped yet), and the dist/components/**/*.css glob scope keeps out dist/styles/interactions.css (a shared utility file that also happens to contain a real @layer component-defaults block)', () => {
    const tags = discovered.map((c) => c.tag)

    expect(tags).not.toContain('Button')
    expect(tags).not.toContain('interactions')
  })

  it('flags a plausible real-shaped <Typography variant="heading1" className={styles.title}> tied to a stale compound selector, using components discovered purely from the real installed package', () => {
    const tsxSource = `
      <div className={styles.hero}>
        <Typography variant="heading1" className={styles.title}>
          Title
        </Typography>
      </div>
    `
    const cssSource = '.hero .title {\n  margin: 0;\n}\n'

    const findings = checkPair({ tsxSource, cssSource, components: discovered })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      component: 'Typography',
      variant: 'heading1',
      className: 'title',
      selector: '.hero .title',
    })
  })
})

describe('scanRepo — integration against the current repo state', () => {
  it('produces zero findings (the codebase is already clean, per issues #326-#336)', () => {
    const findings = scanRepo()
    expect(findings).toEqual([])
  })

  it('discovers Tag from real local component CSS modules (not Button, which has no layer yet)', () => {
    // Regression guard for the generalized discovery against real files —
    // confirms it isn't only exercised via the synthetic fixtures above.
    const repoRoot = resolve(__dirname, '..')
    const files = readCssFiles(repoRoot, 'src/components/**/*.module.css')

    const discovered = discoverVariantComponentsFromSources(files)
    const tags = discovered.map((c) => c.tag).sort()

    expect(tags).toContain('Tag')
    expect(tags).not.toContain('Button')
    expect(tags).not.toContain('RecipeSteps')
    expect(tags).not.toContain('TagInput')
    expect(tags).not.toContain('RecipeDetailView')
    // Sourced from @akli-dev/ui since their migration — no longer
    // discoverable via a local src/components/**/*.module.css glob alone;
    // discoverVariantComponentsFromPackageSources (issue #413, see the
    // describe block above) is what restores their coverage via the
    // package's shipped CSS, merged in by the full discoverVariantComponents
    // / scanRepo pipeline.
    expect(tags).not.toContain('Typography')
    expect(tags).not.toContain('Link')
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
