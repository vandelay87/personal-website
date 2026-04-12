export const useReorderableList = <T>(initial: T[]) => ({
  items: initial,
  add: (_item: T) => {},
  remove: (_index: number) => {},
  update: (_index: number, _item: T) => {},
  moveUp: (_index: number) => {},
  moveDown: (_index: number) => {},
})
