import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
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
import { InMemoryDataSource } from "../../common-components/entities-table/in-memory-data-source";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "../../entity/entity-special-loader/entity-special-loader.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";

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
  protected readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly screenWidthObserver = inject(ScreenWidthObserver);
  protected readonly filterService = inject(FilterService);
  private readonly entitySpecialLoader = inject(EntitySpecialLoaderService, {
    optional: true,
  });

  /** currently viewed/main entity for which related entities are displayed in this component */
  entity = input<Entity>();

  /** entity type of the related entities to be displayed */
  entityType = input<string>();

  /**
   * Property name of the related entities that holds the entity id to be matched
   * with the id of the current main entity. If not explicitly set, inferred from schema.
   */
  property = input<string | string[]>();

  /**
   * The special service or method to load data via an index or other special method.
   */
  loaderMethod = input<LoaderMethod>();

  /**
   * Columns to be displayed in the table
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

  /**
   * Data source handling filtering, sorting and pagination for the entities table.
   * Created in injection context (field initializer); allRecords and filter are
   * updated reactively by the constructor effect.
   */
  readonly entityDataSource = new InMemoryDataSource<E>();

  /** All loaded records before filtering (computed alias into entityDataSource). */
  readonly data = computed<E[] | undefined>(
    () => this.entityDataSource.allRecords(),
  );

  /** Effective filter applied to the table (computed alias into entityDataSource). */
  readonly filterObj = computed<DataFilter<E>>(
    () => this.entityDataSource.filter(),
  );

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

  private readonly currentScreenSize = signal(
    this.screenWidthObserver.currentScreenSize(),
  );

  constructor() {
    // Delegate real-time update subscription to the data source.
    // This also marks allRecords = undefined (loading) when entityCtr changes.
    this.entityDataSource.connectEntityUpdates(this.entityCtr);

    this.screenWidthObserver
      .shared()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.currentScreenSize.set(
          this.screenWidthObserver.currentScreenSize(),
        );
      });

    effect((onCleanup) => {
      const entityCtr = this.entityCtr();
      const entity = this.entity();
      if (!entityCtr || !entity) return;

      // Update filter so the table immediately reflects the new relationship.
      this.entityDataSource.filter.set(this.initFilter());

      // Show inactive records when visiting an archived parent entity (once).
      if (untracked(() => this.showInactive()) === undefined) {
        this.showInactive.set(entity.anonymized);
      }

      // Load initial data; cancel if entityCtr/entity changes before it resolves.
      let cancelled = false;
      onCleanup(() => { cancelled = true; });
      void this.getData().then((data) => {
        if (!cancelled) this.entityDataSource.allRecords.set(data);
      });
    });
  }

  protected getData(): Promise<E[]> {
    const entity = this.entity();
    const entityCtr = this.entityCtr();
    if (!entity) {
      return Promise.resolve([]);
    }
    const loaderMethod = this.loaderMethod();
    if (loaderMethod && this.entitySpecialLoader) {
      return this.entitySpecialLoader.loadDataFor(loaderMethod, entity);
    }

    if (!entityCtr) {
      return Promise.resolve([]);
    }

    return this.entityMapper.loadType(entityCtr);
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
