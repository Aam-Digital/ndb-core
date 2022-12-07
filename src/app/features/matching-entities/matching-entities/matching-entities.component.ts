import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { addAlphaToHexColor } from "../../../utils/utils";
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
import { Coordinates } from "../../location/coordinates";
import { getKmDistance } from "../../location/map-utils";

interface MatchingSide extends MatchingSideConfig {
  /** pass along filters from app-filter to subrecord component */
  filterObj?: DataFilter<Entity>;
  availableEntities?: Entity[];
  selectMatch?: (e) => void;
  entityType: EntityConstructor;
}

@RouteTarget("MatchingEntities")
@DynamicComponent("MatchingEntities")
@Component({
  selector: "app-matching-entities",
  templateUrl: "./matching-entities.component.html",
  styleUrls: ["./matching-entities.component.scss"],
})
export class MatchingEntitiesComponent
  implements OnInit, OnInitDynamicComponent
{
  @Input() entity: Entity;

  @Input() leftSide: MatchingSide | MatchingSideConfig = {};
  @Input() rightSide: MatchingSide | MatchingSideConfig = {};
  mapEntities: { entity: Entity; property: string }[] = [];

  columnsToDisplay = [];

  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: [ColumnConfig, ColumnConfig][];

  private readonly distanceColumn = {
    id: "distance",
    label: "Distance",
    view: "ReadonlyFunction",
    additional: (e: Entity) => this.calculateDistanceTo(e),
  };

  @Input() showMap: [string, string];

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
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?

  onInitFromDynamicConfig(config: PanelConfig<MatchingEntitiesConfig>) {
    this.initConfig(config.config, config.entity);
  }

  async ngOnInit() {
    this.route?.data?.subscribe((data: RouteData<MatchingEntitiesConfig>) => {
      if (!data?.config?.onMatch) {
        return;
      }
      this.initConfig(data.config);
    });

    this.initDistanceColumn();
    this.sideDetails = [
      await this.initSideDetails(this.leftSide, 0),
      await this.initSideDetails(this.rightSide, 1),
    ];
    this.columnsToDisplay = ["side-0", "side-1"];
  }

  private initConfig(config: MatchingEntitiesConfig, entity?: Entity) {
    this.columns = config.columns ?? this.columns;
    this.showMap = config.showMap ?? this.showMap;
    this.matchActionLabel = config.matchActionLabel ?? this.matchActionLabel;
    this.onMatch = config.onMatch ?? this.onMatch;

    this.leftSide = config.leftSide ?? this.leftSide;
    this.rightSide = config.rightSide ?? this.rightSide;

    this.entity = entity;
  }

  private async initSideDetails(
    side: MatchingSideConfig,
    sideIndex: number
  ): Promise<MatchingSide> {
    const newSide = side as MatchingSide; // we are transforming it into this type here

    if (!newSide.entityType) {
      newSide.selected = newSide.selected ?? this.entity;
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
    };

    if (!newSide.selected && newSide.entityType) {
      newSide.availableEntities = await this.entityMapper.loadType(
        newSide.entityType
      );
      newSide.availableFilters = newSide.availableFilters ?? [];
      this.applySelectedFilters(newSide, {});
    }

    if (this.showMap && newSide.availableEntities) {
      this.mapEntities = this.mapEntities.concat(
        newSide.availableEntities.map((entity) => ({
          entity,
          property: this.showMap[sideIndex],
        }))
      );
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

    newMatchEntity[this.onMatch.newEntityMatchPropertyLeft] =
      this.leftSide.selected.getId(false);
    newMatchEntity[this.onMatch.newEntityMatchPropertyRight] =
      this.rightSide.selected.getId(false);

    // best guess properties (if they do not exist on the specific entity, the values will be discarded during save
    newMatchEntity["date"] = new Date();
    newMatchEntity["start"] = new Date();
    newMatchEntity["name"] = `${
      newMatchEntity.getConstructor().label
    } ${this.leftSide.selected.toString()} - ${this.rightSide.selected.toString()}`;

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

  private initDistanceColumn() {
    this.columns.forEach((side) => {
      if (side.includes(this.distanceColumn.id)) {
        const index = side.indexOf(this.distanceColumn.id);
        side[index] = this.distanceColumn;
      }
    });
  }

  private calculateDistanceTo(e: Entity) {
    // TODO does not update with selection
    if (this.leftSide.selected && this.leftSide.selected !== e) {
      return this.getDistanceString(this.leftSide.selected, e, 0);
    } else if (this.rightSide.selected && this.rightSide.selected !== e) {
      return this.getDistanceString(this.rightSide.selected, e, 1);
    } else {
      return "-";
    }
  }

  private getDistanceString(from: Entity, to: Entity, index: number): string {
    const a = from[this.showMap[index]] as Coordinates;
    const b = to[this.showMap[(index + 1) % 2]] as Coordinates;
    if (!a || !b) {
      return "-";
    }
    const res = getKmDistance(a, b).toFixed(2);
    return $localize`:distance with unit|e.g. 5 km:${res} km`;
  }
}
