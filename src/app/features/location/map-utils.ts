import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import * as L from "leaflet";
import { Coordinates } from "./coordinates";
import { GeoLocation } from "./geo-location";
import { LocationDatatype } from "./location.datatype";

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
 * Creates a custom colored marker icon using Leaflet's DivIcon.
 * This approach ensures accurate color representation for all colors,
 * overcoming the limitations of the hue-rotate filter which cannot
 * properly handle achromatic colors or accurately represent all RGB values.
 *
 * Based on: https://stackoverflow.com/a/40870439/1473411
 *
 * @param color Hex or RGB color string for the marker
 * @returns Leaflet DivIcon with the specified color
 */
export function createColoredDivIcon(color: string): L.DivIcon {
  // Ensure the color has full opacity (strip any alpha channel)
  // Some colors might come as rgba or with alpha, we need solid colors for proper opacity control
  let solidColor = color;
  if (color.startsWith("rgba")) {
    // Convert rgba to rgb
    solidColor = color.replace(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
      "rgb($1, $2, $3)",
    );
  } else if (color.length === 9 && color.startsWith("#")) {
    // Strip alpha channel from 8-digit hex (#RRGGBBAA)
    solidColor = color.substring(0, 7);
  }

  const markerHtmlStyles = `
    background-color: ${solidColor};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -0.5rem;
    top: -2rem;
    position: relative;
    border-radius: 2rem 2rem 0;
    transform: rotate(45deg);
    border: 2px solid #fff;
    box-shadow: 0 3px 6px rgba(0,0,0,0.4)`;

  return L.divIcon({
    className: "",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}" />`,
  });
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
 * Calculate the minimum distance (km) between an entity's location fields
 * and a list of comparison coordinates. Returns null if no distance can be
 * computed.
 */
export function getMinDistanceKm(
  entity: Entity,
  coordinatesProperties: string[],
  compareCoordinates: Coordinates[],
): number | null {
  if (!coordinatesProperties?.length || !compareCoordinates?.length) {
    return null;
  }

  let results: number | null = null;
  const entityLocations = entity as unknown as Record<
    string,
    GeoLocation | undefined
  >;

  for (const prop of coordinatesProperties) {
    const geoLookup = entityLocations[prop]?.geoLookup;
    if (!geoLookup) {
      continue;
    }
    for (const compareCoord of compareCoordinates) {
      if (!compareCoord) {
        continue;
      }
      const distance = getKmDistance(geoLookup, compareCoord);
      results = results === null ? distance : Math.min(distance, results);
    }
  }

  return results;
}

/**
 * Get all properties of an entity that represent a geographic location
 * @param entity
 */
export function getLocationProperties(entity: EntityConstructor) {
  return [...entity.schema.entries()]
    .filter(([_, schema]) => schema.dataType === LocationDatatype.dataType)
    .map(([name]) => name);
}
