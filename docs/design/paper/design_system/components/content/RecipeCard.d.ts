import * as React from 'react';

/**
 * @startingPoint section="Content" subtitle="Recipe grid card — cover, title, meta" viewport="700x340"
 */
export interface RecipeCardProps {
  href?: string;
  img?: string;
  title: string;
  desc?: string;
  prep?: string;
  cook?: string;
  serves?: string;
}

export function RecipeCard(props: RecipeCardProps): JSX.Element;
