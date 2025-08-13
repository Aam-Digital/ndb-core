import { Component, Input, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { sortBy } from "lodash-es";

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
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { EntityFieldLabelComponent } from "../../../../core/common-components/entity-field-label/entity-field-label.component";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { CommonModule } from "@angular/common";

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
  label: string | undefined;
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
  isInvalidOption?: boolean;
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
    MatTooltipModule,
    MatIconButton,
    EntityFieldLabelComponent,
    CommonModule,
  ],
})
export class EntityCountDashboardComponent
  extends DashboardWidget
  implements EntityCountDashboardConfig, OnInit
{
  private entityMapper = inject(EntityMapperService);
  private router = inject(Router);
  private entities = inject(EntityRegistry);
  private configurableEnum = inject(ConfigurableEnumService);

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

  @Input() subtitle: string;
  @Input() explanation: string =
    $localize`:dashboard widget explanation:Counting all "active" records. If configured, you can view different disaggregations by using the arrows below.`;

  async ngOnInit() {
    if (!this._entity) {
      this.entityType = "Child";
    }
    this.label = this._entity.labelPlural;
    this.entityIcon = this._entity.icon;

    // Load all entities of the specified type
    const entities = await this.entityMapper.loadType(this._entity);

    // Filter entities to only include active ones for the total count
    const activeEntities = entities.filter((e) => e.isActive);

    this.totalEntities = activeEntities.length;
    for (const groupByField of this.groupBy) {
      this.entityGroupCounts[groupByField] = this.calculateGroupCounts(
        activeEntities,
        groupByField,
      );
    }
  }

  private calculateGroupCounts(
    entities: Entity[],
    fieldName: string,
  ): GroupCountRow[] {
    const field = this._entity.schema.get(fieldName);
    const groupedByEntity =
      field.dataType === EntityDatatype.dataType ? field.additional : undefined;
    const groups = groupBy(entities, fieldName as keyof Entity);

    let groupCounts = groups.map(([group, entities]) => {
      const label = extractHumanReadableLabel(group);
      return {
        label: label,
        value: entities.length,
        id: extractGroupId(group),
        groupedByEntity: groupedByEntity,
      };
    });

    // Merge "" and undefined groups into a single group with label: undefined
    const notDefinedGroups = groupCounts.filter(
      (g) => g.id === "" || g.id === undefined,
    );
    if (notDefinedGroups.length > 1) {
      const merged = {
        label: undefined,
        value: notDefinedGroups.reduce((sum, g) => sum + g.value, 0),
        id: "",
        groupedByEntity: notDefinedGroups[0].groupedByEntity,
      };
      groupCounts = [
        merged,
        ...groupCounts.filter((g) => g.id !== "" && g.id !== undefined),
      ];
    }

    if (field.dataType === "configurable-enum") {
      const enumValues = this.configurableEnum.getEnumValues(field.additional);
      const validIds = new Set(enumValues.map((ev) => ev.id));
      const groupCountsMap = new Map(
        groupCounts.map((aggregate) => [aggregate.id, aggregate]),
      );

      // Mark and collect invalid options
      const invalidOptions = groupCounts
        .filter((g) => g.id && !validIds.has(g.id))
        .map((g) => ({
          ...g,
          label: undefined,
          isInvalidOption: true,
        }));

      // Only keep valid groups
      let groupCountSorted = enumValues
        .map((enumValue) => groupCountsMap.get(enumValue.id))
        .filter(Boolean);

      // Add merged undefined group if present
      if (groupCountsMap.has("")) {
        groupCountSorted.unshift(groupCountsMap.get(""));
      }

      // Add invalid options at the end
      groupCountSorted = [...invalidOptions, ...groupCountSorted];

      return groupCountSorted;
    }

    return groupCounts;
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
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value?.label) {
    return value.label;
  }

  return String(value);
}

/**
 * Extract a group ID from a group value (string, object, etc.)
 */
function extractGroupId(group: any): string {
  if (group === undefined || group === null || group === "") {
    return "";
  }
  if (typeof group === "object" && "id" in group) {
    return group.id;
  }
  return group;
}
