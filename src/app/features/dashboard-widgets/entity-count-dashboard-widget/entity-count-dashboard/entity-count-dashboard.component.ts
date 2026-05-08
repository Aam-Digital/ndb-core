import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from "@angular/core";
import { Router } from "@angular/router";
import { MatIconButton } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { getEntityRuntimeRoute } from "../../../../core/entity/entity-config.service";
import { EntityFieldLabelComponent } from "../../../../core/entity/entity-field-label/entity-field-label.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  Entity,
  EntityConstructor,
} from "../../../../core/entity/model/entity";
import { applyUpdate } from "../../../../core/entity/model/entity-update";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    EntityFieldViewComponent,
  ],
})
export class EntityCountDashboardComponent {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly router = inject(Router);
  private readonly entities = inject(EntityRegistry);
  private readonly configurableEnum = inject(ConfigurableEnumService);

  private rawEntities = signal<Entity[]>([]);
  currentGroupIndex = signal(0);

  entityType = input("Child");
  groupBy = input<string[]>(["center", "gender"]);
  subtitle = input<string>();
  explanation = input<string>(
    $localize`:dashboard widget explanation:Counting all "active" records. If configured, you can view different disaggregations by using the arrows below.`,
  );

  entityDefinition = computed(() => this.entities.get(this.entityType()));
  totalEntities = computed(
    () => this.rawEntities().filter((entity) => entity.isActive).length,
  );

  entityGroupCounts = computed<Record<string, GroupCountRow[]>>(() => {
    const result: Record<string, GroupCountRow[]> = {};
    const entityDefinition = this.entityDefinition();
    const activeEntities = this.rawEntities().filter(
      (entity) => entity.isActive,
    );

    for (const groupByField of this.groupBy()) {
      result[groupByField] = this.calculateGroupCounts(
        activeEntities,
        groupByField,
        entityDefinition,
      );
    }

    return result;
  });

  currentGroupField = computed(() => {
    const groupBy = this.groupBy();
    if (groupBy.length === 0) {
      return undefined;
    }

    return groupBy[this.currentGroupIndex() % groupBy.length];
  });

  constructor() {
    effect((onCleanup) => {
      const entityType = this.entityType();
      const entityDefinition = this.entityDefinition();
      let isCurrent = true;

      this.rawEntities.set([]);
      this.currentGroupIndex.set(0);

      untracked(async () => {
        const entities = await this.entityMapper.loadType(entityDefinition);
        if (isCurrent) {
          this.rawEntities.set(entities);
        }
      });

      const subscription = this.entityMapper
        .receiveUpdates(entityType)
        .subscribe((update) => {
          this.rawEntities.update(
            (current) => applyUpdate(current, update) as Entity[],
          );
        });

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });
  }

  getPrev() {
    const groupBy = this.groupBy();
    if (groupBy.length === 0) {
      return;
    }

    this.currentGroupIndex.update(
      (index) => (index - 1 + groupBy.length) % groupBy.length,
    );
  }

  getNext() {
    const groupBy = this.groupBy();
    if (groupBy.length === 0) {
      return;
    }

    this.currentGroupIndex.update((index) => (index + 1) % groupBy.length);
  }

  static getRequiredEntities(config: EntityCountDashboardConfig) {
    return config?.entityType || "Child";
  }

  private calculateGroupCounts(
    entities: Entity[],
    fieldName: string,
    entityDefinition: EntityConstructor,
  ): GroupCountRow[] {
    const field = entityDefinition.schema.get(fieldName);

    let groupCounts = this.getGroupCounts(
      entities,
      fieldName,
      entityDefinition,
    );
    groupCounts = this.mergeNotDefinedGroups(groupCounts);

    if (field?.dataType === "configurable-enum") {
      return this.getEnumGroupCounts(groupCounts, field);
    }

    return groupCounts;
  }

  /** Groups entities by field and returns initial groupCounts array */
  private getGroupCounts(
    entities: Entity[],
    fieldName: string,
    entityDefinition: EntityConstructor,
  ): GroupCountRow[] {
    const groups = groupBy(entities, fieldName as keyof Entity);
    return groups.map(([group, groupedEntities]) => {
      const row: GroupCountRow = {
        label: extractHumanReadableLabel(group),
        value: groupedEntities.length,
        id: extractGroupId(group),
        fieldName,
      };

      if (group !== undefined && group !== null && group !== "") {
        const entity = new entityDefinition();
        entity[fieldName] = group;
        row.entity = entity;
      }

      return row;
    });
  }

  /** Merges "" and undefined groups into a single group with label: undefined */
  private mergeNotDefinedGroups(groupCounts: GroupCountRow[]): GroupCountRow[] {
    const notDefinedGroups = groupCounts.filter(
      (group) => group.id === "" || group.id === undefined,
    );
    if (notDefinedGroups.length > 1) {
      const merged = {
        label: undefined,
        value: notDefinedGroups.reduce((sum, group) => sum + group.value, 0),
        id: "",
      };
      return [
        merged,
        ...groupCounts.filter(
          (group) => group.id !== "" && group.id !== undefined,
        ),
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
    const validIds = new Set(enumValues.map((enumValue) => enumValue.id));
    const groupCountsMap = new Map(
      groupCounts.map((aggregate) => [aggregate.id, aggregate]),
    );

    const invalidGroups = groupCounts.filter(
      (group) => group.id && !validIds.has(group.id),
    );
    let invalidOptionRow: GroupCountRow | undefined;
    if (invalidGroups.length > 0) {
      invalidOptionRow = {
        label: undefined,
        value: invalidGroups.reduce((sum, group) => sum + group.value, 0),
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

    if (groupCountsMap.has("")) {
      const mergedGroup = groupCountsMap.get("");
      groupCountSorted.unshift(mergedGroup);
    }

    if (invalidOptionRow) {
      groupCountSorted = [invalidOptionRow, ...groupCountSorted];
    }

    return groupCountSorted;
  }

  goToEntityList(filterId: string) {
    const field = this.currentGroupField();
    if (!field) {
      return;
    }

    const params = {};
    params[field] = filterId;

    this.router.navigate([getEntityRuntimeRoute(this.entityDefinition())], {
      queryParams: params,
    });
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
