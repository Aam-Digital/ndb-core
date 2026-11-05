import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  model,
  signal,
} from "@angular/core";
import { CustomFormLinkButtonComponent } from "app/features/public-form/custom-form-link-button/custom-form-link-button.component";
import {
  getVisibleColumnIds,
  injectCurrentScreenSize,
} from "../../../utils/media/visible-columns";
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
import { FilterService } from "../../filter/filter.service";
import {
  combineFilterConditions,
  DataFilter,
} from "../../filter/filters/filters";
import { EntityRelationsService } from "../../entity/entity-mapper/entity-relations.service";
import { asArray } from "../../../utils/asArray";
import { DataSourceType } from "#src/app/core/common-components/entities-table/data-source/available-data-sources";
import { LoadRecordConfig } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { resolveDataSource } from "#src/app/core/common-components/entities-table/data-source/data-source-resolver";

/**
 * Load and display a list of entity subrecords (entities related to the current entity details view).
 */
@DynamicComponent("RelatedEntities")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-related-entities",
  templateUrl: "./related-entities.component.html",
  imports: [EntitiesTableComponent, CustomFormLinkButtonComponent],
})
export class RelatedEntitiesComponent<E extends Entity> {
  private entityRegistry = inject(EntityRegistry);
  protected filterService = inject(FilterService);
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly injector = inject(Injector);

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

  dataSource = input<DataSourceType>();
  recordsDataSource = computed(() =>
    resolveDataSource<E>(
      this.injector,
      this.dataSource(),
      this.loaderMethod(),
      this.entityCtr(),
    ),
  );

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
    getVisibleColumnIds(this._columns(), this.currentScreenSize()),
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
  /**
   * Whether to show the button to create a new related record.
   */
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
  private readonly currentScreenSize = injectCurrentScreenSize();

  constructor() {
    effect(() => {
      this.filterObj.set(this.initFilter());
    });

    effect(() => {
      if (this.showInactive() === undefined) {
        this.showInactive.set(this.entity().anonymized);
      }
    });

    effect(() => {
      // each loader decides for itself how to handle an ambiguous relation property
      const config: LoadRecordConfig<E> = {
        entityCtr: this.entityCtr(),
        forEntity: this.entity(),
        relationProperty: this.relationProperty(),
        loaderMethod: this.loaderMethod(),
      };
      this.recordsDataSource().loadRecordConfig.set(config);
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
    const found = this.entityRelations.getReferencingFieldPaths(
      entityCtr,
      entity.getType(),
    );
    return found.length === 1 ? found[0] : found;
  }

  /**
   * Resolve shorthand property names that point to an embedded schema
   * into dot-paths (e.g. "attendance" → "attendance.participant").
   */
  private resolvePropertyPath(property: string): string {
    const entityCtr = this.entityCtr();
    const entity = this.entity();
    if (property.includes(".") || !entityCtr || !entity) {
      return property;
    }
    return this.entityRelations.resolveReferencingFieldPath(
      entityCtr,
      property,
      entity.getType(),
    );
  }

  protected initFilter(): DataFilter<E> {
    // only show related entities: those linking to the entity through any of the relation properties
    const relatedEntityId = this.entity()?.getId();
    const entityCtr = this.entityCtr();
    const conditions =
      relatedEntityId && entityCtr
        ? asArray(this.relationProperty())
            .filter((property) => !!property)
            .flatMap((property) =>
              this.entityRelations.referenceConditions(
                entityCtr,
                property,
                relatedEntityId,
              ),
            )
        : [];
    const relationFilter = (
      conditions.length > 0 ? { $or: conditions } : {}
    ) as DataFilter<E>;

    return combineFilterConditions(this.filter() ?? {}, relationFilter);
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
