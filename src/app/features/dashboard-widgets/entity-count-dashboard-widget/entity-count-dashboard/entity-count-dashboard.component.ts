import { Component, Input, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";


import { MatIconButton } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { Angulartics2Module } from "angulartics2";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { DashboardWidget } from "../../../../core/dashboard/dashboard-widget/dashboard-widget";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { EntityFieldLabelComponent } from "../../../../core/entity/entity-field-label/entity-field-label.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  Entity,
  EntityConstructor,
} from "../../../../core/entity/model/entity";
import { groupBy } from "../../../../utils/utils";
import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";

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

  isInvalidOption?: boolean;
  color?: string;

  /**
   * entity with the field value set for display component rendering
   */
  entity?: Entity;

  /**
   * Field name for the display component
   */
  fieldName?: string;
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
    MatTooltipModule,
    MatIconButton,
    EntityFieldLabelComponent,
    EntityFieldViewComponent
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

    let groupCounts = this.getGroupCounts(entities, fieldName);
    groupCounts = this.mergeNotDefinedGroups(groupCounts);

    if (field.dataType === "configurable-enum") {
      return this.getEnumGroupCounts(groupCounts, field);
    }

    return groupCounts;
  }

  /** Groups entities by field and returns initial groupCounts array */
  private getGroupCounts(
    entities: Entity[],
    fieldName: string,
  ): GroupCountRow[] {
    const groups = groupBy(entities, fieldName as keyof Entity);
    return groups.map(([group, entities]) => {
      const row: GroupCountRow = {
        label: extractHumanReadableLabel(group),
        value: entities.length,
        id: extractGroupId(group),
        fieldName,
      };

      // Create a dummy entity with the field value set for display component rendering
      if (group !== undefined && group !== null && group !== "") {
        const entity = new this._entity();
        entity[fieldName] = group;
        row.entity = entity;
      }
      return row;
    });
  }

  /** Merges "" and undefined groups into a single group with label: undefined */
  private mergeNotDefinedGroups(groupCounts: GroupCountRow[]): GroupCountRow[] {
    const notDefinedGroups = groupCounts.filter(
      (g) => g.id === "" || g.id === undefined,
    );
    if (notDefinedGroups.length > 1) {
      const merged = {
        label: undefined,
        value: notDefinedGroups.reduce((sum, g) => sum + g.value, 0),
        id: "",
      };
      return [
        merged,
        ...groupCounts.filter((g) => g.id !== "" && g.id !== undefined),
      ];
    }
    return groupCounts;
  }

  /** Handles groupCounts for configurable-enum fields, including color and invalid option merging */
  private getEnumGroupCounts(
    groupCounts: GroupCountRow[],
    field: any,
  ): GroupCountRow[] {
    const enumValues = this.configurableEnum.getEnumValues(field.additional);
    const validIds = new Set(enumValues.map((ev) => ev.id));
    const groupCountsMap = new Map(
      groupCounts.map((aggregate) => [aggregate.id, aggregate]),
    );

    // Combine all invalid options into a single row
    const invalidGroups = groupCounts.filter(
      (g) => g.id && !validIds.has(g.id),
    );
    let invalidOptionRow: GroupCountRow | undefined = undefined;
    if (invalidGroups.length > 0) {
      invalidOptionRow = {
        label: undefined,
        value: invalidGroups.reduce((sum, g) => sum + g.value, 0),
        id: "__invalid__",
        isInvalidOption: true,
      };
    }

    let groupCountSorted = enumValues
      .map((enumValue) => {
        const group = groupCountsMap.get(enumValue.id);
        if (group) {
          return enumValue.color !== undefined
            ? { ...group, color: enumValue.color }
            : { ...group };
        }
        return undefined;
      })
      .filter(Boolean);

    // Add merged undefined group if present
    if (groupCountsMap.has("")) {
      const mergedGroup = groupCountsMap.get("");
      groupCountSorted.unshift(mergedGroup);
    }

    // Add the single invalid option row at the top if it exists
    if (invalidOptionRow) {
      groupCountSorted = [invalidOptionRow, ...groupCountSorted];
    }

    return groupCountSorted;
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
