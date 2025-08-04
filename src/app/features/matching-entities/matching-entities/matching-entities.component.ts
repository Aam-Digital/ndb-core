import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
  NewMatchAction,
} from "./matching-entities-config";
import { DynamicComponentConfig } from "../../../core/config/dynamic-components/dynamic-component-config.interface";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { addAlphaToHexColor } from "../../../utils/style-utils";
import { BehaviorSubject } from "rxjs";
import { ConfigService } from "../../../core/config/config.service";
import { MatTableModule } from "@angular/material/table";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AsyncPipe } from "@angular/common";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { EntityFieldViewComponent } from "../../../core/common-components/entity-field-view/entity-field-view.component";
import { MapComponent } from "../../location/map/map.component";
import { FilterComponent } from "../../../core/filter/filter/filter.component";
import { Coordinates } from "../../location/coordinates";
import { FilterService } from "../../../core/filter/filter.service";
import { LocationProperties } from "../../location/map/map-properties-popup/map-properties-popup.component";
import { getLocationProperties } from "../../location/map-utils";
import { FlattenArrayPipe } from "../../../utils/flatten-array/flatten-array.pipe";
import {
  ColumnConfig,
  FormFieldConfig,
} from "../../../core/common-components/entity-form/FormConfig";
import { RouteTarget } from "../../../route-target";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { DataFilter } from "../../../core/filter/filters/filters";
import { GeoLocation } from "app/features/location/geo-location";
import { MatMenuModule } from "@angular/material/menu";
import { AblePurePipe } from "@casl/angular";
import { EntityTypePipe } from "#src/app/core/common-components/entity-type/entity-type.pipe";

export interface MatchingSide extends MatchingSideConfig {
  /** pass along filters from app-filter to subrecord component */
  filterObj?: DataFilter<Entity>;

  availableEntities?: Entity[];
  selectMatch?: (e) => void;
  entityType: string;

  /** whether this allows to select more than one selected match */
  multiSelect: boolean;

  selected?: Entity[];

  /** item of `selected` that is currently highlighted */
  highlightedSelected: Entity;

  distanceColumn: {
    coordinatesProperties: string[];
    compareCoordinates: BehaviorSubject<Coordinates[]>;
  };
}

@RouteTarget("MatchingEntities")
@DynamicComponent("MatchingEntities")
@Component({
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
  private changeDetector = inject(ChangeDetectorRef);

  static DEFAULT_CONFIG_KEY = "appConfig:matching-entities";

  @Input() entity: Entity;
  @Input() leftSide: MatchingSideConfig = {};
  @Input() rightSide: MatchingSideConfig = {};
  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: [ColumnConfig, ColumnConfig][] = [];
  @Input()
  matchActionLabel: string = $localize`:Matching button label:create matching`;
  @Input() onMatch: NewMatchAction;

  @ViewChild("matchComparison", { static: true })
  matchComparisonElement: ElementRef;

  columnsToDisplay = [];
  lockedMatching = false;
  sideDetails: [MatchingSide, MatchingSide];

  mapVisible = false;
  filteredMapEntities: Entity[] = [];
  displayedLocationProperties: LocationProperties = {};

  constructor() {
    const config: MatchingEntitiesConfig =
      this.configService.getConfig<MatchingEntitiesConfig>(
        MatchingEntitiesComponent.DEFAULT_CONFIG_KEY,
      ) ?? {};
    Object.assign(this, JSON.parse(JSON.stringify(config)));

    this.route.data.subscribe(
      (data: DynamicComponentConfig<MatchingEntitiesConfig>) => {
        if (
          !data?.config?.leftSide &&
          !data?.config?.rightSide &&
          !data?.config?.columns
        ) {
          return;
        }
        Object.assign(this, JSON.parse(JSON.stringify(data.config)));
      },
    );
  }

  // TODO: fill selection on hover already?

  async ngOnInit() {
    this.sideDetails = [
      await this.initSideDetails(this.leftSide, 0),
      await this.initSideDetails(this.rightSide, 1),
    ];
    this.sideDetails.forEach((side, index) =>
      this.initDistanceColumn(side, index),
    );
    this.filterMapEntities();
    this.columnsToDisplay = ["side-0", "side-1"];
    // needed due to async
    this.changeDetector.detectChanges();
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
    const newSide = Object.assign({}, side) as MatchingSide; // we are transforming it into this type here

    if (!newSide.entityType) {
      newSide.selected = newSide.selected ?? [this.entity];
      newSide.highlightedSelected = newSide.selected[0];
      newSide.entityType = newSide.highlightedSelected?.getType();
    }

    newSide.columns =
      newSide.columns ??
      this.columns.map((p) => p[sideIndex]).filter((c) => !!c);

    newSide.multiSelect = this.checkIfMultiSelect(
      this.onMatch.newEntityType,
      sideIndex === 0
        ? this.onMatch.newEntityMatchPropertyLeft
        : this.onMatch.newEntityMatchPropertyRight,
    );

    if (newSide.multiSelect) {
      newSide.selectMatch = this.getMultiSelectFunction(newSide);
    } else {
      newSide.selectMatch = this.getSingleSelectFunction(newSide);
    }

    if (!newSide.selected && newSide.entityType) {
      newSide.availableEntities = await this.entityMapper.loadType(
        newSide.entityType,
      );
      newSide.availableFilters = newSide.availableFilters ?? [];
      newSide.filterObj = { ...(side.prefilter ?? {}) };
    }

    this.mapVisible =
      this.mapVisible ||
      getLocationProperties(this.entityRegistry.get(newSide.entityType))
        .length > 0;

    return newSide;
  }

  private checkIfMultiSelect(
    onMatchEntityType: string,
    onMatchProperty: string,
  ) {
    const schemaField = this.entityRegistry
      .get(onMatchEntityType)
      .schema.get(onMatchProperty);

    return schemaField.isArray;
  }

  private getMultiSelectFunction(newSide: MatchingSide) {
    return (e: Entity) => {
      if (!newSide.selected) {
        newSide.selected = [];
      }

      if (newSide.selected.includes(e)) {
        // unselect
        this.highlightSelectedRow(e, true);
        newSide.selected = newSide.selected.filter((s) => s !== e);
        if (newSide.highlightedSelected === e) {
          newSide.highlightedSelected = newSide.selected[0];
        }
      } else {
        this.highlightSelectedRow(e);
        newSide.selected = [...newSide.selected, e];
        newSide.highlightedSelected = e;
      }

      this.matchComparisonElement.nativeElement.scrollIntoView();
      this.updateDistanceColumn(newSide);
    };
  }

  private getSingleSelectFunction(newSide: MatchingSide) {
    return (e: Entity) => {
      this.highlightSelectedRow(e);
      if (newSide.highlightedSelected) {
        this.highlightSelectedRow(newSide.highlightedSelected, true);
      }
      newSide.selected = [e];
      newSide.highlightedSelected = e;
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
        addAlphaToHexColor(newSelectedEntity.getConstructor().color, 0.2);
    }
  }

  async createMatch() {
    const newMatchEntity = new (this.entityRegistry.get(
      this.onMatch.newEntityType,
    ))();

    const leftMatch = this.sideDetails[0].selected;
    const rightMatch = this.sideDetails[1].selected;

    newMatchEntity[this.onMatch.newEntityMatchPropertyLeft] = this
      .sideDetails[0].multiSelect
      ? leftMatch.map((e) => e.getId())
      : leftMatch[0].getId();
    newMatchEntity[this.onMatch.newEntityMatchPropertyRight] = this
      .sideDetails[1].multiSelect
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

    if (this.onMatch.columnsToReview) {
      this.formDialog
        .openFormPopup(newMatchEntity, this.onMatch.columnsToReview)
        .afterClosed()
        .subscribe((result) => {
          if (result instanceof newMatchEntity.getConstructor()) {
            this.lockedMatching = true;
          }
        });
    } else {
      await this.entityMapper.save(newMatchEntity);
      this.lockedMatching = true;
    }
  }

  applySelectedFilters(side: MatchingSide, filter: DataFilter<Entity>) {
    side.filterObj = { ...side.prefilter, ...filter };
    this.filterMapEntities();
  }

  private filterMapEntities() {
    this.filteredMapEntities = [];
    this.sideDetails.forEach((side) => {
      if (side.filterObj) {
        const predicate = this.filterService.getFilterPredicate(side.filterObj);
        const filtered = side.availableEntities.filter(predicate);
        this.filteredMapEntities.push(...filtered);
      } else {
        this.filteredMapEntities.push(...(side.availableEntities ?? []));
      }
    });
  }

  entityInMapClicked(entity: Entity) {
    const side = this.sideDetails.find(
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
      const colIndex = this.columns.findIndex(
        (row) => row[index] === "distance",
      );
      if (colIndex !== -1) {
        this.columns[colIndex][index] = columnConfig;
      }
    }
  }

  private getDistanceColumnConfig(side: MatchingSide): FormFieldConfig {
    return {
      id: "distance",
      label: $localize`:Matching View column name:Distance`,
      viewComponent: "DisplayDistance",
      additional: {
        coordinatesProperties:
          this.displayedLocationProperties[side.entityType],
        compareCoordinates: new BehaviorSubject<Coordinates[]>([]),
      },
    };
  }

  updateMarkersAndDistances() {
    this.sideDetails.forEach((side) => {
      const sideProperties = this.displayedLocationProperties[side.entityType];
      if (side.distanceColumn) {
        side.distanceColumn.coordinatesProperties = sideProperties;
        const lastValue = side.distanceColumn.compareCoordinates.value;
        side.distanceColumn.compareCoordinates.next(lastValue);
      }
      if (side.highlightedSelected) {
        this.updateDistanceColumn(side);
      }
    });
  }

  private updateDistanceColumn(side: MatchingSide) {
    const locationProperties =
      this.displayedLocationProperties[side.highlightedSelected?.getType()];
    const otherIndex = this.sideDetails[0] === side ? 1 : 0;
    const distanceColumn = this.sideDetails[otherIndex].distanceColumn;
    if (locationProperties && distanceColumn) {
      const coordinates: Coordinates[] = locationProperties.map(
        (prop) => (side.highlightedSelected[prop] as GeoLocation)?.geoLookup,
      );
      distanceColumn.compareCoordinates.next(coordinates);
    }
  }
}
