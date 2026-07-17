/** `pluralize(2, 'post')` -> `'2 posts'`; `pluralize(1, 'post')` -> `'1 post'`. */
export const pluralize = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`
