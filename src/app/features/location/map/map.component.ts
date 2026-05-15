import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  ViewChild,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import * as L from "leaflet";
import "leaflet.markercluster";
import { BehaviorSubject, Subject } from "rxjs";
import { ConfigService } from "../../../core/config/config.service";
import { MAP_CONFIG_KEY, MapConfig } from "../map-config";
import { Entity } from "../../../core/entity/model/entity";
import { Coordinates } from "../coordinates";
import { GeoResult } from "../geo.service";
import { createColoredDivIcon, getLocationProperties } from "../map-utils";
import { MapPopupConfig } from "../map-popup/map-popup.component";
import {
  LocationProperties,
  MapPropertiesPopupComponent,
} from "./map-properties-popup/map-properties-popup.component";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
  imports: [FaDynamicIconComponent, MatButtonModule],
})
export class MapComponent implements AfterViewInit {
  private readonly dialog = inject(MatDialog);
  private readonly configService = inject(ConfigService);

  private readonly startLocationDefault: L.LatLngTuple = [
    52.4790412, 13.4319106,
  ];

  @ViewChild("map") private mapElement: ElementRef<HTMLDivElement>;

  height = input<string>("200px");
  expandable = input<boolean>(false);

  /**
   * If true, shows only the map with pins and a close button.
   * Hides address search, selected location, and save/cancel actions.
   */
  showMapOnly = input<boolean>(false);

  /**
   * Coordinates to show as extra markers on the map, not linked to any entity.
   */
  marked = input<Coordinates[]>([]);
  entities = input<Entity[]>([]);
  highlightedEntities = input<Entity[]>([]);

  displayedProperties = model<LocationProperties>({});
  mapClick = output<Coordinates>();
  entityClick = output<Entity>();

  showPropertySelection = signal(false);

  private map: L.Map;
  private markerClusterGroup: L.MarkerClusterGroup;
  private mapInitialized = false;
  private lastMapClickTimestamp = 0;

  private markedState: Coordinates[] = [];
  private entitiesState: Entity[] = [];
  private highlightedEntitiesState: Entity[] = [];
  private displayedPropertiesState: LocationProperties = {};
  private previousEntitiesReference: Entity[] | undefined;

  constructor() {
    const config = this.configService.getConfig<MapConfig>(MAP_CONFIG_KEY);
    if (config?.start) {
      this.startLocationDefault[0] = config.start[0];
      this.startLocationDefault[1] = config.start[1];
    }

    effect(() => {
      const marked = this.marked() ?? [];
      const entities = this.entities() ?? [];
      const highlighted = this.highlightedEntities() ?? [];
      const displayedProperties = this.displayedProperties() ?? {};

      this.markedState = marked;
      if (entities !== this.previousEntitiesReference) {
        this.previousEntitiesReference = entities;
        this.entitiesState = this.adjustOverlappingCoordinates(entities);
      }
      this.highlightedEntitiesState = highlighted;
      this.displayedPropertiesState =
        this.cloneDisplayedProperties(displayedProperties);
      this.showPropertySelection.set(
        Object.keys(this.displayedPropertiesState).length > 0,
      );

      this.updateMarkers();
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapElement.nativeElement, {
      center: this.startLocationDefault,
      zoom: 14,
    });

    this.map.addEventListener("click", (res) => {
      if (this.showMapOnly()) {
        return;
      }

      const now = Date.now();
      if (now - this.lastMapClickTimestamp < 400) {
        this.lastMapClickTimestamp = now;
        return;
      }

      this.lastMapClickTimestamp = now;
      this.mapClick.emit({ lat: res.latlng.lat, lon: res.latlng.lng });
    });

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

    // Prevent gray tiles when opening directly on map pages.
    setTimeout(() => this.map.invalidateSize());
    this.initializeMap();
  }

  private initializeMap() {
    this.markerClusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 20,
    });
    this.map.addLayer(this.markerClusterGroup);
    this.mapInitialized = true;
    this.updateMarkers();

    this.map.on("zoomend", () => {
      const allMarkers = this.markerClusterGroup.getLayers() as L.Marker[];
      allMarkers.forEach((marker: any) => {
        if (marker["entity"]) {
          this.addMarkerStyle(marker, marker["highlighted"]);
        }
      });
    });
  }

  /**
   * Adjust overlapping entity coordinates in-place so markers do not stack perfectly.
   */
  private adjustOverlappingCoordinates(entities: Entity[]): Entity[] {
    const locationOccurrencesMap = new Map<string, number>();
    const roundTo5Decimals = (n: any) => Number(Number(n).toFixed(5));

    entities.forEach((entity) => {
      const locationProperties = this.getMapProperties(entity);
      locationProperties.forEach((prop) => {
        const location = (entity as any)[prop]?.geoLookup as
          | { lat: number; lon: number }
          | undefined;

        const lat = Number(location?.lat);
        const lon = Number(location?.lon);
        if (isNaN(lat) || isNaN(lon)) {
          return;
        }

        const coordinateKey = `${roundTo5Decimals(lat)}_${roundTo5Decimals(lon)}`;
        const occurrenceCount = locationOccurrencesMap.get(coordinateKey) || 0;

        if (occurrenceCount > 0) {
          const angle = (occurrenceCount * 45 * Math.PI) / 180;
          const dx = (10 / 111320) * Math.cos(angle);
          const dy = (10 / 111320) * Math.sin(angle);
          location.lat = lat + dy;
          location.lon = lon + dx;
        }

        locationOccurrencesMap.set(coordinateKey, occurrenceCount + 1);
      });
    });

    return entities;
  }

  private updateMarkers() {
    if (!this.mapInitialized) {
      return;
    }

    this.markerClusterGroup.clearLayers();

    const highlightedIds = new Set(
      this.highlightedEntitiesState?.map((e) => e.getId()) || [],
    );

    const allEntities = this.entitiesState || [];
    const normalEntities = allEntities.filter(
      (e) => !highlightedIds.has(e.getId()),
    );
    const highlightedEntities = allEntities.filter((e) =>
      highlightedIds.has(e.getId()),
    );

    const normalMarkers = this.createEntityMarkers(normalEntities, false);
    const highlightedMarkers = this.createEntityMarkers(
      this.highlightedEntitiesState,
      true,
    );
    const coordinateMarkers = this.createMarkers(this.markedState);

    this.handleMarkerHighlights(
      normalMarkers,
      highlightedMarkers,
      coordinateMarkers,
      highlightedEntities,
    );
  }

  private handleMarkerHighlights(
    normalMarkers: L.Marker[],
    highlightedMarkers: L.Marker[],
    coordinateMarkers: L.Marker[],
    highlightedEntities: Entity[],
  ) {
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

    if (highlightMarkers.length === 1) {
      const marker = highlightMarkers[0];
      this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 12), {
        animate: true,
      });
      return;
    }

    if (highlightMarkers.length === 2) {
      this.markerClusterGroup.clearLayers();
      highlightMarkers.forEach((marker) =>
        this.markerClusterGroup.addLayer(marker),
      );

      const bounds = L.featureGroup(highlightMarkers).getBounds();
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      return;
    }

    const targetMarkers =
      highlightMarkers.length > 0
        ? highlightMarkers
        : [...normalMarkers, ...coordinateMarkers];

    if (targetMarkers.length > 0) {
      const group = L.featureGroup(targetMarkers);
      this.markerClusterGroup.addLayers(targetMarkers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: this.map.getZoom(),
        });
      }
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
            const entityColor = entity.getColor() || "#808080";
            const marker = L.marker([loc.lat, loc.lon], {
              icon: createColoredDivIcon(entityColor),
            });

            marker.bindTooltip(entity.toString());
            marker.on("click", () => this.entityClick.emit(entity));
            marker["entity"] = entity;
            marker["highlighted"] = highlighted;

            marker.on("add", () => {
              this.addMarkerStyle(marker, highlighted);
              if (highlighted) {
                marker.openTooltip();
                marker.bindTooltip(entity.toString(), { permanent: true });
              }
            });

            markers.push(marker);
          });
      });

    return markers;
  }

  /**
   * Apply opacity styling based on highlight status.
   */
  private addMarkerStyle(marker: L.Marker, highlighted: boolean) {
    const icon = marker["_icon"] as HTMLElement;
    const innerSpan = icon?.querySelector("span") as HTMLElement;

    if (innerSpan) {
      const opacityValue = highlighted ? "1" : "0.5";
      innerSpan.style.setProperty("opacity", opacityValue, "important");
      icon.style.setProperty("opacity", "1", "important");
    }
  }

  private getMapProperties(entity: Entity) {
    const existing = this.displayedPropertiesState[entity.getType()];
    if (existing) {
      return existing;
    }

    const locationProperties = getLocationProperties(entity.getConstructor());
    const updatedProperties = {
      ...this.displayedPropertiesState,
      [entity.getType()]: locationProperties,
    };
    this.displayedPropertiesState = updatedProperties;
    this.displayedProperties.set(updatedProperties);
    this.showPropertySelection.set(true);

    return locationProperties;
  }

  private createMarkers(coordinates: Coordinates[]): L.Marker[] {
    return (coordinates ?? [])
      .filter((coord) => !!coord)
      .map((coord) => {
        const marker = L.marker([coord.lat, coord.lon]);
        marker["highlighted"] = false;
        return marker;
      });
  }

  private cloneDisplayedProperties(
    properties: LocationProperties = {},
  ): LocationProperties {
    return Object.fromEntries(
      Object.entries(properties).map(([entityType, fields]) => [
        entityType,
        [...(fields ?? [])],
      ]),
    ) as LocationProperties;
  }

  async openMapInPopup() {
    const mapComponent = await import("../map-popup/map-popup.component");
    const data: MapPopupConfig = {
      marked: this.markedState,
      entities: new BehaviorSubject(this.entitiesState),
      highlightedEntities: new BehaviorSubject(this.highlightedEntitiesState),
      entityClick: {
        next: (entity: Entity) => this.entityClick.emit(entity),
      } as Subject<Entity>,
      displayedProperties: this.cloneDisplayedProperties(
        this.displayedPropertiesState,
      ),
      showMapOnly: this.showMapOnly(),
    };

    this.dialog
      .open(mapComponent.MapPopupComponent, { width: "90%", data })
      .afterClosed()
      .subscribe(() =>
        this.updatedDisplayedProperties(data.displayedProperties),
      );
  }

  private updatedDisplayedProperties(
    properties: LocationProperties | undefined,
  ) {
    const nextProperties = this.cloneDisplayedProperties(properties ?? {});
    this.displayedPropertiesState = nextProperties;
    this.displayedProperties.set(nextProperties);
    this.updateMarkers();
  }

  openMapPropertiesPopup() {
    this.dialog
      .open(MapPropertiesPopupComponent, {
        data: this.cloneDisplayedProperties(this.displayedPropertiesState),
      })
      .afterClosed()
      .subscribe((res: LocationProperties) => {
        if (res) {
          this.updatedDisplayedProperties(res);
        }
      });
  }
}
