import Button from '@components/Button'
import { iconChevronDown, iconChevronUp, iconRemove } from '@components/iconGlyphs'
import type { FC } from 'react'

export interface ReorderControlsProps {
  index: number
  count: number
  itemLabel: string
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onRemove: (index: number) => void
  moveActionClassName: string
  removeActionClassName: string
}

const ReorderControls: FC<ReorderControlsProps> = ({
  index,
  count,
  itemLabel,
  onMoveUp,
  onMoveDown,
  onRemove,
  moveActionClassName,
  removeActionClassName,
}) => (
  <>
    <Button
      onClick={() => onMoveUp(index)}
      ariaLabel={`Move up ${itemLabel} ${index + 1}`}
      variant="outline"
      disabled={index === 0}
      className={moveActionClassName}
    >
      {iconChevronUp}
    </Button>
    <Button
      onClick={() => onMoveDown(index)}
      ariaLabel={`Move down ${itemLabel} ${index + 1}`}
      variant="outline"
      disabled={index === count - 1}
      className={moveActionClassName}
    >
      {iconChevronDown}
    </Button>
    <Button
      onClick={() => onRemove(index)}
      ariaLabel={`Remove ${itemLabel} ${index + 1}`}
      variant="outline"
      disabled={count <= 1}
      className={removeActionClassName}
    >
      {iconRemove}
    </Button>
  </>
)

export default ReorderControls
