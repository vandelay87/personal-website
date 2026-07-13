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
 * `<Typography variant="label">` is anywhere nearby). So the JSX-based check
 * below only considers a class name "tied" to a variant when the same JSX
 * tag actually applies both via React's `variant`/`className` props.
 *
 * Two independent detection mechanisms, both wired into this gate:
 *
 * 1. The `variant`-prop pattern (`checkPair`, driven by `discoverVariantComponents`):
 *    a component whose own CSS module has a real `@layer component-defaults`
 *    at-rule, discovered automatically rather than hardcoded — see
 *    `discoverVariantComponents`'s doc comment for how, and for the one
 *    known, deliberate gap (Tag).
 * 2. The `composes:`-based tie (`checkComposesTies` / `scanComposesRepo`):
 *    a consumer `.module.css` rule that `composes:` a variant from
 *    `text.module.css` on a bare class, which *also* has a separate
 *    `.ancestor .thatClass` compound selector in the same file (the
 *    pre-#334 `Recipes.module.css` shape). Pure single-file CSS
 *    cross-reference, no JSX involved — see `checkComposesTies`.
 *
 * Known limitation: `parseTagUsage`'s variant extraction only matches a
 * string-literal `variant="X"`. A dynamic `variant={cond ? 'a' : 'b'}` usage
 * would silently resolve to `variant: undefined` — indistinguishable from
 * "no variant applied" — so a compound selector tied to such a usage would
 * not be flagged. No such usage exists in the codebase today, but if one is
 * introduced this gate won't catch it.
 *
 * Known gap: Tag. `Tag.module.css` has a real `@layer component-defaults`
 * (wrapping only `.remove`), so `discoverVariantComponents` picks it up as a
 * candidate — but `Tag.tsx` has no `variant` prop at all; it uses
 * `active`/`removable` booleans instead, and `.tag` is applied
 * unconditionally (`Tag.tsx:47`). There is no `variant` string value to tie
 * a layered class name to, so the generic `variant`-pattern check in
 * `checkPair` correctly finds nothing to flag for `<Tag>` usages — not a
 * silently-swallowed false negative, just a pattern that doesn't apply here.
 * A Tag-specific check would need bespoke logic for its `active`/
 * `removeClassName` shape, which is a different mechanism and not attempted
 * here.
 */

import { readFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const TEXT_MODULE_CSS_PATH = 'src/styles/text.module.css'
const LAYER_NAME = 'component-defaults'

export interface Finding {
  tsxFile: string
  tsxLine: number
  cssFile: string
  cssLine: number
  component: string
  variant: string
  className: string
  selector: string
  reason: string
}

/** A single `composes:`-based tie finding (see `checkComposesTies`). */
export interface ComposesFinding {
  cssFile: string
  composesLine: number
  selectorLine: number
  localClassName: string
  variant: string
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

/** A component discovered by `discoverVariantComponents` (see its doc comment). */
export interface DiscoveredComponent {
  /** JSX tag name, derived from the CSS module's basename (e.g. `Typography`). */
  tag: string
  /** Path to the component's CSS module, relative to repo root. */
  cssPath: string
  /** Class names confirmed inside that CSS module's `@layer component-defaults` block. */
  layered: Set<string>
}

/** A single `composes:`-based tie found by `findTextModuleComposesTies` (see its doc comment). */
interface ComposesTie {
  localClassName: string
  variant: string
  /** Index of the `composes:` declaration itself, for line-number reporting. */
  composesIndex: number
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
 * Blanks out CSS comment bodies (replacing their characters with spaces,
 * newlines preserved) so downstream regex/index-based scanning can't match
 * inside a comment, while keeping every other character's offset identical
 * to the original text — callers can slice/report line numbers against the
 * original string using indices found in the stripped one.
 */
const stripComments = (cssText: string): string =>
  cssText.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))

/**
 * Finds the balanced-brace block belonging to `@layer <layerName>` in a CSS
 * file (handling nested `@media` blocks inside it, e.g. Link.module.css's
 * reduced-motion reset), and returns its inner content, or null if the
 * layer isn't present.
 *
 * Searches comment-stripped text for the marker: several component CSS
 * files (e.g. RecipeSteps.module.css, TagInput.module.css,
 * RecipeDetailView.module.css) merely *mention* "`@layer
 * component-defaults`" inside a prose comment explaining a fix made
 * elsewhere, with no actual `@layer component-defaults { ... }` at-rule of
 * their own — a naive raw-text search would find that comment's marker text
 * and then treat the next unrelated `{...}` block in the file as if it were
 * the layer's contents (confirmed against RecipeSteps.module.css, which
 * would otherwise resolve to its unrelated `.text { ... }` block). Stripping
 * comments first avoids that false match.
 */
export const findLayerBlock = (css: string, layerName: string): string | null => {
  const marker = `@layer ${layerName}`
  const noComments = stripComments(css)
  const markerIndex = noComments.indexOf(marker)
  if (markerIndex === -1) return null

  const openBrace = noComments.indexOf('{', markerIndex)
  if (openBrace === -1) return null

  let depth = 1
  let i = openBrace + 1
  while (i < noComments.length && depth > 0) {
    if (noComments[i] === '{') depth++
    else if (noComments[i] === '}') depth--
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
  const noComments = stripComments(cssText)
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
export const findCompoundSelectorsForClass = (cssText: string, className: string): SelectorMatch[] =>
  findCompoundSelectorsForClassInGroups(iterateSelectorGroups(cssText), className)

/**
 * Same matching logic as `findCompoundSelectorsForClass`, but operates on an
 * already-parsed `SelectorGroup[]` — lets callers that need to check several
 * class names against the same CSS text (e.g. `checkPair`'s nested loop over
 * JSX class names) parse the CSS once and filter per class name, instead of
 * re-running `iterateSelectorGroups` (a full comment-strip + split-on-`{`
 * parse) on every call.
 */
export const findCompoundSelectorsForClassInGroups = (
  groups: SelectorGroup[],
  className: string
): SelectorMatch[] => {
  const matches: SelectorMatch[] = []
  for (const { selectors, index } of groups) {
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
 * Pure core check: cross-references one .tsx file's JSX usages of any
 * discovered `variant`-prop component (Typography, Link, and any other
 * component `discoverVariantComponents` finds) against its paired
 * .module.css's compound descendant selectors. No file I/O — callers
 * (scanRepo, or tests) supply the source text and the discovered
 * components' confirmed-layered class name sets directly.
 */
export const checkPair = (params: {
  tsxSource: string
  cssSource: string
  components: Array<Pick<DiscoveredComponent, 'tag' | 'layered'>>
}): Array<Omit<Finding, 'tsxFile' | 'cssFile'>> => {
  const { tsxSource, cssSource, components } = params
  const findings: Array<Omit<Finding, 'tsxFile' | 'cssFile'>> = []
  const cssGroups = iterateSelectorGroups(cssSource)

  for (const { tag: component, layered } of components) {
    for (const tag of extractJsxTags(tsxSource, component)) {
      const { variant, classNames } = parseTagUsage(tag.text)
      // No variant → either the component's `variant` prop is required and
      // this wouldn't typecheck (Typography), or a default/unlayered
      // fallback applies instead (Link's `tone` classes), or the component
      // has no `variant` prop at all (Tag — see this file's header comment)
      // — either way, there's no confirmed-layered base class to tie against.
      if (!variant || !layered.has(variant)) continue

      for (const className of classNames) {
        for (const { selector, index } of findCompoundSelectorsForClassInGroups(cssGroups, className)) {
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

  return findings
}

/**
 * Discovers every component using the same `variant`-prop shape as
 * Typography/Link: a component CSS module (`src/components/**\/*.module.css`)
 * with a real `@layer component-defaults` at-rule of its own. The component's
 * JSX tag name is derived from the file's basename (`Typography.module.css`
 * -> `Typography`, `Link.module.css` -> `Link`) — this also picks up
 * `Button.module.css` automatically once Button's variant rules move into
 * the layer (`Button.tsx` already has an identical
 * `variant?: 'solid' | 'outline' | 'danger'` shape), with no code change
 * needed here.
 *
 * This is a *candidate* list, not a guarantee every candidate has a matching
 * `variant` prop — `checkPair` still only flags a candidate when the same
 * JSX tag actually passes a `variant="X"` matching one of its own layered
 * class names. That's precisely how Tag (a real `@layer component-defaults`
 * wrapping `.remove`, but no `variant` prop on `Tag.tsx`) ends up discovered
 * as a candidate yet never produces a finding: `parseTagUsage` never finds a
 * `variant=` value on any `<Tag>` usage, so `!variant` short-circuits every
 * time. See this file's header comment for why a Tag-specific check isn't
 * attempted here.
 */
export const discoverVariantComponentsFromSources = (
  files: Array<{ path: string; source: string }>
): DiscoveredComponent[] => {
  const discovered: DiscoveredComponent[] = []

  for (const { path, source } of files) {
    const block = findLayerBlock(source, LAYER_NAME)
    if (block === null) continue

    discovered.push({
      tag: basename(path, '.module.css'),
      cssPath: path,
      layered: extractTopLevelClassNames(block),
    })
  }

  return discovered
}

/** Impure wrapper around `discoverVariantComponentsFromSources`: globs+reads component CSS modules off disk. */
const discoverVariantComponents = (repoRoot: string): DiscoveredComponent[] => {
  const cssFiles = globSync('src/components/**/*.module.css', { cwd: repoRoot, absolute: true })
  const files = cssFiles.map((absPath) => ({
    path: relative(repoRoot, absPath),
    source: readFileSync(absPath, 'utf8'),
  }))
  return discoverVariantComponentsFromSources(files)
}

const loadLayeredClassNames = (repoRoot: string, relativeCssPath: string): Set<string> => {
  const absolutePath = resolve(repoRoot, relativeCssPath)
  const css = readFileSync(absolutePath, 'utf8')
  const block = findLayerBlock(css, LAYER_NAME)
  if (block === null) {
    throw new Error(
      `check-descendant-selectors: could not find "@layer ${LAYER_NAME}" in ${relativeCssPath} — ` +
        `has this file moved, been restructured, or lost its layer?`
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

/**
 * Scans the whole repo for the `variant`-prop anti-pattern (extension 1) and
 * returns every finding. This is the impure entry point used by the CLI and
 * by integration tests. Component discovery (`discoverVariantComponents`)
 * runs fresh each call rather than being hardcoded to Typography/Link.
 */
export const scanRepo = (repoRoot: string = REPO_ROOT): Finding[] => {
  const components = discoverVariantComponents(repoRoot)

  const tsxFiles = globSync('src/**/*.tsx', { cwd: repoRoot, absolute: true }).filter(
    (f) => !f.endsWith('.test.tsx')
  )

  const findings: Finding[] = []

  for (const tsxFile of tsxFiles) {
    const tsxSource = readFileSync(tsxFile, 'utf8')
    if (!components.some(({ tag }) => tsxSource.includes(`<${tag}`))) continue

    const cssPath = resolvePairedCssPath(tsxFile, tsxSource)
    if (!cssPath) continue

    let cssSource: string
    try {
      cssSource = readFileSync(cssPath, 'utf8')
    } catch {
      continue
    }

    const pairFindings = checkPair({ tsxSource, cssSource, components })
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

/**
 * Extension 2: the `composes:`-based tie (the pre-#334 `Recipes.module.css`
 * shape). Finds every bare single-class rule in a `.module.css` file that
 * `composes:` a name from `text.module.css`, i.e.:
 *
 *   .someLocalClass {
 *     composes: someVariant from '../../styles/text.module.css';
 *   }
 *
 * `importPath` is resolved relative to `cssFilePath`'s own directory since
 * consumers sit at varying depths (e.g. `src/pages/Recipes/Recipes.module.css`'s
 * `'../../styles/text.module.css'`). Pure — no file I/O, `textModulePath`
 * is supplied resolved by the caller.
 */
const findTextModuleComposesTies = (params: {
  cssSource: string
  cssFilePath: string
  repoRoot: string
  textModuleAbsPath: string
}): ComposesTie[] => {
  const { cssSource, cssFilePath, repoRoot, textModuleAbsPath } = params
  const consumerDir = dirname(resolve(repoRoot, cssFilePath))
  const ties: ComposesTie[] = []

  for (const { selectors, index } of iterateSelectorGroups(cssSource)) {
    // composes: is only valid on a simple single-class selector — a bare
    // `.someLocalClass`, never a compound one — so this only ever matches
    // the "tie" side of the pattern, not the descendant-selector side.
    if (selectors.length !== 1 || !/^\.[\w-]+$/.test(selectors[0])) continue
    const localClassName = selectors[0].slice(1)

    const openBrace = cssSource.indexOf('{', index)
    if (openBrace === -1) continue
    let depth = 1
    let i = openBrace + 1
    while (i < cssSource.length && depth > 0) {
      if (cssSource[i] === '{') depth++
      else if (cssSource[i] === '}') depth--
      i++
    }
    const body = cssSource.slice(openBrace + 1, i - 1)

    const composesRe = /\bcomposes:\s*([^;]+?)\s+from\s+['"]([^'"]+)['"]/g
    let match: RegExpExecArray | null
    while ((match = composesRe.exec(body))) {
      const [, namesRaw, importPath] = match
      if (resolve(consumerDir, importPath) !== textModuleAbsPath) continue

      const composesIndex = openBrace + 1 + match.index
      for (const variant of namesRaw.trim().split(/\s+/).filter(Boolean)) {
        ties.push({ localClassName, variant, composesIndex })
      }
    }
  }

  return ties
}

/**
 * Pure core check for extension 2: cross-references a single `.module.css`
 * file's `composes:`-from-`text.module.css` ties against compound
 * descendant selectors for the *same* local class name, in the *same*
 * file. Unlike `checkPair`, this needs no JSX — it's a pure single-file CSS
 * cross-reference, which is what makes it a separate, simpler function
 * rather than a variant of `checkPair`.
 */
export const checkComposesTies = (params: {
  cssSource: string
  cssFilePath: string
  repoRoot: string
  textModuleAbsPath: string
  textModuleLayered: Set<string>
}): ComposesFinding[] => {
  const { cssSource, cssFilePath, repoRoot, textModuleAbsPath, textModuleLayered } = params
  const cssGroups = iterateSelectorGroups(cssSource)
  const ties = findTextModuleComposesTies({ cssSource, cssFilePath, repoRoot, textModuleAbsPath })
  const findings: ComposesFinding[] = []

  for (const { localClassName, variant, composesIndex } of ties) {
    if (!textModuleLayered.has(variant)) continue

    for (const { selector, index } of findCompoundSelectorsForClassInGroups(cssGroups, localClassName)) {
      findings.push({
        cssFile: cssFilePath,
        composesLine: lineOf(cssSource, composesIndex),
        selectorLine: lineOf(cssSource, index),
        localClassName,
        variant,
        selector,
        reason:
          `text.module.css's own ".${variant}" now lives in @layer ${LAYER_NAME}, so the bare ` +
          `".${localClassName}" (composes: ${variant} from text.module.css) wins the cascade ` +
          `unconditionally regardless of specificity — the compound selector "${selector}" no longer ` +
          `needs the extra specificity it was written for.`,
      })
    }
  }

  return findings
}

/** Scans the whole repo for the `composes:`-based tie anti-pattern (extension 2) and returns every finding. */
export const scanComposesRepo = (repoRoot: string = REPO_ROOT): ComposesFinding[] => {
  const textModuleAbsPath = resolve(repoRoot, TEXT_MODULE_CSS_PATH)
  const textModuleLayered = loadLayeredClassNames(repoRoot, TEXT_MODULE_CSS_PATH)

  const cssFiles = globSync('src/**/*.module.css', { cwd: repoRoot, absolute: true }).filter(
    (f) => resolve(f) !== textModuleAbsPath
  )

  const findings: ComposesFinding[] = []

  for (const absPath of cssFiles) {
    const cssSource = readFileSync(absPath, 'utf8')
    if (!cssSource.includes('composes:')) continue

    findings.push(
      ...checkComposesTies({
        cssSource,
        cssFilePath: relative(repoRoot, absPath),
        repoRoot,
        textModuleAbsPath,
        textModuleLayered,
      })
    )
  }

  return findings
}

const isMainModule = (): boolean => {
  const entry = process.argv[1]
  return Boolean(entry) && resolve(entry) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  const findings = scanRepo()
  const composesFindings = scanComposesRepo()
  const total = findings.length + composesFindings.length

  if (total === 0) {
    console.log('check:descendant-selectors — no stale descendant-selector specificity workarounds found.')
    process.exit(0)
  }

  console.error(`check:descendant-selectors — found ${total} stale descendant-selector workaround(s):\n`)

  for (const finding of findings) {
    console.error(
      `${finding.tsxFile}:${finding.tsxLine} — <${finding.component} variant="${finding.variant}"> ` +
        `className={styles.${finding.className}}`
    )
    console.error(`  ${finding.cssFile}:${finding.cssLine} — "${finding.selector}"`)
    console.error(`  ${finding.reason}\n`)
  }

  for (const finding of composesFindings) {
    console.error(
      `${finding.cssFile}:${finding.composesLine} — .${finding.localClassName} composes: ${finding.variant} ` +
        `from text.module.css`
    )
    console.error(`  ${finding.cssFile}:${finding.selectorLine} — "${finding.selector}"`)
    console.error(`  ${finding.reason}\n`)
  }

  process.exit(1)
}
