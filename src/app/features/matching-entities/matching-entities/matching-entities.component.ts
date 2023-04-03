import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
  NewMatchAction,
} from "./matching-entities-config";
import {
  ColumnConfig,
  DataFilter,
} from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { RouteTarget } from "../../../app.routing";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { ActivatedRoute } from "@angular/router";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { addAlphaToHexColor } from "../../../utils/style-utils";
import { BehaviorSubject } from "rxjs";
import { ConfigService } from "../../../core/config/config.service";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { EntityPropertyViewComponent } from "../../../core/entity-components/entity-utils/entity-property-view/entity-property-view.component";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { MapComponent } from "../../location/map/map.component";
import { FilterComponent } from "../../../core/filter/filter/filter.component";
import { Coordinates } from "../../location/coordinates";
import { FilterService } from "../../../core/filter/filter.service";
import { LocationProperties } from "../../location/map/map-properties-popup/map-properties-popup.component";
import { getLocationProperties } from "../../location/map-utils";

export interface MatchingSide extends MatchingSideConfig {
  /** pass along filters from app-filter to subrecord component */
  filterObj?: DataFilter<Entity>;
  availableEntities?: Entity[];
  selectMatch?: (e) => void;
  entityType: EntityConstructor;
  selected?: Entity;
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
    NgIf,
    MatButtonModule,
    NgForOf,
    EntitySubrecordComponent,
    EntityPropertyViewComponent,
    MapComponent,
    FilterComponent,
  ],
  standalone: true,
})
export class MatchingEntitiesComponent implements OnInit {
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
  displayedProperties: LocationProperties = {};

  constructor(
    private route: ActivatedRoute,
    private formDialog: FormDialogService,
    private entityMapper: EntityMapperService,
    private configService: ConfigService,
    private entityRegistry: EntityRegistry,
    private filterService: FilterService,
    private changeDetector: ChangeDetectorRef
  ) {
    const config: MatchingEntitiesConfig =
      this.configService.getConfig<MatchingEntitiesConfig>(
        MatchingEntitiesComponent.DEFAULT_CONFIG_KEY
      ) ?? {};
    Object.assign(this, JSON.parse(JSON.stringify(config)));

    this.route.data.subscribe((data: RouteData<MatchingEntitiesConfig>) => {
      if (
        !data?.config?.leftSide &&
        !data?.config?.rightSide &&
        !data?.config?.columns
      ) {
        return;
      }
      Object.assign(this, JSON.parse(JSON.stringify(data.config)));
    });
  }

  // TODO: fill selection on hover already?

  async ngOnInit() {
    this.sideDetails = [
      await this.initSideDetails(this.leftSide, 0),
      await this.initSideDetails(this.rightSide, 1),
    ];
    this.sideDetails.forEach((side, index) =>
      this.initDistanceColumn(side, index)
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
    sideIndex: number
  ): Promise<MatchingSide> {
    const newSide = Object.assign({}, side) as MatchingSide; // we are transforming it into this type here

    if (!newSide.entityType) {
      newSide.selected = newSide.selected ?? this.entity;
      newSide.entityType = newSide.selected.getConstructor();
    }

    let entityType = newSide.entityType;
    if (typeof entityType === "string") {
      entityType = this.entityRegistry.get(entityType);
    }
    newSide.entityType = entityType ?? newSide.selected.getConstructor();

    newSide.columns =
      newSide.columns ??
      this.columns.map((p) => p[sideIndex]).filter((c) => !!c);

    newSide.selectMatch = (e: Entity) => {
      this.highlightSelectedRow(e, newSide.selected);
      newSide.selected = e;
      this.matchComparisonElement.nativeElement.scrollIntoView();
      this.updateDistanceColumn(newSide);
    };

    if (!newSide.selected && newSide.entityType) {
      newSide.availableEntities = await this.entityMapper.loadType(
        newSide.entityType
      );
      newSide.availableFilters = newSide.availableFilters ?? [];
      newSide.filterObj = { ...(side.prefilter ?? {}) };
    }

    this.mapVisible =
      this.mapVisible || getLocationProperties(newSide.entityType).length > 0;

    return newSide;
  }

  private highlightSelectedRow(
    newSelectedEntity: Entity,
    previousSelectedEntity: Entity
  ) {
    if (previousSelectedEntity) {
      previousSelectedEntity.getColor =
        previousSelectedEntity.getConstructor().prototype.getColor;
    }
    newSelectedEntity.getColor = () =>
      addAlphaToHexColor(newSelectedEntity.getConstructor().color, 0.2);
  }

  async createMatch() {
    const newMatchEntity = new (this.entityRegistry.get(
      this.onMatch.newEntityType
    ))();
    const leftMatch = this.sideDetails[0].selected;
    const rightMatch = this.sideDetails[1].selected;

    newMatchEntity[this.onMatch.newEntityMatchPropertyLeft] =
      leftMatch.getId(false);
    newMatchEntity[this.onMatch.newEntityMatchPropertyRight] =
      rightMatch.getId(false);

    // best guess properties (if they do not exist on the specific entity, the values will be discarded during save
    newMatchEntity["date"] = new Date();
    newMatchEntity["start"] = new Date();
    newMatchEntity["name"] = `${
      newMatchEntity.getConstructor().label
    } ${leftMatch.toString()} - ${rightMatch.toString()}`;

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
      (s) => s.entityType === entity.getConstructor()
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
    const sideIndex = side.columns.findIndex((col) => col === "distance");
    if (sideIndex !== -1) {
      const columnConfig = this.getDistanceColumnConfig(side);
      side.columns[sideIndex] = columnConfig;
      side.distanceColumn = columnConfig.additional;
      const colIndex = this.columns.findIndex(
        (row) => row[index] === "distance"
      );
      if (colIndex !== -1) {
        this.columns[colIndex][index] = columnConfig;
      }
    }
  }

  private getDistanceColumnConfig(side: MatchingSide) {
    return {
      id: "distance",
      label: $localize`:Matching View column name:Distance`,
      view: "DisplayDistance",
      additional: {
        coordinatesProperties:
          this.displayedProperties[side.entityType.ENTITY_TYPE],
        compareCoordinates: new BehaviorSubject<Coordinates[]>([]),
      },
    };
  }

  updateMarkersAndDistances() {
    this.sideDetails.forEach((side) => {
      const sideProperties =
        this.displayedProperties[side.entityType.ENTITY_TYPE];
      if (side.distanceColumn) {
        side.distanceColumn.coordinatesProperties = sideProperties;
        const lastValue = side.distanceColumn.compareCoordinates.value;
        side.distanceColumn.compareCoordinates.next(lastValue);
      }
      if (side.selected) {
        this.updateDistanceColumn(side);
      }
    });
  }

  private updateDistanceColumn(side: MatchingSide) {
    const properties = this.displayedProperties[side.selected.getType()];
    const otherIndex = this.sideDetails[0] === side ? 1 : 0;
    const distanceColumn = this.sideDetails[otherIndex].distanceColumn;
    if (properties && distanceColumn) {
      const coordinates = properties.map((prop) => side.selected[prop]);
      distanceColumn.compareCoordinates.next(coordinates);
    }
  }
}
