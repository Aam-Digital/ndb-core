import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { CustomFormLinkButtonComponent } from "app/features/public-form/custom-form-link-button/custom-form-link-button.component";
import {
  ScreenSize,
  ScreenWidthObserver,
} from "../../../utils/media/screen-size-observer.service";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { LoaderMethod } from "../../entity/entity-special-loader/entity-special-loader.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";
import {
  InMemoryDataSource,
  LoadRecordConfig,
} from "#src/app/core/common-components/entities-table/in-memory-data-source";

/**
 * Load and display a list of entity subrecords (entities related to the current entity details view).
 */
@DynamicComponent("RelatedEntities")
@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-related-entities",
  templateUrl: "./related-entities.component.html",
  imports: [EntitiesTableComponent, CustomFormLinkButtonComponent],
})
export class RelatedEntitiesComponent<E extends Entity> {
  private entityRegistry = inject(EntityRegistry);
  private screenWidthObserver = inject(ScreenWidthObserver);
  protected filterService = inject(FilterService);

  readonly dataSource = new InMemoryDataSource<E>();

  /** currently viewed/main entity for which related entities are displayed in this component */
  entity = input<Entity>();

  /** entity type of the related entities to be displayed */
  entityType = input<string>();

  /**
   * Property name of the related entities (type given in this.entityType) that holds the entity id
   * to be matched with the id of the current main entity (given in this.entity).
   * If not explicitly set, this will be inferred based on the defined relations between the entities.
   *
   * manually setting this is only necessary if you have multiple properties referencing the same entity type
   * and you want to list only records related to one of them.
   * For example: if you set `entityType = "Project"` (to display a list of projects here) and the Project entities have a properties "participants" and "supervisors" both storing references to User entities,
   * you can set `property = "supervisors"` to only list those projects where the current User is supervisors, not participant.
   */
  property = input<string | string[]>();

  /**
   * The special service or method to load data via an index or other special method.
   */
  loaderMethod = input<LoaderMethod>();

  /**
   * Columns to be displayed in the table
   * @param value
   */
  columns = input<ColumnConfig[]>([]);

  readonly _columns = computed(() => {
    const entity = this.entity();
    const rawCols = this.getColumns(this.columns());
    if (!entity) return rawCols;
    return rawCols.map((column) => {
      if (typeof column.additional === "object" && column.additional !== null) {
        return {
          ...column,
          additional: { ...column.additional, relatedEntitiesParent: entity },
        };
      }
      return column;
    });
  });

  readonly columnsToDisplay = computed(() =>
    this._columns()
      .filter((column) => {
        if (column?.hideFromTable) return false;
        const numericValue = ScreenSize[column?.visibleFrom];
        if (numericValue === undefined) return true;
        return this.currentScreenSize() >= numericValue;
      })
      .map((c) => c.id),
  );

  /**
   * This filter is applied before displaying the data.
   */
  filter = input<DataFilter<E>>();

  /**
   * Whether inactive/archived records should be shown.
   */
  showInactive = model<boolean | undefined>(undefined);

  clickMode = input<"popup" | "navigate" | "popup-details">("popup");
  editable = input<boolean>(true);

  protected readonly entityCtr = computed<EntityConstructor<E> | undefined>(
    () => {
      const entityType = this.entityType();
      if (!entityType) {
        return undefined;
      }
      return this.entityRegistry.get(entityType) as EntityConstructor<E>;
    },
  );
  protected readonly relationProperty = computed<string | string[]>(() => {
    const entity = this.entity();
    const entityCtr = this.entityCtr();
    if (!entity || !entityCtr) {
      return [];
    }

    const resolvedProperty = this.property() ?? this.getProperty();
    return typeof resolvedProperty === "string"
      ? this.resolvePropertyPath(resolvedProperty)
      : resolvedProperty.map((p) => this.resolvePropertyPath(p));
  });
  readonly filterObj = signal<DataFilter<E>>({});
  private readonly currentScreenSize = signal(
    this.screenWidthObserver.currentScreenSize(),
  );

  constructor() {
    this.screenWidthObserver
      .shared()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.currentScreenSize.set(
          this.screenWidthObserver.currentScreenSize(),
        );
      });

    effect(() => {
      this.filterObj.set(this.initFilter());
    });

    effect(() => {
      if (this.showInactive() === undefined) {
        this.showInactive.set(this.entity().anonymized);
      }
    });

    effect(() => {
      const config: LoadRecordConfig<E> = {
        entityCtr: this.entityCtr(),
        forEntity: this.entity(),
      };
      if (!Array.isArray(this.relationProperty())) {
        // Only when a single relation property is defined/exists, a loader method can be used
        config.relationProperty = this.relationProperty() as keyof Entity;
        config.loaderMethod = this.loaderMethod();
      }
      this.dataSource.loadRecordConfig.set(config);
    });
  }

  /**
   * Auto-detect which properties of the related entity type reference the current entity.
   * Returns dot-paths for nested references (e.g. "attendance.participant").
   */
  protected getProperty(): string | string[] {
    const entity = this.entity();
    const entityCtr = this.entityCtr();
    if (!entity || !entityCtr) {
      return [];
    }
    const relType = entity.getType();
    const found: string[] = [];

    for (const [key, field] of entityCtr.schema) {
      if (this.fieldReferencesType(field, relType)) {
        found.push(key);
        continue;
      }

      for (const innerProp of this.findEmbeddedEntityRefs(field, relType)) {
        found.push(`${key}.${innerProp}`);
      }
    }

    return found.length === 1 ? found[0] : found;
  }

  /**
   * Resolve shorthand property names that point to an embedded schema
   * into dot-paths (e.g. "attendance" → "attendance.participant").
   */
  private resolvePropertyPath(property: string): string {
    if (property.includes(".")) {
      return property;
    }
    const entityCtr = this.entityCtr();
    if (!entityCtr) {
      return property;
    }
    const field = entityCtr.schema.get(property);
    if (!field) {
      return property;
    }
    const entity = this.entity();
    if (!entity) {
      return property;
    }
    const refs = this.findEmbeddedEntityRefs(field, entity.getType());
    return refs.length === 1 ? `${property}.${refs[0]}` : property;
  }

  protected initFilter(): DataFilter<E> {
    const filter: DataFilter<E> = { ...(this.filter() ?? {}) };
    const relationProperty = this.relationProperty();
    if (relationProperty) {
      // only show related entities
      if (typeof relationProperty === "string") {
        Object.assign(filter, this.getFilterForProperty(relationProperty));
      } else if (relationProperty.length > 0) {
        filter["$or"] = relationProperty.map((prop) =>
          this.getFilterForProperty(prop),
        );
      }
    }

    return filter;
  }

  private getFilterForProperty(property: string) {
    const relatedEntityId = this.entity()?.getId();
    const entityCtr = this.entityCtr();
    if (!relatedEntityId || !entityCtr) {
      return {};
    }
    if (property.includes(".")) {
      const [outerProp, innerProp] = property.split(".", 2);
      const outerIsArray = entityCtr.schema.get(outerProp)?.isArray;
      return outerIsArray
        ? {
            [outerProp]: { $elemMatch: { [innerProp]: relatedEntityId } },
          }
        : { [`${outerProp}.${innerProp}`]: relatedEntityId };
    }

    const isArray = entityCtr.schema.get(property)?.isArray;
    return {
      [property]: isArray
        ? { $elemMatch: { $eq: relatedEntityId } }
        : relatedEntityId,
    };
  }

  /** Check whether a schema field directly references the given entity type. */
  private fieldReferencesType(
    field: EntitySchemaField,
    entityType: string,
  ): boolean {
    if (field.dataType !== EntityDatatype.dataType) {
      return false;
    }
    return Array.isArray(field.additional)
      ? field.additional.includes(entityType)
      : field.additional === entityType;
  }

  /**
   * Find inner field names in an embedded schema's `additional` config
   * that reference the given entity type.
   */
  private findEmbeddedEntityRefs(
    field: EntitySchemaField,
    entityType: string,
  ): string[] {
    const additional = field?.additional;
    if (
      typeof additional !== "object" ||
      additional === null ||
      Array.isArray(additional)
    ) {
      return [];
    }
    return Object.entries<any>(additional)
      .filter(
        ([, inner]) =>
          inner?.dataType === EntityDatatype.dataType &&
          this.fieldReferencesType(inner, entityType),
      )
      .map(([key]) => key);
  }

  createNewRecordFactory() {
    return () => {
      const entityCtr = this.entityCtr();
      if (!entityCtr) {
        throw new Error("Cannot create related record without entity type");
      }

      const rec = new entityCtr();
      this.filterService.alignEntityWithFilter(rec, this.filterObj());
      return rec;
    };
  }

  protected getDefaultColumns(): FormFieldConfig[] {
    return [];
  }

  protected getColumns(value: ColumnConfig[] | undefined): FormFieldConfig[] {
    if (!Array.isArray(value) || value.length === 0) {
      return this.getDefaultColumns();
    }
    return value.map((column) => toFormFieldConfig(column));
  }
}
