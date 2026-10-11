import type { ComponentType } from "react";
import {
  PizzaIcon,
  BurgerIcon,
  CurryIcon,
  BiryaniIcon,
  NoodlesIcon,
  DosaIcon,
  CoffeeIcon,
  DessertIcon,
  SaladIcon,
  WrapIcon,
  UtensilsIcon,
} from "./CuisineIcons";
import type { CuisineIconProps } from "./CuisineIcons";

const cuisineAliases: Record<string, ComponentType<CuisineIconProps>> = {
  pizza: PizzaIcon,
  burger: BurgerIcon,
  biryani: BiryaniIcon,
  dosa: DosaIcon,
  south: DosaIcon,
  idli: DosaIcon,
  noodle: NoodlesIcon,
  chinese: NoodlesIcon,
  momo: NoodlesIcon,
  coffee: CoffeeIcon,
  cafe: CoffeeIcon,
  tea: CoffeeIcon,
  dessert: DessertIcon,
  cake: DessertIcon,
  sweet: DessertIcon,
  bakery: DessertIcon,
  ice: DessertIcon,
  salad: SaladIcon,
  healthy: SaladIcon,
  roll: WrapIcon,
  wrap: WrapIcon,
  shawarma: WrapIcon,
  curry: CurryIcon,
  north: CurryIcon,
  thali: CurryIcon,
};

/** Best-effort icon for a free-form cuisine label; falls back to utensils. */
export function getCuisineIcon(
  cuisine: string,
): ComponentType<CuisineIconProps> {
  const key = cuisine.toLowerCase();
  for (const [alias, icon] of Object.entries(cuisineAliases)) {
    if (key.includes(alias)) return icon;
  }
  return UtensilsIcon;
}
