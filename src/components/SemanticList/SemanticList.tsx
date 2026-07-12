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
// `role` is spread last so it can never be silently overridden by a caller.
export const SemanticListItem: FC<SemanticListItemProps> = ({ children, ...rest }) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above
  <li {...rest} role="listitem">
    {children}
  </li>
)

const SemanticList: FC<SemanticListProps> = ({ children, ...rest }) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- not redundant, see comment above
  <ul {...rest} role="list">
    {children}
  </ul>
)

export default SemanticList
