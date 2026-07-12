import type { FC, HTMLAttributes, ReactNode } from 'react'

export interface SemanticListProps extends HTMLAttributes<HTMLUListElement> {
  children?: ReactNode
}

export interface SemanticListItemProps extends HTMLAttributes<HTMLLIElement> {
  children?: ReactNode
}

// `list-style: none` (applied by callers via `className`) drops the implicit
// list/listitem semantics of <ul>/<li> in Safari/VoiceOver; role="list" on
// SemanticList paired with role="listitem" on each SemanticListItem restores it.
export const SemanticListItem: FC<SemanticListItemProps> = ({ children, ...rest }) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above SemanticListItem
  <li role="listitem" {...rest}>
    {children}
  </li>
)

const SemanticList: FC<SemanticListProps> = ({ children, ...rest }) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above SemanticListItem
  <ul role="list" {...rest}>
    {children}
  </ul>
)

export default SemanticList
