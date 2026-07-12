/**
 * Greppable gate for issue #331: flags stale descendant-selector specificity
 * workarounds.
 *
 * The anti-pattern: a `.parent .child { ... }` CSS descendant selector used
 * only to out-specificity a bare override className composed with a shared
 * component's variant (Typography's `variant="X"` prop, or Link's
 * `variant="ghost"|"solid"` prop) via React — a workaround that becomes
 * unnecessary once the variant's own base rule moves into
 * `@layer component-defaults` (an unlayered rule always beats a layered one,
 * regardless of specificity — see Typography.module.css's header comment).
 * This has been manually rediscovered and fixed by hand across issues
 * #263–#336; this script catches it automatically going forward.
 *
 * Deliberately NOT a pure-CSS literal-name check: testing that approach
 * against real fixes showed it both misses ties (a consumer's local
 * override class name, e.g. `styles.rowTitle`, never textually matches the
 * Typography variant it happens to share a DOM node with, e.g. `heading2`)
 * and false-positives on coincidental name collisions (e.g. Callout's own
 * `.label` class has nothing to do with Typography's `label` variant — no
 * `<Typography variant="label">` is anywhere nearby). So this script is
 * JSX-aware: it only considers a class name "tied" to a variant when the
 * same JSX tag actually applies both via React's `variant`/`className`
 * props.
 *
 * Scope (v1): only the `variant` prop pattern on Typography/Link. The
 * `composes:`-based tie in text.module.css's layered variants (e.g.
 * Recipes.module.css's `.eyebrow`-style composition) is a different
 * mechanism — not JSX-visible the same way — and is out of scope here. See
 * the section below for why extending to it isn't a small change.
 */

import { readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const TYPOGRAPHY_CSS_PATH = 'src/components/Typography/Typography.module.css'
const LINK_CSS_PATH = 'src/components/Link/Link.module.css'
const LAYER_NAME = 'component-defaults'

export interface Finding {
  tsxFile: string
  tsxLine: number
  cssFile: string
  cssLine: number
  component: 'Typography' | 'Link'
  variant: string
  className: string
  selector: string
  reason: string
}

interface TagMatch {
  text: string
  index: number
}

interface TagUsage {
  variant: string | undefined
  classNames: string[]
}

interface SelectorGroup {
  selectors: string[]
  index: number
}

interface SelectorMatch {
  selector: string
  index: number
}

/** 1-based line number of `index` within `text`. */
const lineOf = (text: string, index: number): number => {
  let line = 1
  const bound = Math.min(index, text.length)
  for (let i = 0; i < bound; i++) {
    if (text[i] === '\n') line++
  }
  return line
}

/**
 * Finds the balanced-brace block belonging to `@layer <layerName>` in a CSS
 * file (handling nested `@media` blocks inside it, e.g. Link.module.css's
 * reduced-motion reset), and returns its inner content, or null if the
 * layer isn't present.
 */
export const findLayerBlock = (css: string, layerName: string): string | null => {
  const marker = `@layer ${layerName}`
  const markerIndex = css.indexOf(marker)
  if (markerIndex === -1) return null

  const openBrace = css.indexOf('{', markerIndex)
  if (openBrace === -1) return null

  let depth = 1
  let i = openBrace + 1
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  return css.slice(openBrace + 1, i - 1)
}

/**
 * Walks a CSS text (or block) and yields each rule's selector list, skipping
 * at-rule preludes (`@media (...)`, `@layer ...`) since those aren't
 * selectors. Comments are blanked out (not removed) so character offsets
 * still line up with the original text for accurate line-number reporting.
 */
const iterateSelectorGroups = (cssText: string): SelectorGroup[] => {
  const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const parts = noComments.split('{')
  const groups: SelectorGroup[] = []
  let offset = 0

  for (let i = 0; i < parts.length - 1; i++) {
    const chunk = parts[i]
    const lastDelim = Math.max(chunk.lastIndexOf(';'), chunk.lastIndexOf('}'))
    const selectorText = chunk.slice(lastDelim + 1)
    const trimmed = selectorText.trim()

    if (trimmed && !trimmed.startsWith('@')) {
      const leadingWhitespace = selectorText.length - selectorText.trimStart().length
      const index = offset + lastDelim + 1 + leadingWhitespace
      const selectors = trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (selectors.length) groups.push({ selectors, index })
    }

    offset += chunk.length + 1 // +1 restores the '{' character split() consumed
  }

  return groups
}

/** All simple single-class selector names declared directly in a CSS block (e.g. Typography's `.heading1`, Link's `.ghost`/`.solid`). */
export const extractTopLevelClassNames = (cssBlock: string): Set<string> => {
  const names = new Set<string>()
  for (const { selectors } of iterateSelectorGroups(cssBlock)) {
    for (const selector of selectors) {
      if (/^\.[\w-]+$/.test(selector)) {
        names.add(selector.slice(1))
      }
    }
  }
  return names
}

/**
 * Finds compound descendant selectors of the exact shape `.ancestor .className`
 * (a single ancestor class, a descendant combinator, then the target class —
 * optionally with a trailing pseudo-class/attribute selector). Explicit
 * combinators (`>`, `+`, `~`) and 3+-level nesting are intentionally excluded
 * — those aren't the shape this anti-pattern takes in this repo.
 */
export const findCompoundSelectorsForClass = (cssText: string, className: string): SelectorMatch[] => {
  const matches: SelectorMatch[] = []
  for (const { selectors, index } of iterateSelectorGroups(cssText)) {
    for (const selector of selectors) {
      const words = selector.split(/\s+/)
      if (words.length !== 2) continue
      const [ancestor, child] = words
      if (!/^\.[\w-]+$/.test(ancestor)) continue
      const childBase = child.match(/^\.([\w-]+)/)
      if (childBase && childBase[1] === className) {
        matches.push({ selector, index })
      }
    }
  }
  return matches
}

/**
 * Extracts every `<TagName ...>` opening tag from a .tsx source, handling
 * multi-line JSX and nested `{...}` expressions in attribute values (e.g. a
 * template-literal className combining multiple classes). Closing tags
 * (`</TagName>`) are not matched since they never contain `<TagName`
 * contiguously.
 */
export const extractJsxTags = (source: string, tagName: string): TagMatch[] => {
  const tags: TagMatch[] = []
  const openRe = new RegExp(`<${tagName}(?=[\\s/>])`, 'g')
  let match: RegExpExecArray | null

  while ((match = openRe.exec(source))) {
    const start = match.index
    let i = start + tagName.length + 1
    let braceDepth = 0
    let inString: string | null = null
    let closedAt = -1

    while (i < source.length) {
      const ch = source[i]

      if (inString) {
        if (ch === '\\') {
          i += 2
          continue
        }
        if (ch === inString) inString = null
        i++
        continue
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch
        i++
        continue
      }
      if (ch === '{') {
        braceDepth++
        i++
        continue
      }
      if (ch === '}') {
        braceDepth--
        i++
        continue
      }
      if (braceDepth === 0 && ch === '>') {
        closedAt = i
        break
      }
      i++
    }

    if (closedAt === -1) break // unterminated tag — malformed source, bail out of this tagName

    tags.push({ text: source.slice(start, closedAt + 1), index: start })
    openRe.lastIndex = closedAt + 1
  }

  return tags
}

/** Pulls the `variant="X"` value and every `styles.Y` className reference out of a single JSX opening tag's text. */
export const parseTagUsage = (tagText: string): TagUsage => {
  const variantMatch = tagText.match(/\bvariant\s*=\s*"([^"]*)"/)
  const classNames = [...tagText.matchAll(/\bstyles\.([A-Za-z0-9_$]+)/g)].map((m) => m[1])
  return {
    variant: variantMatch ? variantMatch[1] : undefined,
    classNames: [...new Set(classNames)],
  }
}

/**
 * Pure core check: cross-references one .tsx file's Typography/Link JSX
 * usages against its paired .module.css's compound descendant selectors.
 * No file I/O — callers (scanRepo, or tests) supply the source text and the
 * confirmed-layered class name sets directly.
 */
export const checkPair = (params: {
  tsxSource: string
  cssSource: string
  typographyLayered: Set<string>
  linkLayered: Set<string>
}): Array<Omit<Finding, 'tsxFile' | 'cssFile'>> => {
  const { tsxSource, cssSource, typographyLayered, linkLayered } = params
  const findings: Array<Omit<Finding, 'tsxFile' | 'cssFile'>> = []

  const collect = (component: 'Typography' | 'Link', layered: Set<string>) => {
    for (const tag of extractJsxTags(tsxSource, component)) {
      const { variant, classNames } = parseTagUsage(tag.text)
      // No variant → Typography JSX wouldn't typecheck (variant is required),
      // and for Link it means the default `tone` class applies instead
      // (deliberately unlayered — see Link.module.css's tone section) —
      // either way, there's no confirmed-layered base class to tie against.
      if (!variant || !layered.has(variant)) continue

      for (const className of classNames) {
        for (const { selector, index } of findCompoundSelectorsForClass(cssSource, className)) {
          findings.push({
            tsxLine: lineOf(tsxSource, tag.index),
            cssLine: lineOf(cssSource, index),
            component,
            variant,
            className,
            selector,
            reason:
              `${component}'s own ".${variant}" now lives in @layer ${LAYER_NAME}, so an unlayered ` +
              `".${className}" wins the cascade unconditionally regardless of specificity — the compound ` +
              `selector "${selector}" no longer needs the extra specificity it was written for.`,
          })
        }
      }
    }
  }

  collect('Typography', typographyLayered)
  collect('Link', linkLayered)

  return findings
}

const loadLayeredClassNames = (repoRoot: string, relativeCssPath: string): Set<string> => {
  const absolutePath = resolve(repoRoot, relativeCssPath)
  const css = readFileSync(absolutePath, 'utf8')
  const block = findLayerBlock(css, LAYER_NAME)
  if (block === null) {
    throw new Error(
      `check-descendant-selectors: could not find "@layer ${LAYER_NAME}" in ${relativeCssPath} — ` +
        `has this file moved or been restructured? Update TYPOGRAPHY_CSS_PATH/LINK_CSS_PATH or the layer name.`
    )
  }
  return extractTopLevelClassNames(block)
}

/** Finds a same-directory `import styles from './X.module.css'` in a .tsx file's source, and resolves it to an absolute path. */
const resolvePairedCssPath = (tsxFile: string, tsxSource: string): string | null => {
  const importMatch = tsxSource.match(/import\s+styles\s+from\s+['"](\.[^'"]+\.module\.css)['"]/)
  if (!importMatch) return null
  return resolve(dirname(tsxFile), importMatch[1])
}

/** Scans the whole repo and returns every finding. This is the impure entry point used by the CLI and by integration tests. */
export const scanRepo = (repoRoot: string = REPO_ROOT): Finding[] => {
  const typographyLayered = loadLayeredClassNames(repoRoot, TYPOGRAPHY_CSS_PATH)
  const linkLayered = loadLayeredClassNames(repoRoot, LINK_CSS_PATH)

  const tsxFiles = globSync('src/**/*.tsx', { cwd: repoRoot, absolute: true }).filter(
    (f) => !f.endsWith('.test.tsx')
  )

  const findings: Finding[] = []

  for (const tsxFile of tsxFiles) {
    const tsxSource = readFileSync(tsxFile, 'utf8')
    if (!tsxSource.includes('<Typography') && !tsxSource.includes('<Link')) continue

    const cssPath = resolvePairedCssPath(tsxFile, tsxSource)
    if (!cssPath) continue

    let cssSource: string
    try {
      cssSource = readFileSync(cssPath, 'utf8')
    } catch {
      continue
    }

    const pairFindings = checkPair({ tsxSource, cssSource, typographyLayered, linkLayered })
    for (const finding of pairFindings) {
      findings.push({
        ...finding,
        tsxFile: relative(repoRoot, tsxFile),
        cssFile: relative(repoRoot, cssPath),
      })
    }
  }

  return findings
}

const isMainModule = (): boolean => {
  const entry = process.argv[1]
  return Boolean(entry) && resolve(entry) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  const findings = scanRepo()

  if (findings.length === 0) {
    console.log('check:descendant-selectors — no stale descendant-selector specificity workarounds found.')
    process.exit(0)
  }

  console.error(
    `check:descendant-selectors — found ${findings.length} stale descendant-selector workaround(s):\n`
  )
  for (const finding of findings) {
    console.error(
      `${finding.tsxFile}:${finding.tsxLine} — <${finding.component} variant="${finding.variant}"> ` +
        `className={styles.${finding.className}}`
    )
    console.error(`  ${finding.cssFile}:${finding.cssLine} — "${finding.selector}"`)
    console.error(`  ${finding.reason}\n`)
  }
  process.exit(1)
}
