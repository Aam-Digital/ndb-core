import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from "@angular/core";
import * as L from "leaflet";
import "leaflet.markercluster";

import { BehaviorSubject, Observable, timeInterval } from "rxjs";
import { debounceTime, filter, map } from "rxjs/operators";
import { Coordinates } from "../coordinates";
import { Entity } from "../../../core/entity/model/entity";
import { getHueForEntity, getLocationProperties } from "../map-utils";
import { ConfigService } from "../../../core/config/config.service";
import { MAP_CONFIG_KEY, MapConfig } from "../map-config";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MapPopupConfig } from "../map-popup/map-popup.component";
import {
  LocationProperties,
  MapPropertiesPopupComponent,
} from "./map-properties-popup/map-properties-popup.component";
import { GeoResult } from "../geo.service";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
  imports: [FontAwesomeModule, MatButtonModule],
})
export class MapComponent implements AfterViewInit {
  private dialog = inject(MatDialog);

  private readonly start_location: L.LatLngTuple = [52.4790412, 13.4319106];

  @ViewChild("map") private mapElement: ElementRef<HTMLDivElement>;

  @Input() height = "200px";
  @Input() expandable = false;

  @Input() set marked(coordinates: Coordinates[]) {
    if (!coordinates) {
      return;
    }
    this._marked.next(coordinates);
    this.updateMarkers();
  }
  private _marked = new BehaviorSubject<Coordinates[]>([]);

  @Input() set entities(entities: Entity[]) {
    if (!entities) {
      return;
    }
    this._entities.next(entities);
    this.updateMarkers();
  }
  private _entities = new BehaviorSubject<Entity[]>([]);

  @Input() set highlightedEntities(entities: Entity[]) {
    if (!entities) {
      return;
    }
    this._highlightedEntities.next(entities);
    this.updateMarkers();
  }
  private _highlightedEntities = new BehaviorSubject<Entity[]>([]);

  @Input() set displayedProperties(displayedProperties: LocationProperties) {
    if (displayedProperties) {
      this._displayedProperties = displayedProperties;
      this.showPropertySelection = Object.keys(displayedProperties).length > 0;
    }
  }
  private _displayedProperties: LocationProperties = {};
  @Output() displayedPropertiesChange = new EventEmitter<LocationProperties>();
  showPropertySelection = false;

  private map: L.Map;
  private markerClusterGroup: L.MarkerClusterGroup;
  private mapInitialized = false;

  private clickStream = new EventEmitter<Coordinates>();

  @Output() mapClick: Observable<Coordinates> = this.clickStream.pipe(
    timeInterval(),
    debounceTime(400),
    filter(({ interval }) => interval >= 400),
    map(({ value }) => value),
  );

  @Output() entityClick = new EventEmitter<Entity>();

  constructor() {
    const configService = inject(ConfigService);
    const config = configService.getConfig<MapConfig>(MAP_CONFIG_KEY);
    if (config?.start) {
      this.start_location = config.start;
    }
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapElement.nativeElement, {
      center: this.start_location,
      zoom: 14,
    });
    this.map.addEventListener("click", (res) =>
      this.clickStream.emit({ lat: res.latlng.lat, lon: res.latlng.lng }),
    );

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );
    tiles.addTo(this.map);

    // Initialize marker cluster group
    this.markerClusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });
    this.map.addLayer(this.markerClusterGroup);

    setTimeout(() => this.map.invalidateSize());
    this.mapInitialized = true;
    // Initial markers
    this.updateMarkers();
  }

  private updateMarkers() {
    if (!this.mapInitialized) return;

    this.markerClusterGroup.clearLayers();

    const highlightedIds = new Set(
      this._highlightedEntities.value?.map((e) => e.getId()) || [],
    );

    const normalEntities = (this._entities.value || []).filter(
      (e) => !highlightedIds.has(e.getId()),
    );
    const normalMarkers = this.createEntityMarkers(normalEntities, false);

    const highlightedMarkers = this.createEntityMarkers(
      this._highlightedEntities.value,
      true,
    );
    const coordinateMarkers = this.createMarkers(this._marked.value);

    this.markerClusterGroup.addLayers([
      ...normalMarkers,
      ...highlightedMarkers,
      ...coordinateMarkers,
    ]);

    setTimeout(() => this.styleMarkers(), 100);

    let markers =
      highlightedMarkers.length > 0
        ? highlightedMarkers
        : [...normalMarkers, ...coordinateMarkers];
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 46,
      });
    }
  }

  private styleMarkers() {
    // Style normal markers
    this.markerClusterGroup.getLayers().forEach((layer: L.Marker) => {
      const entity = layer["entity"] as Entity;
      const highlighted = layer["highlighted"] as boolean;

      if (entity || highlighted) {
        const icon = layer.getElement()?.querySelector("img");
        if (icon) {
          const degree = entity ? getHueForEntity(entity) : "145";
          (icon as HTMLElement).style.filter = `hue-rotate(${degree}deg)`;
          (icon as HTMLElement).style.opacity = highlighted ? "1" : "0.5";
        }
      }
    });
  }

  private createEntityMarkers(
    entities: Entity[],
    highlighted: boolean,
  ): L.Marker[] {
    const markers: L.Marker[] = [];

    entities
      .filter((entity) => !!entity)
      .forEach((entity) => {
        this.getMapProperties(entity)
          .map((prop) => entity[prop]?.geoLookup)
          .filter((loc: GeoResult) => !!loc)
          .forEach((loc: GeoResult) => {
            const marker = L.marker([loc.lat, loc.lon]);
            marker.bindTooltip(entity.toString());
            marker.on("click", () => this.entityClick.emit(entity));
            marker["entity"] = entity;
            marker["highlighted"] = highlighted;
            markers.push(marker);
          });
      });

    return markers;
  }

  private getMapProperties(entity: Entity) {
    if (this._displayedProperties[entity.getType()]) {
      return this._displayedProperties[entity.getType()];
    } else {
      const locationProperties = getLocationProperties(entity.getConstructor());
      this._displayedProperties[entity.getType()] = locationProperties;
      this.displayedPropertiesChange.emit(this._displayedProperties);
      this.showPropertySelection = true;
      return locationProperties;
    }
  }

  private createMarkers(coordinates: Coordinates[]): L.Marker[] {
    return coordinates
      .filter((coord) => !!coord)
      .map((coord) => {
        const marker = L.marker([coord.lat, coord.lon]);
        marker["highlighted"] = false; //todo or may be delete?
        return marker;
      });
  }

  async openMapInPopup() {
    // Breaking circular dependency by using async import
    const mapComponent = await import("../map-popup/map-popup.component");
    const data: MapPopupConfig = {
      marked: this._marked.value,
      entities: this._entities,
      highlightedEntities: this._highlightedEntities,
      entityClick: this.entityClick,
      displayedProperties: this._displayedProperties,
    };
    this.dialog
      .open(mapComponent.MapPopupComponent, { width: "90%", data })
      .afterClosed()
      .subscribe(() =>
        // displayed properties might have changed in map view
        this.updatedDisplayedProperties(data.displayedProperties),
      );
  }

  private updatedDisplayedProperties(properties: LocationProperties) {
    this._displayedProperties = properties;
    this.displayedPropertiesChange.emit(this._displayedProperties);
    this.entities = this._entities.value;
    this.highlightedEntities = this._highlightedEntities.value;
  }

  openMapPropertiesPopup() {
    this.dialog
      .open(MapPropertiesPopupComponent, {
        data: this._displayedProperties,
      })
      .afterClosed()
      .subscribe((res: LocationProperties) => {
        if (res) {
          this.updatedDisplayedProperties(res);
        }
      });
  }
}
