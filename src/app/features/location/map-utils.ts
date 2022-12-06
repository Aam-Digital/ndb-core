import { Entity } from "../../core/entity/model/entity";
import * as L from "leaflet";

const iconRetinaUrl = "assets/marker-icon-2x.png";
const iconUrl = "assets/marker-icon.png";
const shadowUrl = "assets/marker-shadow.png";
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

/**
 * Translates the color of an entity to the necessary hue-rotate filter
 * @param entity to get color from
 * @param offset hue offset which should be added on top.
 *  default 145 (rough guess of the default leaflet marker icon)
 *
 */
export function getHueForEntity(entity: Entity, offset = 145): string {
  // Grab the hex representation and convert to decimal (base 10).
  const color = entity.getConstructor().color;
  const r = parseInt(color.substring(1, 3), 16) / 255;
  const g = parseInt(color.substring(3, 5), 16) / 255;
  const b = parseInt(color.substring(5, 7), 16) / 255;
  const hue = getHue(r, g, b);
  const offsetHue = (hue * 360 + offset) % 360;

  return offsetHue.toFixed(0);
}

/**
 * Source {@link https://gist.github.com/mjackson/5311256}
 */
function getHue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max == min) {
    return 0; // achromatic
  }

  const d = max - min;
  switch (max) {
    case r:
      return ((g - b) / d + (g < b ? 6 : 0)) / 6;
    case g:
      return ((b - r) / d + 2) / 6;
    case b:
      return ((r - g) / d + 4) / 6;
  }
}
