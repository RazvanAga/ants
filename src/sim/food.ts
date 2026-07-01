/**
 * A food source (docs/CONTEXT.md): a placed, depletable object with a position
 * and a remaining quantity of crumbs. Ants take one crumb per visit; when its
 * quantity reaches zero it disappears. `initialCrumbs` is kept so rendering can
 * shrink the blob as it depletes.
 */
export interface FoodSource {
  x: number;
  y: number;
  crumbs: number;
  initialCrumbs: number;
}

export function makeFoodSource(x: number, y: number, crumbs: number): FoodSource {
  return { x, y, crumbs, initialCrumbs: crumbs };
}
