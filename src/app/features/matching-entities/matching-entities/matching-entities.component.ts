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
import { FilterConfig } from "../../../core/entity-components/entity-list/EntityListConfig";

interface MatchingSide {
  entityType: EntityConstructor;
  selected?: Entity;
  availableEntities?: Entity[];
  availableFilters?: FilterConfig[];
  columns: string[];
  selectMatch: (e: Entity) => void;
}

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

  @Input() leftFilters: FilterConfig[];

  @Input() leftEntitySelected: Entity;

  sideDetails: MatchingSide[] = [];
  columnsToDisplay = [];

  /**
   * Entity type of the right side of the matching
   */
  @Input() rightEntityType: EntityConstructor | string;

  @Input() rightFilters: FilterConfig[];

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
    public schemaService: EntitySchemaService,
    private entityMapper: EntityMapperService,
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?

  onInitFromDynamicConfig(config: PanelConfig<MatchingEntitiesConfig>) {
    this.columns = config.config.columns;
    this.showMap = config.config.showMap ?? this.showMap;
    this.matchActionLabel =
      config.config.matchActionLabel ?? this.matchActionLabel;
    this.onMatch = config.config.onMatch;

    this.leftEntityType = config.config.leftEntityType;
    this.leftFilters = config.config.leftFilters;
    this.rightEntityType = config.config.rightEntityType;
    this.rightFilters = config.config.rightFilters;

    if (config.config.leftEntityType) {
      this.rightEntitySelected = config.entity;
    }
    if (config.config.rightEntityType) {
      this.leftEntitySelected = config.entity;
    }
  }

  async ngOnInit() {
    await this.init("left");
    await this.init("right");
    this.columnsToDisplay = ["side-0", "side-1"];
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
      columns: this.columns.map((p) => p[sideIndex]),
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

    newMatchEntity["name"] = `${
      newMatchEntity.getConstructor().label
    } ${selectedL.toString()} - ${selectedR.toString()}`;

    await this.entityMapper.save(newMatchEntity);
    console.log(newMatchEntity);
  }
}
