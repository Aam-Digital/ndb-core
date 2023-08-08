import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import * as L from "leaflet";
import { Coordinates } from "./coordinates";
import { getHue } from "../../utils/style-utils";
import { locationEntitySchemaDataType } from "./location-data-type";

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
  if (!color) {
    return "0";
  }
  const r = parseInt(color.substring(1, 3), 16) / 255;
  const g = parseInt(color.substring(3, 5), 16) / 255;
  const b = parseInt(color.substring(5, 7), 16) / 255;
  const hue = getHue(r, g, b);
  const offsetHue = (hue * 360 + offset) % 360;

  return offsetHue.toFixed(0);
}

/**
 * Calculate distance between two points
 * Source {@link https://henry-rossiter.medium.com/calculating-distance-between-geographic-coordinates-with-javascript-5f3097b61898}
 * @param x
 * @param y
 */
export function getKmDistance(x: Coordinates, y: Coordinates) {
  const R = 6371e3;
  const p1 = (x.lat * Math.PI) / 180;
  const p2 = (y.lat * Math.PI) / 180;
  const deltaP = p2 - p1;
  const deltaLon = y.lon - x.lon;
  const deltaLambda = (deltaLon * Math.PI) / 180;
  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) *
      Math.cos(p2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
  return d / 1000;
}

/**
 * Get all properties of an entity that represent a geographic location
 * @param entity
 */
export function getLocationProperties(entity: EntityConstructor) {
  return [...entity.schema.entries()]
    .filter(
      ([_, schema]) => schema.dataType === locationEntitySchemaDataType.name,
    )
    .map(([name]) => name);
}
