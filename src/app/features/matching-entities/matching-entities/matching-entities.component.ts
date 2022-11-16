import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { addAlphaToHexColor } from "../../../utils/utils";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";

interface MatchingSide {
  entityType: EntityConstructor;
  selected?: Entity;
  availableEntities?: Entity[];
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

  @Input() leftEntitySelected: Entity;

  sideDetails: MatchingSide[] = [];
  columnsToDisplay = [];

  /**
   * Entity type of the right side of the matching
   */
  @Input() rightEntityType: EntityConstructor | string;

  @Input() rightEntitySelected: Entity;

  /**
   * Column mapping of property pairs of left and right entity that should be compared side by side.
   * @param value
   */
  @Input() columns: string[][];

  @ViewChild("matchComparison", { static: true })
  matchComparisonElement: ElementRef;

  constructor(
    public schemaService: EntitySchemaService,
    private entityMapper: EntityMapperService,
    private entityRegistry: EntityRegistry
  ) {}

  // TODO: fill selection on hover already?

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
    }

    this.sideDetails[sideIndex] = newSideDetails;
  }

  onInitFromDynamicConfig(config: any) {}

  private highlightSelectedRow(newSelectedEntity, previousSelectedEntity) {
    if (previousSelectedEntity) {
      previousSelectedEntity.getColor =
        previousSelectedEntity.getConstructor().prototype.getColor;
    }
    newSelectedEntity.getColor = () =>
      addAlphaToHexColor(newSelectedEntity.getConstructor().color, 0.2);
  }

  createMatch() {
    alert("new relationship entity created");
    console.log(this);
  }
}
