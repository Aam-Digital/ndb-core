import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import * as L from "leaflet";
import { BehaviorSubject, Observable, timeInterval } from "rxjs";
import { debounceTime, filter, map } from "rxjs/operators";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { getHueForEntity } from "../map-utils";
import { ConfigService } from "../../../core/config/config.service";
import { MAP_CONFIG_KEY, MapConfig } from "../map-config";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MapPopupConfig } from "../map-popup/map-popup.component";
import { MapPropertiesPopupComponent } from "../../matching-entities/matching-entities/map-properties-popup/map-properties-popup.component";

export interface LocationEntity {
  entity: Entity;
  property: string | string[];
  selected: string[];
}

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
  imports: [FontAwesomeModule, NgIf, MatButtonModule],
  standalone: true,
})
export class MapComponent implements AfterViewInit {
  private readonly start_location: L.LatLngTuple = [52.4790412, 13.4319106];

  @ViewChild("map") private mapElement: ElementRef<HTMLDivElement>;

  @Input() height = "200px";
  @Input() expandable = false;

  @Input() set marked(coordinates: Coordinates[]) {
    if (!coordinates) {
      return;
    }
    this.clearMarkers(this.markers);
    this.markers = this.createMarkers(coordinates);
    this.showMarkersOnMap(this.markers);
    this._marked.next(coordinates);
  }

  private _marked = new BehaviorSubject<Coordinates[]>([]);

  @Input() set entities(entities: LocationEntity[]) {
    if (!entities) {
      return;
    }
    this.clearMarkers(this.markers);
    this.markers = this.createEntityMarkers(entities);
    this.showMarkersOnMap(this.markers);
    this._entities.next(entities);
  }

  private _entities = new BehaviorSubject<LocationEntity[]>([]);

  @Input() set highlightedEntities(entities: LocationEntity[]) {
    if (!entities) {
      return;
    }
    this.clearMarkers(this.highlightedMarkers);
    this.highlightedMarkers = this.createEntityMarkers(entities);
    this.showMarkersOnMap(this.highlightedMarkers, true);
    this._highlightedEntities.next(entities);
  }

  private _highlightedEntities = new BehaviorSubject<LocationEntity[]>([]);

  private map: L.Map;
  private markers: L.Marker[];
  private highlightedMarkers: L.Marker[];
  private clickStream = new EventEmitter<Coordinates>();

  @Output() mapClick: Observable<Coordinates> = this.clickStream.pipe(
    timeInterval(),
    debounceTime(400),
    filter(({ interval }) => interval >= 400),
    map(({ value }) => value)
  );

  @Output() entityClick = new EventEmitter<Entity>();

  constructor(configService: ConfigService, private dialog: MatDialog) {
    const config = configService.getConfig<MapConfig>(MAP_CONFIG_KEY);
    if (config?.start) {
      this.start_location = config.start;
    }
  }

  ngAfterViewInit() {
    // init Map
    this.map = L.map(this.mapElement.nativeElement, {
      center:
        this.markers?.length > 0
          ? this.markers[0].getLatLng()
          : this.start_location,
      zoom: 14,
    });
    this.map.addEventListener("click", (res) =>
      this.clickStream.emit({ lat: res.latlng.lat, lon: res.latlng.lng })
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
    // this is necessary to remove gray spots when directly opening app on a page with the map
    setTimeout(() => this.map.invalidateSize());

    this.showMarkersOnMap(this.markers);
    this.showMarkersOnMap(this.highlightedMarkers, true);
  }

  private showMarkersOnMap(marker: L.Marker[], highlighted = false) {
    if (!marker || !this.map || marker.length === 0) {
      return;
    }
    marker.forEach((m) => this.addMarker(m, highlighted));
    const group = L.featureGroup(marker);
    this.map.fitBounds(group.getBounds(), {
      padding: [50, 50],
      maxZoom: this.map.getZoom(),
    });
  }

  private createEntityMarkers(entities: LocationEntity[]) {
    const markers: L.Marker[] = [];
    entities.forEach(({ entity, selected }) => {
      const propArr = Array.isArray(selected) ? selected : [selected];
      propArr
        .filter((prop) => !!entity?.[prop])
        .forEach((prop) => {
          const marker = L.marker([entity[prop].lat, entity[prop].lon]);
          marker.bindTooltip(entity.toString());
          marker.on("click", () => this.entityClick.emit(entity));
          marker["entity"] = entity;
          markers.push(marker);
        });
    });
    return markers;
  }

  private clearMarkers(markers: L.Marker[]) {
    if (markers?.length > 0 && this.map) {
      markers.forEach((marker) => marker.removeFrom(this.map));
    }
  }

  private createMarkers(coordinates: Coordinates[]) {
    return coordinates
      .filter((coord) => !!coord)
      .map((coord) => L.marker([coord.lat, coord.lon]));
  }

  private addMarker(m: L.Marker, highlighted: boolean = false) {
    m.addTo(this.map);
    const entity = m["entity"] as Entity;
    if (highlighted || entity) {
      const degree = entity ? getHueForEntity(entity) : "145";
      const icon = m["_icon"] as HTMLElement;
      icon.style.filter = `hue-rotate(${degree}deg)`;
      icon.style.opacity = highlighted ? "1" : "0.5";
    }
    return m;
  }

  async openMapInPopup() {
    // Breaking circular dependency by using async import
    const mapComponent = await import("../map-popup/map-popup.component");
    this.dialog.open(mapComponent.MapPopupComponent, {
      width: "90%",
      data: {
        marked: this._marked,
        entities: this._entities,
        highlightedEntities: this._highlightedEntities,
        entityClick: this.entityClick,
        mapClick: this.clickStream,
      } as MapPopupConfig,
    });
  }

  openMapPropertiesPopup() {
    const entities = this._entities.value.concat(
      ...this._highlightedEntities.value
    );
    const mapProperties: { [key in string]: string[] } = {};
    entities
      .filter(({ entity }) => !!entity)
      .forEach(({ entity, property }) => {
        mapProperties[entity.getType()] = Array.isArray(property)
          ? property
          : [property];
      });
    this.dialog.open(MapPropertiesPopupComponent, { data: mapProperties });
  }
}
