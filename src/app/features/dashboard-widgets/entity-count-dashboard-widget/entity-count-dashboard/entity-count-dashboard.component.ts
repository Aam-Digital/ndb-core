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
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { EntityFieldLabelComponent } from "../../../../core/common-components/entity-field-label/entity-field-label.component";

/**
 * Configuration (stored in Config document in the DB) for the dashboard widget.
 */
export interface EntityCountDashboardConfig {
  entityType?: string;
  groupBy?: string[];
}

/**
 * Details of one row of disaggregated counts (e.g. for a specific category value) to be displayed.
 */
interface GroupCountRow {
  label: string;
  id: string;

  /**
   * The count of entities part of this group
   */
  value: number;

  /**
   * if the groupBy field is an entity reference this holds the related entity type,
   * so that the entity block will be displayed instead of an id string,
   * otherwise undefined, to display simply the group label.
   */
  groupedByEntity: string;
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
    MatTooltipModule,
    MatIconButton,
    EntityFieldLabelComponent,
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
    return config?.entityType || "Child";
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
   * The property of the entities to group counts by.
   *
   * Default is "center".
   */
  @Input() groupBy: string[] = ["center", "gender"];

  /**
   * The counts of entities for each of the groupBy fields.
   */
  entityGroupCounts: { [groupBy: string]: GroupCountRow[] } = {};

  /**
   * Index of the currently displayed groupBy field / entityGroupCounts entry.
   */
  currentGroupIndex = 0;

  totalEntities: number;

  /**
   * The label of the entity type (displayed as an overall dashboard widget subtitle)
   */
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
    this.label = this._entity.labelPlural;
    this.entityIcon = this._entity.icon;

    const entities = await this.entityMapper.loadType(this._entity);
    this.totalEntities = entities.length;
    for (const groupByField of this.groupBy) {
      this.entityGroupCounts[groupByField] = this.calculateGroupCounts(
        entities.filter((e) => e.isActive),
        groupByField,
      );
    }
  }

  private calculateGroupCounts(
    entities: Entity[],
    groupByField: string,
  ): GroupCountRow[] {
    const groupByType = this._entity.schema.get(groupByField);
    const groups = groupBy(entities, groupByField as keyof Entity);
    return groups.map(([group, entities]) => {
      const label = extractHumanReadableLabel(group);
      const groupedByEntity =
        groupByType.dataType === EntityDatatype.dataType
          ? groupByType.additional
          : undefined;
      return {
        label: label,
        value: entities.length,
        id: group?.["id"] || label,
        groupedByEntity: groupedByEntity,
      };
    });
  }

  goToEntityList(filterId: string) {
    const params = {};
    params[this.groupBy[this.currentGroupIndex]] = filterId;

    this.router.navigate([this._entity.route], { queryParams: params });
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
