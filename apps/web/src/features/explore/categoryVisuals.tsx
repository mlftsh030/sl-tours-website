import { Clapperboard, Compass, Flag, Footprints, Landmark, Mountain, Palette, PawPrint, Route, Smile, Snowflake, UtensilsCrossed, Waves, Wine,
  type LucideIcon } from "lucide-react";
import type { ActivityCategory } from "../../types/api";

/** Icons for activities without a photograph: a branded tile instead of a misleading stock image. */
export const categoryIcons: Record<ActivityCategory, LucideIcon> = {
  NATURE: Mountain, WILDLIFE: PawPrint, MUSEUM_HISTORY: Landmark, ART_CULTURE: Palette, WINE: Wine, FOOD_MARKET: UtensilsCrossed, BEACH: Waves,
  HIKING: Footprints, SCENIC_DRIVE: Route, FAMILY_LEISURE: Smile, GO_KARTING: Flag, ICE_SKATING: Snowflake, CINEMA: Clapperboard, ADVENTURE: Compass
};

export function CategoryTile({ category, label }: { category: ActivityCategory; label?: string }) {
  const Icon = categoryIcons[category] ?? Compass;
  return <span className={`category-tile category-${category.toLowerCase()}`} aria-hidden="true">
    <Icon />{label && <span>{label}</span>}
  </span>;
}
