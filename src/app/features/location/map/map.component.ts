import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import * as L from "leaflet";
import { Observable, Subject } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { getHueForEntity } from "../map-utils";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
})
export class MapComponent<T extends Entity = Entity> implements AfterViewInit {
  // TODO this should be configurable
  private readonly start_location: L.LatLngTuple = [52.4790412, 13.4319106];

  @Input() height = "200px";

  @Input() set marked(coordinates: Coordinates[]) {
    this.clearMarkers(this.markers);
    this.markers = this.setMultipleMarkers(coordinates);
    this.showMarkersOnMap(this.markers);
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
    // init Map
    this.map = L.map("map", {
      center:
        this.markers?.length > 0
          ? this.markers[0].getLatLng()
          : this.start_location,
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
        marker["entity"] = entity;
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

  private showMarkersOnMap(marker: L.Marker[], highlighted = false) {
    if (!marker || !this.map || marker.length === 0) {
      return;
    }
    marker.forEach((m) => this.addMarker(m, highlighted));
    const group = L.featureGroup(marker);
    this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
  }

  private addMarker(m: L.Marker, highlighted: boolean = false) {
    m.addTo(this.map);
    const entity = m["entity"] as T;
    if (highlighted || entity) {
      const degree = highlighted ? "145" : getHueForEntity(entity);
      const icon = m["_icon"] as HTMLElement;
      icon.style.filter = `hue-rotate(${degree}deg)`;
    }
    return m;
  }
}
