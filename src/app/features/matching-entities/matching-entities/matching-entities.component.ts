import { EntityTypePipe } from "#src/app/core/common-components/entity-type/entity-type.pipe";
import { AsyncPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  runInInjectionContext,
  signal,
  ViewChild,
  WritableSignal,
} from "@angular/core";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AblePurePipe } from "@casl/angular";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { GeoLocation } from "app/features/location/geo-location";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, map } from "rxjs";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import {
  ColumnConfig,
  FormFieldConfig,
} from "../../../core/common-components/entity-form/FormConfig";
import { ConfigService } from "../../../core/config/config.service";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityFieldViewComponent } from "../../../core/entity/entity-field-view/entity-field-view.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../core/entity/model/entity";
import { FilterService } from "../../../core/filter/filter.service";
import { FilterComponent } from "../../../core/filter/filter/filter.component";
import { DataFilter } from "../../../core/filter/filters/filters";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { RouteTarget } from "../../../route-target";
import { FlattenArrayPipe } from "../../../utils/flatten-array/flatten-array.pipe";
import { addAlphaToHexColor } from "../../../utils/style-utils";
import { Coordinates } from "../../location/coordinates";
import {
  getLocationProperties,
  getMinDistanceKm,
} from "../../location/map-utils";
import { LocationProperties } from "../../location/map/map-properties-popup/map-properties-popup.component";
import { MapComponent } from "../../location/map/map.component";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
  NewMatchAction,
} from "./matching-entities-config";
import { InMemoryDataSource } from "#src/app/core/common-components/entities-table/data-source/in-memory-data-source";
import { Logging } from "#src/app/core/logging/logging.service";

export interface MatchingSide extends MatchingSideConfig {
  /** pass along filters from app-filter to subrecord component */
  filterObj: WritableSignal<DataFilter<Entity>>;

  dataSource?: InMemoryDataSource<Entity>;
  selectMatch?: (e) => void;
  entityType: string;

  /** whether this allows to select more than one selected match */
  multiSelect: boolean;

  selected: WritableSignal<Entity[]>;

  /** item of `selected` that is currently highlighted */
  highlightedSelected: WritableSignal<Entity | null>;

  distanceColumn: {
    coordinatesProperties: string[];
    compareCoordinates: BehaviorSubject<Coordinates[]>;
  };
}

@RouteTarget("MatchingEntities")
@DynamicComponent("MatchingEntities")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-matching-entities",
  templateUrl: "./matching-entities.component.html",
  styleUrls: ["./matching-entities.component.scss"],
  imports: [
    MatTableModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatButtonModule,
    EntitiesTableComponent,
    EntityFieldViewComponent,
    MapComponent,
    FilterComponent,
    FlattenArrayPipe,
    MatMenuModule,
    MatIconButton,
    FaIconComponent,
    RouterLink,
    AblePurePipe,
    AsyncPipe,
    EntityTypePipe,
  ],
})
export class MatchingEntitiesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formDialog = inject(FormDialogService);
  private entityMapper = inject(EntityMapperService);
  private configService = inject(ConfigService);
  private entityRegistry = inject(EntityRegistry);
  private filterService = inject(FilterService);
  private injector = inject(Injector);
  static DEFAULT_CONFIG_KEY = "appConfig:matching-entities";

  entity = input<Entity>();
  leftSide = input<MatchingSideConfig>();
  rightSide = input<MatchingSideConfig>();
  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  columns = input<[ColumnConfig, ColumnConfig][]>();
  matchActionLabel = input<string>();
  onMatch = input<NewMatchAction>();

  @ViewChild("matchComparison", { static: true })
  matchComparisonElement: ElementRef;

  columnsToDisplay = computed(() =>
    this.sideDetails() ? ["side-0", "side-1"] : [],
  );
  lockedMatching = signal(false);
  sideDetails = signal<[MatchingSide, MatchingSide] | undefined>(undefined);

  mapVisible = computed(() =>
    (this.sideDetails() ?? ([] as MatchingSide[])).some(
      (side) =>
        side.entityType &&
        getLocationProperties(this.entityRegistry.get(side.entityType)).length >
          0,
    ),
  );
  filteredMapEntities = computed(() => {
    const entities: Entity[] = [];
    this.sideDetails()?.forEach((side) => {
      const filterObj = side.filterObj();
      if (Object.keys(filterObj).length > 0) {
        const predicate = this.filterService.getFilterPredicate(filterObj);
        entities.push(
          ...(side.dataSource?.allRecords() ?? []).filter(predicate),
        );
      } else {
        entities.push(...(side.dataSource?.allRecords() ?? []));
      }
    });
    return entities;
  });
  displayedLocationProperties = signal<LocationProperties>({});

  private readonly globalConfig: MatchingEntitiesConfig =
    this.configService.getConfig<MatchingEntitiesConfig>(
      MatchingEntitiesComponent.DEFAULT_CONFIG_KEY,
    ) ?? {};

  private readonly routeConfig = toSignal(
    this.route.data.pipe(
      map(
        (data: DynamicComponentConfig<MatchingEntitiesConfig>) =>
          data?.config as MatchingEntitiesConfig | undefined,
      ),
    ),
  );

  private readonly config = computed<MatchingEntitiesConfig>(() => {
    const routeConf = this.routeConfig();
    if (!routeConf?.leftSide && !routeConf?.rightSide && !routeConf?.columns) {
      return this.globalConfig;
    }
    return { ...this.globalConfig, ...structuredClone(routeConf) };
  });

  private columnsState: [ColumnConfig, ColumnConfig][] = [];

  // TODO: fill selection on hover already?

  async ngOnInit() {
    this.columnsState = this.cloneColumns(this.resolvedColumns());
    const sides: [MatchingSide, MatchingSide] = [
      await this.initSideDetails(this.resolvedLeftSide(), 0),
      await this.initSideDetails(this.resolvedRightSide(), 1),
    ];
    this.sideDetails.set(sides);
    sides.forEach((side, index) => this.initDistanceColumn(side, index));
  }

  /**
   * Generate setup for a side of the matching view template based on the component input properties.
   * @param side
   * @param sideIndex
   * @private
   */
  private async initSideDetails(
    side: MatchingSideConfig,
    sideIndex: number,
  ): Promise<MatchingSide> {
    const newSide = buildMatchingSideConfig(
      side,
      this.columnsState,
      sideIndex,
    ) as MatchingSide;

    if (!newSide.entityType) {
      const entity = this.entity();
      const initialSelected = entity ? [entity] : [];
      newSide.selected = signal<Entity[]>(initialSelected);
      newSide.highlightedSelected = signal<Entity | null>(
        initialSelected[0] ?? null,
      );
      newSide.entityType = newSide.highlightedSelected()?.getType();
    }

    const resolvedOnMatch = this.resolvedOnMatch();
    newSide.multiSelect = this.checkIfMultiSelect(
      resolvedOnMatch.newEntityType,
      sideIndex === 0
        ? resolvedOnMatch.newEntityMatchPropertyLeft
        : resolvedOnMatch.newEntityMatchPropertyRight,
    );

    if (newSide.multiSelect) {
      newSide.selectMatch = this.getMultiSelectFunction(newSide);
    } else {
      newSide.selectMatch = this.getSingleSelectFunction(newSide);
    }

    if (!newSide.selected) {
      runInInjectionContext(
        this.injector,
        () => (newSide.dataSource = new InMemoryDataSource()),
      );
      const records = await this.entityMapper
        .loadType(newSide.entityType)
        .catch((err) => {
          Logging.error(
            `Failed to initialize entities (${newSide.entityType}) for matching side ${sideIndex}. Reasons: ${err}`,
          );
          return [];
        });
      newSide.dataSource.allRecords.set(records);
      newSide.availableFilters = newSide.availableFilters ?? [];
      newSide.selected = signal<Entity[]>([]);
      newSide.highlightedSelected = signal<Entity | null>(null);
    }

    newSide.filterObj = signal<DataFilter<Entity>>({
      ...(side.prefilter ?? {}),
    });

    return newSide;
  }

  private checkIfMultiSelect(
    onMatchEntityType: string,
    onMatchProperty: string,
  ) {
    if (!onMatchEntityType || !onMatchProperty) {
      return false;
    }

    try {
      const schemaField = this.entityRegistry
        .get(onMatchEntityType)
        .schema.get(onMatchProperty);
      return !!schemaField?.isArray;
    } catch {
      return false;
    }
  }

  private getMultiSelectFunction(newSide: MatchingSide) {
    return (e: Entity) => {
      const currentSelected = newSide.selected();
      if (currentSelected.includes(e)) {
        // unselect
        this.highlightSelectedRow(e, true);
        const newSelected = currentSelected.filter((s) => s !== e);
        newSide.selected.set(newSelected);
        if (newSide.highlightedSelected() === e) {
          newSide.highlightedSelected.set(newSelected[0] ?? null);
        }
      } else {
        this.highlightSelectedRow(e);
        newSide.selected.set([...currentSelected, e]);
        newSide.highlightedSelected.set(e);
      }

      this.matchComparisonElement.nativeElement.scrollIntoView();
      this.updateDistanceColumn(newSide);
    };
  }

  private getSingleSelectFunction(newSide: MatchingSide) {
    return (e: Entity) => {
      if (newSide.selected()[0] === e) {
        // Deselect if already selected
        this.highlightSelectedRow(e, true);
        newSide.selected.set([]);
        newSide.highlightedSelected.set(null);
      } else {
        this.highlightSelectedRow(e);
        const prev = newSide.highlightedSelected();
        if (prev) {
          this.highlightSelectedRow(prev, true);
        }
        newSide.selected.set([e]);
        newSide.highlightedSelected.set(e);
      }

      this.matchComparisonElement.nativeElement.scrollIntoView();
      this.updateDistanceColumn(newSide);
    };
  }

  private highlightSelectedRow(newSelectedEntity: Entity, unHighlight = false) {
    if (unHighlight) {
      newSelectedEntity.getColor =
        newSelectedEntity.getConstructor().prototype.getColor;
    } else {
      newSelectedEntity.getColor = () =>
        addAlphaToHexColor(
          Entity.getColorWithConditions(newSelectedEntity),
          0.2,
        );
    }
  }

  /**
   * Get background color for entity rows in matching tables.
   */
  getEntityBackgroundColor = (entity: Entity): string => {
    const isSelected = this.sideDetails()?.some((side) =>
      side.selected().some((selected) => selected.getId() === entity.getId()),
    );
    if (isSelected) {
      const color = Entity.getColorWithConditions(entity);
      return addAlphaToHexColor(color, 0.2);
    }

    return "";
  };

  async createMatch() {
    const onMatch = this.resolvedOnMatch();
    if (
      !onMatch?.newEntityType ||
      !onMatch.newEntityMatchPropertyLeft ||
      !onMatch.newEntityMatchPropertyRight
    ) {
      return;
    }
    const newMatchEntity = new (this.entityRegistry.get(
      onMatch.newEntityType,
    ))();

    const sides = this.sideDetails();
    const leftMatch = sides[0].selected();
    const rightMatch = sides[1].selected();

    newMatchEntity[onMatch.newEntityMatchPropertyLeft] = sides[0].multiSelect
      ? leftMatch.map((e) => e.getId())
      : leftMatch[0].getId();
    newMatchEntity[onMatch.newEntityMatchPropertyRight] = sides[1].multiSelect
      ? rightMatch.map((e) => e.getId())
      : rightMatch[0].getId();

    // best guess properties (if they do not exist on the specific entity, the values will be discarded during save
    newMatchEntity["date"] = new Date();
    newMatchEntity["start"] = new Date();
    newMatchEntity["name"] =
      newMatchEntity.getConstructor().label +
      " " +
      leftMatch.map((e) => e.toString()).join(", ") +
      " - " +
      rightMatch.map((e) => e.toString()).join(", ");

    if (onMatch.columnsToReview) {
      this.formDialog
        .openFormPopup(newMatchEntity, onMatch.columnsToReview)
        .afterClosed()
        .subscribe((result) => {
          if (result instanceof newMatchEntity.getConstructor()) {
            this.resetMatchingSelection();
          }
        });
    } else {
      await this.entityMapper.save(newMatchEntity);
      this.resetMatchingSelection();
    }
  }

  private resetMatchingSelection() {
    this.lockedMatching.set(false);

    for (const side of this.sideDetails()) {
      if (!side.dataSource?.allRecords()) {
        continue;
      }

      side
        .selected()
        .forEach((selectedEntity) =>
          this.highlightSelectedRow(selectedEntity, true),
        );
      side.selected.set([]);
      side.highlightedSelected.set(null);
      this.updateDistanceColumn(side);
    }
  }

  onDisplayedPropertiesChange(value: LocationProperties) {
    this.displayedLocationProperties.set(value);
    this.updateMarkersAndDistances();
  }

  applySelectedFilters(side: MatchingSide, filter: DataFilter<Entity>) {
    side.filterObj.set({ ...side.prefilter, ...filter });
  }

  entityInMapClicked(entity: Entity) {
    const side = this.sideDetails()?.find(
      (s) => s.entityType === entity.getType(),
    );
    if (side) {
      side.selectMatch(entity);
    }
  }

  /**
   * Initialize distance column for columns of side and columns of EntitySubrecord
   * @param side
   * @param index of the side
   * @private
   */
  private initDistanceColumn(side: MatchingSide, index: number) {
    const sideIndex = side.columns.findIndex((col) =>
      typeof col === "string" ? col === "distance" : col.id === "distance",
    );

    if (sideIndex !== -1) {
      const columnConfig = this.getDistanceColumnConfig(side);
      side.columns[sideIndex] = columnConfig;
      side.distanceColumn = columnConfig.additional;
      this.setDistanceValuesForSide(side);
      const colIndex = this.columnsState.findIndex((row) => {
        const col = row[index];
        return typeof col === "string"
          ? col === "distance"
          : col?.id === "distance";
      });
      if (colIndex !== -1) {
        this.columnsState[colIndex][index] = columnConfig;
      }
    }
  }

  /**
   * Build the display-only distance column configuration for matching tables.
   */
  private getDistanceColumnConfig(side: MatchingSide): FormFieldConfig {
    return {
      id: "distance",
      label: $localize`:Matching View column name:Distance`,
      viewComponent: "DisplayDistance",
      dataType: "number",
      additional: {
        coordinatesProperties:
          this.displayedLocationProperties()[side.entityType],
        compareCoordinates: new BehaviorSubject<Coordinates[]>([]),
      },
    };
  }

  /**
   * Pre-calculate and attach a non-enumerable "distance" value on each entity
   * so the table can sort without custom sort functions.
   */
  private setDistanceValuesForSide(side: MatchingSide) {
    if (!side.dataSource?.allRecords()?.length || !side.distanceColumn) {
      return;
    }

    for (const entity of side.dataSource.allRecords()) {
      this.defineDistanceValue(entity, side);
    }
  }

  /**
   * Define a non-enumerable distance value on the entity for table sorting.
   */
  private defineDistanceValue(entity: Entity, side: MatchingSide) {
    const existingDescriptor = Object.getOwnPropertyDescriptor(
      entity,
      "distance",
    );
    if (existingDescriptor && existingDescriptor.configurable === false) {
      return;
    }

    const distanceValue = getMinDistanceKm(
      entity,
      side.distanceColumn?.coordinatesProperties ?? [],
      side.distanceColumn?.compareCoordinates?.value ?? [],
    );

    Object.defineProperty(entity, "distance", {
      configurable: true,
      enumerable: false,
      value: distanceValue,
      writable: true,
    });
  }

  updateMarkersAndDistances() {
    this.sideDetails()?.forEach((side) => {
      const sideProperties =
        this.displayedLocationProperties()[side.entityType];
      if (side.distanceColumn) {
        side.distanceColumn.coordinatesProperties = sideProperties;
        const lastValue = side.distanceColumn.compareCoordinates.value;
        side.distanceColumn.compareCoordinates.next(lastValue);
      }
      if (side.highlightedSelected()) {
        this.updateDistanceColumn(side);
      }
      this.setDistanceValuesForSide(side);
    });
  }

  private updateDistanceColumn(side: MatchingSide) {
    const highlighted = side.highlightedSelected();
    const locationProperties =
      this.displayedLocationProperties()[highlighted?.getType()];
    const sides = this.sideDetails();
    const otherIndex = sides[0] === side ? 1 : 0;
    const distanceColumn = sides[otherIndex].distanceColumn;
    if (locationProperties && distanceColumn) {
      const coordinates: Coordinates[] = locationProperties.map(
        (prop) => (highlighted[prop] as GeoLocation)?.geoLookup,
      );
      distanceColumn.compareCoordinates.next(coordinates);
    }
    const distanceSide = sides[otherIndex];
    this.setDistanceValuesForSide(distanceSide);
  }

  resolvedMatchActionLabel = computed(
    () =>
      this.matchActionLabel() ??
      this.config().matchActionLabel ??
      $localize`:Matching button label:create matching`,
  );

  private readonly resolvedLeftSide = computed<MatchingSideConfig>(
    () => this.leftSide() ?? this.config().leftSide ?? {},
  );

  private readonly resolvedRightSide = computed<MatchingSideConfig>(
    () => this.rightSide() ?? this.config().rightSide ?? {},
  );

  readonly resolvedColumns = computed<[ColumnConfig, ColumnConfig][]>(
    () => this.columns() ?? this.config().columns ?? [],
  );

  private readonly resolvedOnMatch = computed<NewMatchAction>(
    () =>
      this.onMatch() ??
      this.config().onMatch ?? {
        newEntityType: "",
        newEntityMatchPropertyLeft: "",
        newEntityMatchPropertyRight: "",
      },
  );

  private cloneColumns(
    columns: [ColumnConfig, ColumnConfig][],
  ): [ColumnConfig, ColumnConfig][] {
    return (columns ?? []).map(([left, right]) => [
      this.cloneColumn(left),
      this.cloneColumn(right),
    ]);
  }

  private cloneColumn(column: ColumnConfig): ColumnConfig {
    if (typeof column === "string" || !column) {
      return column;
    }
    return { ...column };
  }
}

/**
 * Create a MatchingSideConfig object
 * and fill it with columns from comparison array if necessary
 * @param side Base side configuration
 * @param columns columns array from the overall matching configuration
 * @param sideIndex index (0 or 1) of the side in the columns array
 */
export function buildMatchingSideConfig(
  side: MatchingSideConfig,
  columns: [ColumnConfig, ColumnConfig][],
  sideIndex: number,
): MatchingSideConfig {
  const newSide = Object.assign({}, side) as MatchingSide; // we are transforming it into this type here
  newSide.columns =
    newSide.columns ??
    (columns ?? []).map((p) => p[sideIndex]).filter((c) => !!c);
  return newSide;
}
