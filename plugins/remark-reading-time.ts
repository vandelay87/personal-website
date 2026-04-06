import type { Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

const WORDS_PER_MINUTE = 200

export const calculateReadingTime = (text: string): number => {
  const words = text.split(/\s+/).filter(Boolean)
  return Math.ceil(words.length / WORDS_PER_MINUTE)
}

const remarkReadingTime = () => {
  return (tree: Root) => {
    let textContent = ''

    visit(tree, 'text', (node: Text) => {
      textContent += node.value + ' '
    })

    const readingTime = calculateReadingTime(textContent)

    tree.children.push({
      type: 'mdxjsEsm',
      value: `export const readingTime = ${readingTime}`,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              specifiers: [],
              source: null,
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [
                  {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'readingTime' },
                    init: {
                      type: 'Literal',
                      value: readingTime,
                      raw: String(readingTime),
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    } as unknown as Root['children'][number])
  }
}

export default remarkReadingTime
