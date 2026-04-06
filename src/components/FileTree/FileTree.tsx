import type { FC, ReactNode } from 'react'

import styles from './FileTree.module.css'

export interface FileTreeProps {
  content: string
  title?: string
}

interface TreeNode {
  name: string
  isFolder: boolean
  children: TreeNode[]
}

export function parseTree(text: string): TreeNode[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  const root: TreeNode[] = []
  const stack: { indent: number; children: TreeNode[] }[] = [{ indent: -1, children: root }]

  for (let line of lines) {
    line = line.replace(/\t/g, '  ')
    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length
    const isFolder = trimmed.endsWith('/')
    const node: TreeNode = { name: trimmed, isFolder, children: [] }

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    stack[stack.length - 1].children.push(node)

    if (isFolder) {
      stack.push({ indent, children: node.children })
    }
  }

  return root
}

function renderNodes(nodes: TreeNode[], isRoot: boolean): ReactNode {
  if (nodes.length === 0) return null

  return (
    <ul className={isRoot ? styles.rootList : styles.list} {...(!isRoot && { role: 'group' })}>
      {nodes.map((node, index) => (
        <li key={`${node.name}-${index}`} className={styles.item} role="treeitem">
          <span>{node.isFolder ? '📁 ' : '📄 '}{node.name}</span>
          {node.children.length > 0 && renderNodes(node.children, false)}
        </li>
      ))}
    </ul>
  )
}

const FileTree: FC<FileTreeProps> = ({ content, title }) => {
  if (!content.trim()) {
    return <div className={styles.tree} />
  }

  const tree = parseTree(content)

  return (
    <div className={styles.tree} role="tree">
      {title && <div className={styles.title}>{title}</div>}
      {renderNodes(tree, true)}
    </div>
  )
}

export default FileTree
