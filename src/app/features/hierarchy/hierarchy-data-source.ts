import {
  computed,
  effect,
  inject,
  linkedSignal,
  Signal,
  signal,
  untracked,
} from "@angular/core";
import { InMemoryDataSource } from "#src/app/core/common-components/entities-table/data-source/in-memory-data-source";
import { RowOptions } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { DynamicComponentConfig } from "#src/app/core/config/dynamic-components/dynamic-component-config.interface";
import { Entity } from "#src/app/core/entity/model/entity";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { UrlStateService } from "#src/app/utils/url-state/url-state.service";
import { isHierarchyField } from "./hierarchy-fields";
import {
  buildHierarchyView,
  descendantIds,
  HierarchyRow,
  HierarchyView,
  resolveParentIds,
} from "./hierarchy-tree";

/** Options of the hierarchy data source in a list config: `"dataSource": { "name": "hierarchy", "config": { ... } }` */
export type HierarchyDataSourceConfig = {
  /**
   * The fields that users can display the hierarchy by, the first one is the default.
   * Only links to one record of the same type are used, other fields are ignored.
   */
  hierarchyFields?: string[];
};

/** URL query param holding the user's choice of the hierarchy field in a list */
export const HIERARCHY_URL_PARAM = "_hierarchy";
/** value of {@link HIERARCHY_URL_PARAM} for the flat list */
export const NO_HIERARCHY = "none";
/** CSS class of rows that are only shown as the parent of a matching record */
export const CONTEXT_ROW_CLASS = "hierarchy-context-row";
/** CSS class of rows at the top level, each starting a branch of the tree */
export const TOP_ROW_CLASS = "hierarchy-top-row";
/** CSS class of rows with sub-records */
export const PARENT_ROW_CLASS = "hierarchy-parent-row";

/**
 * Shows the records of a list indented below their parent records.
 *
 * - In a list, the hierarchy fields come from the `hierarchyFields` option
 *   and the user chooses one of them (or none) through a toolbar control.
 * - In a related-entities section of a record of the same type, the relation `property`
 *   is the hierarchy field and the section shows all records below the page's record.
 *
 * Without a valid hierarchy field this works like the {@link InMemoryDataSource}.
 */
export class HierarchyDataSource<
  T extends Entity,
> extends InMemoryDataSource<T> {
  static readonly DATA_SOURCE_NAME = "hierarchy";

  private readonly urlState = inject(UrlStateService);

  /** The record whose sub-records are shown, in a section of its details page. */
  readonly rootRecord = computed<Entity | undefined>(() => {
    const config = this.loadRecordConfig();
    const root = config?.forEntity;
    const isOwnType = root?.getType() === config?.entityCtr?.ENTITY_TYPE;
    return isOwnType && this.isValidField(config.relationProperty)
      ? root
      : undefined;
  });

  /** The valid hierarchy fields, in the configured order. */
  readonly hierarchyFields = computed<string[]>(() => {
    if (this.rootRecord()) {
      return [this.loadRecordConfig().relationProperty as string];
    }
    const { hierarchyFields } = this.config() as HierarchyDataSourceConfig;
    return Array.isArray(hierarchyFields)
      ? hierarchyFields.filter((field) => this.isValidField(field))
      : [];
  });

  /** The field the records are currently arranged by (none: a flat list). */
  readonly activeField = linkedSignal<string | undefined>(() => {
    const fields = this.hierarchyFields();
    if (this.rootRecord()) {
      return fields[0];
    }
    const fromUrl = untracked(() =>
      this.urlState.getUrlParam(HIERARCHY_URL_PARAM),
    );
    if (fromUrl === NO_HIERARCHY) {
      return undefined;
    }
    return fields.includes(fromUrl) ? fromUrl : fields[0];
  });

  /** Records whose sub-records are hidden. Not remembered, the tree opens fully expanded. */
  readonly collapsedIds = signal<ReadonlySet<string>>(new Set());

  /**
   * The filtered records arranged as a tree, each level sorted on its own
   * (none for a flat list). The table shows its rows, see {@link _orderData}.
   */
  private readonly view = computed<HierarchyView<T> | undefined>(() => {
    const field = this.activeField();
    if (!field) {
      return undefined;
    }
    const sort = this.effectiveSort();
    return buildHierarchyView(this.allRecords(), this.filteredRecords(), {
      parentField: field,
      rootId: this.rootRecord()?.getId(),
      sort: sort
        ? {
            active: sort.active ?? "",
            direction: sort.direction,
            sortValueFns: this.sortValueFns(),
          }
        : undefined,
      collapsedIds: this.collapsedIds(),
    });
  });

  /** The records in the order of the {@link view}, kept as one array for the table. */
  private readonly viewOrder = computed(() =>
    this.view()?.rows.map((row) => row.record),
  );

  /** The tree position of each displayed record, by id. */
  readonly rows: Signal<ReadonlyMap<string, HierarchyRow<T>>> = computed(
    () =>
      new Map(this.view()?.rows.map((row) => [row.record.getId(), row]) ?? []),
  );

  /** Whether any record with sub-records is expanded. */
  readonly anyExpanded = computed(() => {
    const collapsed = this.collapsedIds();
    return [...(this.view()?.expandableIds ?? [])].some(
      (id) => !collapsed.has(id),
    );
  });

  override readonly usesPagination = computed(() => !this.activeField());

  /** the row options by record id: a live update replaces the record object, the row keeps its options */
  private readonly rowOptionsById: Signal<ReadonlyMap<string, RowOptions>> =
    computed(() => {
      const view = this.view();
      const optionsById = new Map<string, RowOptions>();
      for (const row of view?.rows ?? []) {
        const id = row.record.getId();
        const { treeCell, childCount } = this.cellConfigs(id);
        optionsById.set(id, {
          prefix: treeCell,
          // after the title: "Village meetings (3)"
          suffix: row.isCollapsed ? childCount : undefined,
          cssClass: rowClasses(row),
          selectable: !row.isContext,
        });
      }
      // "select all" leaves out records hidden under a collapsed row
      for (const id of view?.hiddenIds ?? []) {
        optionsById.set(id, { selectable: false });
      }
      return optionsById;
    });

  override rowOptionsOf(record: T): RowOptions | undefined {
    return this.rowOptionsById().get(record.getId());
  }

  private readonly hierarchyControls: DynamicComponentConfig[] = [
    { component: "HierarchySelect", config: { dataSource: this } },
    { component: "HierarchyExpandAll", config: { dataSource: this } },
  ];
  override readonly toolbarControls = computed(() =>
    this.hierarchyFields().length > 0 && !this.rootRecord()
      ? [this.freeTextFilterControl, ...this.hierarchyControls]
      : [this.freeTextFilterControl],
  );

  /** the prefix and suffix configs by record id, kept stable so that rows do not reload their components */
  private readonly cellConfigsById = new Map<string, CellConfigs>();

  /** All records below the root record (only in a section). */
  private readonly branchIds = computed<ReadonlySet<string> | undefined>(() => {
    const root = this.rootRecord();
    const field = this.activeField();
    if (!root || !field) {
      return undefined;
    }
    const parents = resolveParentIds(this.allRecords(), field, root.getId());
    return descendantIds(parents, root.getId());
  });

  /** filters and search text, to notice when they change */
  private readonly filterState = computed(() =>
    JSON.stringify([this.dataFilter(), this.searchText().trim()]),
  );

  constructor() {
    super();

    effect(() => {
      // a changed filter shows all its matches, at every level
      this.filterState();
      untracked(() => this.expandAll());
    });
    effect(() => {
      // show the new order (the table's pipeline does not know signals)
      this.viewOrder();
      untracked(() => (this.data = this.data));
    });
  }

  /** Arrange the records by another field (or none), as chosen by the user. */
  selectField(field: string | undefined) {
    this.activeField.set(field);
    this.expandAll();
    const isDefault = field === this.hierarchyFields()[0];
    this.urlState.updateUrlParams(
      { [HIERARCHY_URL_PARAM]: isDefault ? null : (field ?? NO_HIERARCHY) },
      false,
    );
  }

  toggleCollapsed(recordId: string) {
    this.collapsedIds.update((collapsed) => {
      const next = new Set(collapsed);
      if (!next.delete(recordId)) {
        next.add(recordId);
      }
      return next;
    });
  }

  expandAll() {
    if (this.collapsedIds().size > 0) {
      this.collapsedIds.set(new Set());
    }
  }

  collapseAll() {
    this.collapsedIds.set(new Set(this.view()?.expandableIds ?? []));
  }

  /**
   * The records in tree order, or sorted as a flat list without a hierarchy field.
   * Called by the table's pipeline instead of sorting a flat list.
   */
  override _orderData(data: T[]): T[] {
    // undefined while the base class subscribes its pipeline during construction
    const order = this.viewOrder && untracked(this.viewOrder);
    return order ?? super._orderData(data);
  }

  /**
   * In a section, the condition linking the records to the page's record only covers its direct sub-records:
   * all records of the branch below it match instead.
   */
  protected override getFilterPredicate(
    filter: DataFilter<T>,
  ): (record: T) => boolean {
    const branch = this.branchIds();
    if (!branch) {
      return super.getFilterPredicate(filter);
    }
    const predicate = super.getFilterPredicate(
      withoutCondition(filter, this.activeField()!, this.rootRecord()!.getId()),
    );
    return (record) => branch.has(record.getId()) && predicate(record);
  }

  protected override async processEntityUpdate(update: UpdatedEntity<T>) {
    const field = this.activeField();
    const id = update.entity.getId();
    const before = this.allRecords().find((record) => record.getId() === id);
    await super.processEntityUpdate(update);

    if (!field || update.type === "remove") {
      return;
    }
    const isNewOrMoved = !before || before[field] !== update.entity[field];
    if (isNewOrMoved) {
      this.expandParentsOf(id, field);
    }
  }

  /** Show a new or moved record by expanding all its parents. */
  private expandParentsOf(recordId: string, field: string) {
    const collapsed = this.collapsedIds();
    if (collapsed.size === 0) {
      return;
    }
    const parents = resolveParentIds(
      this.allRecords(),
      field,
      this.rootRecord()?.getId(),
    );
    const next = new Set(collapsed);
    for (let id = parents.get(recordId); id; id = parents.get(id)) {
      next.delete(id);
    }
    this.collapsedIds.set(next);
  }

  private isValidField(field: unknown): field is string {
    return (
      typeof field === "string" &&
      isHierarchyField(this.loadRecordConfig()?.entityCtr, field)
    );
  }

  private cellConfigs(recordId: string): CellConfigs {
    let configs = this.cellConfigsById.get(recordId);
    if (!configs) {
      const config = { dataSource: this, recordId };
      configs = {
        treeCell: { component: "HierarchyTreeCell", config },
        childCount: { component: "HierarchyChildCount", config },
      };
      this.cellConfigsById.set(recordId, configs);
    }
    return configs;
  }
}

/** The components shown in the first cell of a row, before and after the title. */
interface CellConfigs {
  treeCell: DynamicComponentConfig;
  childCount: DynamicComponentConfig;
}

/** The CSS classes of a row, styled globally (`_hierarchy-rows.scss`) as rows belong to the table. */
function rowClasses(row: HierarchyRow): string | undefined {
  const classes = [
    row.isContext && CONTEXT_ROW_CLASS,
    row.level === 0 && TOP_ROW_CLASS,
    row.childCount > 0 && PARENT_ROW_CLASS,
  ].filter(Boolean);
  return classes.length > 0 ? classes.join(" ") : undefined;
}

/**
 * The filter without the condition `{ [key]: value }`,
 * also inside `$and` (e.g. combined with the restriction to records that are not archived).
 */
export function withoutCondition<T>(
  filter: DataFilter<T>,
  key: string,
  value: unknown,
): DataFilter<T> {
  const result: DataFilter<T> = {};
  for (const [k, v] of Object.entries(filter ?? {})) {
    if (k === key && v === value) {
      continue;
    }
    result[k] =
      k === "$and" && Array.isArray(v)
        ? v
            .map((condition) => withoutCondition(condition, key, value))
            .filter((condition) => Object.keys(condition).length > 0)
        : v;
  }
  return result;
}
