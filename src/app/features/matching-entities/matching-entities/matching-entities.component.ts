import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { addAlphaToHexColor } from "../../../utils/utils";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import {
  MatchingEntitiesConfig,
  NewMatchAction,
} from "./matching-entities-config";
import { DataFilter } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import {
  EntityListConfig,
  FilterConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { RouteTarget } from "../../../app.routing";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { ActivatedRoute } from "@angular/router";

interface MatchingSide {
  entityType: EntityConstructor;
  selected?: Entity;
  availableEntities?: Entity[];
  availableFilters?: FilterConfig[];
  columns: string[];
  selectMatch: (e: Entity) => void;
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
  /**
   * Entity type of the left side of the matching
   */
  @Input() leftEntityType: EntityConstructor | string;

  @Input() leftFilters: FilterConfig[] = [];

  @Input() leftEntitySelected: Entity;

  sideDetails: MatchingSide[] = [];
  columnsToDisplay = [];

  /**
   * Entity type of the right side of the matching
   */
  @Input() rightEntityType: EntityConstructor | string;

  @Input() rightFilters: FilterConfig[] = [];

  @Input() rightEntitySelected: Entity;

  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: string[][];

  @Input() showMap: boolean = false;

  @Input()
  matchActionLabel: string = $localize`:Matching button label:create matching`;

  @Input() onMatch: NewMatchAction;

  @ViewChild("matchComparison", { static: true })
  matchComparisonElement: ElementRef;

  /** pass along filters from app-filter to subrecord component */
  filterObj: DataFilter<any>;

  constructor(
    private route: ActivatedRoute,
    public schemaService: EntitySchemaService,
    private entityMapper: EntityMapperService,
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?
  // TODO: display matching in rowDetails popup for confirmation during creation?
  // TODO: lock things after matching was created?

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

    await this.init("left");
    await this.init("right");
    this.columnsToDisplay = ["side-0", "side-1"];
  }

  private initConfig(config: MatchingEntitiesConfig, entity?: Entity) {
    this.columns = config.columns ?? this.columns;
    this.showMap = config.showMap ?? this.showMap;
    this.matchActionLabel = config.matchActionLabel ?? this.matchActionLabel;
    this.onMatch = config.onMatch ?? this.onMatch;

    this.leftEntityType = config.leftEntityType ?? this.leftEntityType;
    this.leftFilters = config.leftFilters ?? this.leftFilters;
    this.rightEntityType = config.rightEntityType ?? this.rightEntityType;
    this.rightFilters = config.rightFilters ?? this.rightFilters;

    if (!config.leftEntityType) {
      this.leftEntitySelected = entity;
    }
    if (!config.rightEntityType) {
      this.rightEntitySelected = entity;
    }
  }

  private async init(side: "left" | "right") {
    const sideIndex = side === "right" ? 1 : 0;

    let entityType = this[side + "EntityType"];
    if (typeof entityType === "string") {
      entityType = this.entityRegistry.get(entityType);
    }

    const newSideDetails: MatchingSide = {
      entityType: entityType ?? this[side + "EntitySelected"]?.getConstructor(),
      selected: this[side + "EntitySelected"],
      columns: this.columns?.map((p) => p[sideIndex]),
      selectMatch: (e) => {
        this.highlightSelectedRow(e, newSideDetails.selected);
        newSideDetails.selected = e;
        this.matchComparisonElement.nativeElement.scrollIntoView();
      },
    };

    if (!newSideDetails.selected) {
      newSideDetails.availableEntities = await this.entityMapper.loadType(
        newSideDetails.entityType
      );
      newSideDetails.availableFilters = this[side + "Filters"];
    }

    this.sideDetails[sideIndex] = newSideDetails;
  }

  private highlightSelectedRow(newSelectedEntity, previousSelectedEntity) {
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
    const selectedL = this.sideDetails[0].selected;
    const selectedR = this.sideDetails[1].selected;

    newMatchEntity[this.onMatch.newEntityMatchPropertyLeft] =
      selectedL.getId(false);
    newMatchEntity[this.onMatch.newEntityMatchPropertyRight] =
      selectedR.getId(false);

    // best guess properties (if they do not exist on the specific entity, the values will be discarded during save
    newMatchEntity["date"] = new Date();
    newMatchEntity["name"] = `${
      newMatchEntity.getConstructor().label
    } ${selectedL.toString()} - ${selectedR.toString()}`;

    await this.entityMapper.save(newMatchEntity);
  }
}
