import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  Entity,
  EntityConstructor,
} from "../../../../core/entity/model/entity";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { groupBy } from "../../../../utils/utils";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { DashboardWidget } from "../../../../core/dashboard/dashboard-widget/dashboard-widget";
import { EntityDatatype } from "../../../../core/basic-datatypes/entity/entity.datatype";
import { EntityBlockComponent } from "../../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { NgIf } from "@angular/common";
import { MatButtonToggleGroup } from "@angular/material/button-toggle";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { EntityFieldLabelComponent } from "../../../../core/common-components/entity-field-label/entity-field-label.component";

interface EntityCountDashboardConfig {
  entity?: string;
  groupBy?: string[];
}

@DynamicComponent("ChildrenCountDashboard")
@DynamicComponent("EntityCountDashboard")
@Component({
  selector: "app-entity-count-dashboard-widget",
  templateUrl: "./entity-count-dashboard.component.html",
  styleUrls: ["./entity-count-dashboard.component.scss"],
  imports: [
    MatTableModule,
    FontAwesomeModule,
    Angulartics2Module,
    DashboardListWidgetComponent,
    EntityBlockComponent,
    NgIf,
    MatButtonToggleGroup,
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatIconButton,
    EntityFieldLabelComponent
],
  standalone: true,
})
export class EntityCountDashboardComponent
  extends DashboardWidget
  implements EntityCountDashboardConfig, OnInit
{
  getPrev() {
    this.currentGroupIndex =
      (this.currentGroupIndex - 1 + this.groupBy.length) % this.groupBy.length;
  }

  getNext() {
    this.currentGroupIndex = (this.currentGroupIndex + 1) % this.groupBy.length;
  }

  static override getRequiredEntities(config: EntityCountDashboardConfig) {
    return config?.entity || "Child";
  }

  /**
   * Entity name which should be grouped
   * @param value
   */
  @Input() set entityType(value: string) {
    this._entity = this.entities.get(value);
  }

  protected _entity: EntityConstructor;

  /**
   * The property of the Child entities to group counts by.
   *
   * Default is "center".
   */
  @Input() groupBy: string[] = ["center", "gender"];

  /**
   * if the groupBy field is an entity reference this holds the related entity type,
   * so that the entity block will be displayed instead of an id string,
   * otherwise undefined, to display simply the group label.
   * */
  currentGroupIndex = 0;
  groupedByEntity: string;

  totalEntities: number;
  entityGroupCounts: {
    [groupBy: string]: { label: string; value: number; id: string }[];
  } = {};
  label: string;
  entityIcon: IconName;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private entities: EntityRegistry,
  ) {
    super();
  }

  async ngOnInit() {
    if (!this._entity) {
      this.entityType = "Child";
    }

    for (const groupByField of this.groupBy) {
      await this.loadDataForGroupBy(groupByField);
    }
    this.label = this._entity.labelPlural;
    this.entityIcon = this._entity.icon;
  }

  async loadDataForGroupBy(groupByField: string) {
    const entities = await this.entityMapper.loadType(this._entity);
    this.updateCounts(
      entities.filter((e) => e.isActive),
      groupByField,
    );
  }

  goToChildrenList(filterId: string) {
    const params = {};
    params[this.groupBy[0]] = filterId;

    this.router.navigate([this._entity.route], { queryParams: params });
  }

  private updateCounts(entities: Entity[], groupByField: string) {
    const groupByType = this._entity.schema.get(groupByField);
    this.groupedByEntity =
      groupByType.dataType === EntityDatatype.dataType
        ? groupByType.additional
        : undefined;
    this.totalEntities = entities.length;

    const groups = groupBy(entities, groupByField as keyof Entity);
    this.entityGroupCounts[groupByField] = groups.map(([group, entities]) => {
      const label = extractHumanReadableLabel(group);
      return {
        label: label,
        value: entities.length,
        id: group?.["id"] || label,
      };
    });
  }
}

/**
 * Get a human-readable string from the given value as a label.
 * @param value
 */
function extractHumanReadableLabel(
  value: string | ConfigurableEnumValue | any,
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (value?.label) {
    return value.label;
  }

  return String(value);
}
