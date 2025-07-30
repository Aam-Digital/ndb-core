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
    // init Map
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
    // this is necessary to remove gray spots when directly opening app on a page with the map
    setTimeout(() => this.map.invalidateSize());

    // Initialize marker cluster group
    this.markerClusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });
    this.map.addLayer(this.markerClusterGroup);
    this.mapInitialized = true;
    this.updateMarkers();
  }

  /**
   * Updates the markers on the map based on the current entities, highlighted entities, and marked coordinates.
   * Clears all existing markers and adds new ones, then handles highlighting and zooming logic.
   */
  private updateMarkers() {
    if (!this.mapInitialized) return;

    // Remove all markers from the cluster group
    this.markerClusterGroup.clearLayers();

    // Get IDs of highlighted entities for quick lookup
    const highlightedIds = new Set(
      this._highlightedEntities.value?.map((e) => e.getId()) || [],
    );

    // Split all entities into normal and highlighted based on IDs
    const allEntities = this._entities.value || [];
    const normalEntities = allEntities.filter(
      (e) => !highlightedIds.has(e.getId()),
    );
    const highlightedEntities = allEntities.filter((e) =>
      highlightedIds.has(e.getId()),
    );

    // Create markers for each group
    const normalMarkers = this.createEntityMarkers(normalEntities, false);
    const highlightedMarkers = this.createEntityMarkers(
      this._highlightedEntities.value,
      true,
    );
    const coordinateMarkers = this.createMarkers(this._marked.value);

    // Handle marker display and map view adjustment
    this.handleMarkerHighlights(
      normalMarkers,
      highlightedMarkers,
      coordinateMarkers,
      highlightedEntities,
    );
  }

  /**
   * Handles highlighting logic for map markers based on highlighted entities.
   * - Adds all normal, highlighted, and coordinate markers to the cluster.
   * - If exactly one entity is highlighted, zoom to it.
   * - If exactly two entities are highlighted, zoom to their combined bounds.
   * - Otherwise, show all normal + coordinate markers or only highlighted markers if available.
   */
  private handleMarkerHighlights(
    normalMarkers: L.Marker[],
    highlightedMarkers: L.Marker[],
    coordinateMarkers: L.Marker[],
    highlightedEntities: Entity[],
  ) {
    // Combine all markers and add to the cluster group initially
    const allMarkers = [
      ...normalMarkers,
      ...highlightedMarkers,
      ...coordinateMarkers,
    ];
    this.markerClusterGroup.addLayers(allMarkers);

    const markerByEntityId = new Map<number | string, L.Marker>();
    allMarkers.forEach((marker: any) => {
      if (marker["entity"]) {
        markerByEntityId.set(marker["entity"].getId(), marker);
      }
    });

    const highlightMarkers: L.Marker[] = highlightedEntities
      .map((entity) => markerByEntityId.get(entity.getId()))
      .filter((m): m is L.Marker => !!m);

    // If only one entity is highlighted, zoom to its marker
    if (highlightMarkers.length === 1) {
      const marker = highlightMarkers[0];
      this.markerClusterGroup.addLayer(marker);
      this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 12), {
        animate: true,
      });
      return;
    }

    // If exactly two entities are highlighted, show only their markers and fit bounds
    if (highlightMarkers.length === 2) {
      this.markerClusterGroup.clearLayers(); // remove all to show only the two

      highlightMarkers.forEach((marker) => {
        this.markerClusterGroup.addLayer(marker);
      });

      const bounds = L.featureGroup(highlightMarkers).getBounds();
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      return;
    }

    // If there are any highlight markers, prioritize showing them
    // Else show normal and coordinate markers
    const targetMarkers =
      highlightMarkers.length > 0
        ? highlightMarkers
        : [...normalMarkers, ...coordinateMarkers];

    if (targetMarkers.length > 0) {
      const group = L.featureGroup(targetMarkers);
      this.markerClusterGroup.addLayer(group);
    }
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

            marker.on("add", () => {
              this.addMarkerStyle(marker, entity, highlighted);
              // TODO: Show tooltip its on testing phase we can remove it later based on feedback
              if (highlighted) {
                marker.openTooltip();
              }
            });

            markers.push(marker);
          });
      });
    return markers;
  }

  /**
   * Applies custom styles to a marker icon based on entity and highlight status.
   */
  private addMarkerStyle(
    marker: L.Marker,
    entity: Entity,
    highlighted: boolean,
  ) {
    const icon = marker["_icon"] as HTMLElement;
    if (icon) {
      icon.style.filter = "";
      icon.style.opacity = "";
      const degree = entity ? getHueForEntity(entity) : "145";
      icon.style.filter = `hue-rotate(${degree}deg)`;
      icon.style.opacity = highlighted ? "1" : "0.5";
    }
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
        marker["highlighted"] = false;
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
