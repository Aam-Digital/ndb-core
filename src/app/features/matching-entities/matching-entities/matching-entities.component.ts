import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
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
import { LocationEntity, MapComponent } from "../../location/map/map.component";
import { FilterComponent } from "../../../core/filter/filter/filter.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { Coordinates } from "../../location/coordinates";

interface MatchingSide extends MatchingSideConfig {
  /** pass along filters from app-filter to subrecord component */
  filterObj?: DataFilter<Entity>;
  availableEntities?: Entity[];
  selectMatch?: (e) => void;
  entityType: EntityConstructor;
  selected?: Entity;
  selectedMapProperties?: string[];
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
    MatFormFieldModule,
    MatSelectModule,
  ],
  standalone: true,
})
export class MatchingEntitiesComponent
  implements OnInit, OnInitDynamicComponent
{
  static DEFAULT_CONFIG_KEY = "appConfig:matching-entities";
  array = Array;

  @Input() entity: Entity;

  @Input() leftSide: MatchingSideConfig = {};
  @Input() rightSide: MatchingSideConfig = {};
  mapEntities: (LocationEntity & { side: MatchingSide })[] = [];

  columnsToDisplay = [];

  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: [ColumnConfig, ColumnConfig][];

  @Input()
  matchActionLabel: string = $localize`:Matching button label:create matching`;

  @Input() onMatch: NewMatchAction;

  @ViewChild("matchComparison", { static: true })
  matchComparisonElement: ElementRef;

  lockedMatching: boolean;

  sideDetails: MatchingSide[];

  constructor(
    private route: ActivatedRoute,
    private formDialog: FormDialogService,
    private entityMapper: EntityMapperService,
    private configService: ConfigService,
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?

  onInitFromDynamicConfig(config: PanelConfig<MatchingEntitiesConfig>) {
    this.initConfig(config.config, config.entity);
  }

  async ngOnInit() {
    this.route?.data?.subscribe((data: RouteData<MatchingEntitiesConfig>) => {
      if (!data?.config?.leftSide || !data?.config?.rightSide) {
        return;
      }
      this.initConfig(data.config);
    });

    this.sideDetails = [
      await this.initSideDetails(this.leftSide, 0),
      await this.initSideDetails(this.rightSide, 1),
    ];
    this.sideDetails
      .filter((side) => !!side.mapProperties)
      .forEach((side, index) => this.initDistanceColumn(side, index));
    this.columnsToDisplay = ["side-0", "side-1"];
  }

  /**
   * Apply config object to the component inputs (including global default config)
   * @private
   */
  private initConfig(config: MatchingEntitiesConfig, entity?: Entity) {
    const defaultConfig = this.configService.getConfig<MatchingEntitiesConfig>(
      MatchingEntitiesComponent.DEFAULT_CONFIG_KEY
    );
    config = Object.assign({}, defaultConfig, config);

    this.columns = config.columns ?? this.columns;
    this.matchActionLabel = config.matchActionLabel ?? this.matchActionLabel;
    this.onMatch = config.onMatch ?? this.onMatch;

    this.leftSide = config.leftSide ?? this.leftSide;
    this.rightSide = config.rightSide ?? this.rightSide;

    this.entity = entity;
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
    newSide.entityType = entityType ?? newSide.selected?.getConstructor();

    newSide.columns =
      newSide.columns ??
      this.columns?.map((p) => p[sideIndex]).filter((c) => !!c);

    newSide.selectMatch = (e) => {
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
      this.applySelectedFilters(newSide, {});
    }

    if (newSide.mapProperties) {
      newSide.mapProperties = Array.isArray(side.mapProperties)
        ? side.mapProperties
        : [side.mapProperties];
      newSide.selectedMapProperties = newSide.mapProperties;

      if (newSide.availableEntities) {
        this.mapEntities = this.mapEntities.concat(
          newSide.availableEntities.map((entity) => ({
            entity,
            property: newSide.selectedMapProperties,
            side: newSide,
          }))
        );
      }
    }

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
        .openSimpleForm(newMatchEntity, this.onMatch.columnsToReview)
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
    side.filterObj = Object.assign({}, filter, side.prefilter ?? {});
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
    const otherSideIndex = this.sideDetails[0] === side ? 1 : 0;
    const otherSide = this.sideDetails[otherSideIndex];
    let coordinates: Coordinates[] = [];
    if (otherSide.selected)
      coordinates = otherSide.selectedMapProperties.map(
        (prop) => otherSide.selected[prop]
      );
    return {
      id: "distance",
      label: $localize`:Matching View column name:Distance`,
      view: "DisplayDistance",
      additional: {
        coordinatesProperties: side.selectedMapProperties,
        // using ReplaySubject so all new subscriptions will be triggered on last emitted value
        compareCoordinates: new BehaviorSubject<Coordinates[]>(coordinates),
      },
    };
  }

  updateMarkersAndDistances(side: MatchingSide) {
    this.mapEntities = this.mapEntities.map((mapEntity) => ({
      ...mapEntity,
      property: mapEntity.side.selectedMapProperties,
    }));
    if (side.distanceColumn) {
      side.distanceColumn.coordinatesProperties = side.selectedMapProperties;
      // Publish last value again to trigger new distance calculation with the new selected properties
      const lastValue = side.distanceColumn.compareCoordinates.value;
      side.distanceColumn.compareCoordinates.next(lastValue);
    }
    if (side.selected) {
      this.updateDistanceColumn(side);
    }
  }

  private updateDistanceColumn(side: MatchingSide) {
    const otherIndex = this.sideDetails[0] === side ? 1 : 0;
    const distanceColumn = this.sideDetails[otherIndex].distanceColumn;
    if (distanceColumn) {
      const coordinates = side.selectedMapProperties.map(
        (prop) => side.selected[prop]
      );
      distanceColumn.compareCoordinates.next(coordinates);
    }
  }
}
