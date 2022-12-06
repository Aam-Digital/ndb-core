import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from "@angular/core";
import * as L from "leaflet";
import { Observable, Subject } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";

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

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent<T extends Entity = Entity> implements AfterViewInit {
  // TODO this should be configurable
  private readonly start_location: L.LatLngTuple = [52.4790412, 13.4319106];
  private hueOffset = 145;

  @Input() set marked(coordinates: Coordinates | Coordinates[]) {
    if (!coordinates) {
      return;
    }
    if (Array.isArray(coordinates)) {
      this.clearMarkers(this.markers);
      this.markers = this.setMultipleMarkers(coordinates);
      this.showMarkersOnMap(this.markers);
    } else {
      this.setMarker(coordinates);
      this.showMarkersOnMap(this.marker);
    }
  }

  @Input() set entities(entities: { entity: T; property: string }[]) {
    this.clearMarkers(this.markers);
    this.markers = this.createEntityMarkers(entities);
    this.showMarkersOnMap(this.markers);
  }

  @Input() set highlightedEntities(
    entities: { entity: T; property: string }[]
  ) {
    this.clearMarkers(this.highlightedMarkers);
    this.highlightedMarkers = this.createEntityMarkers(entities);
    this.showMarkersOnMap(this.highlightedMarkers, true);
  }

  private map: L.Map;
  private marker: L.Marker;
  private markers: L.Marker[];
  private highlightedMarkers: L.Marker[];
  private clickStream = new Subject<L.LatLng>();
  // TODO filter out double clicks
  @Output() mapClick: Observable<Coordinates> = this.clickStream.pipe(
    debounceTime(200),
    map((c) => ({ lat: c.lat, lon: c.lng }))
  );

  @Output() entityClick = new EventEmitter<T>();

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map("map", {
      center: this.marker ? this.marker.getLatLng() : this.start_location,
      zoom: 14,
    });
    this.map.addEventListener("click", (res) =>
      this.clickStream.next(res.latlng)
    );

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);

    this.showMarkersOnMap(this.marker);
    this.showMarkersOnMap(this.markers);
    this.showMarkersOnMap(this.highlightedMarkers, true);
  }

  private createEntityMarkers(entities: { entity: T; property: string }[]) {
    return entities
      .filter(({ entity, property }) => !!entity?.[property])
      .map(({ entity, property }) => {
        const marker = L.marker([entity[property].lat, entity[property].lon]);
        marker.bindTooltip(entity.toString());
        marker.on("click", () => this.entityClick.emit(entity));
        return marker;
      });
  }

  private clearMarkers(markers: L.Marker[]) {
    if (markers?.length > 0 && this.map) {
      markers.forEach((marker) => marker.removeFrom(this.map));
    }
  }

  private setMultipleMarkers(coordinates: Coordinates[]) {
    return coordinates
      .filter((coord) => !!coord)
      .map((coord) => L.marker([coord.lat, coord.lon]));
  }

  private setMarker(coordinates: Coordinates) {
    const latLon = new L.LatLng(coordinates.lat, coordinates.lon);
    if (!this.marker) {
      this.marker = L.marker(latLon);
    } else {
      this.marker.setLatLng(latLon);
    }
  }

  private showMarkersOnMap(marker: L.Marker | L.Marker[], highlighted = false) {
    if (
      !marker ||
      !this.map ||
      (Array.isArray(marker) && marker.length === 0)
    ) {
      return;
    }
    if (Array.isArray(marker)) {
      marker.forEach((m) => this.addMarker(m, highlighted));
      const group = L.featureGroup(marker);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
    } else {
      if (this.marker) {
        this.addMarker(this.marker, highlighted);
        this.map.flyTo(this.marker.getLatLng());
      }
    }
  }

  private addMarker(m: L.Marker, highlighted = false) {
    m.addTo(this.map);
    if (highlighted) {
      m["_icon"].classList.add("highlighted");
    }
    return m;
  }

  /**
   * Translates a hex color to the necessary hue-rotate filter
   * TODO need to find out how to dynamically create classes or css attributes for marker icons
   * @param entity
   */
  getHueRotation(entity: T): number {
    const color = entity.getConstructor().color;
    let r = parseInt(color.substring(1, 2), 16) / 255; // Grab the hex representation of red (chars 1-2) and convert to decimal (base 10).
    let g = parseInt(color.substring(3, 2), 16) / 255;
    let b = parseInt(color.substring(5, 2), 16) / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return h * 360 + (this.hueOffset % 360);
  }
}
