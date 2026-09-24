import { inject, Injectable } from "@angular/core";
import {
  createEmptyValueFilter,
  DataFilter,
  EMPTY_FILTER_OPTION_KEY,
  Filter,
  FilterSelectionOption,
  SelectableFilter,
} from "../filters/filters";
import {
  BooleanFilterConfig,
  DateRangeFilterConfig,
  FilterConfig,
  PrebuiltFilterConfig,
} from "../../entity-list/EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { FilterService } from "../filter.service";
import { defaultDateFilters } from "../../basic-datatypes/date/date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { StringDatatype } from "../../basic-datatypes/string/string.datatype";
import { LongTextDatatype } from "../../basic-datatypes/string/long-text.datatype";
import { DateFilter } from "../filters/dateFilter";
import { StringFilter } from "../filters/stringFilter";
import { BooleanFilter } from "../filters/booleanFilter";
import { ConfigurableEnumFilter } from "../filters/configurableEnumFilter";
import { EntityFilter } from "../filters/entityFilter";
import { DynamicPlaceholderValueService } from "app/core/default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { todoDueStatusFilter } from "../../../features/todos/add-default-todo-views";
import { EmailDatatype } from "../../basic-datatypes/string/email.datatype";
import { UrlDatatype } from "../../basic-datatypes/string/url.datatype";
import { asArray } from "app/utils/asArray";
import {
  EmbeddedFieldRef,
  getEmbeddedFieldLabel,
  resolveEmbeddedField,
} from "../../entity/schema/embedded-schema-field.util";

@Injectable({
  providedIn: "root",
})
export class FilterGeneratorService {
  private enumService = inject(ConfigurableEnumService);
  private entities = inject(EntityRegistry);
  private entityMapperService = inject(EntityMapperService);
  private filterService = inject(FilterService);
  private schemaService = inject(EntitySchemaService);
  private placeholderService = inject(DynamicPlaceholderValueService);

  /**
   *
   * @param filterConfigs
   * @param entityConstructor
   * @param data
   * @param onlyShowUsedOptions (Optional) whether to remove those filter options for selection that are not present in the data
   */
  async generate<T extends Entity>(
    filterConfigs: FilterConfig[],
    entityConstructor: EntityConstructor<T>,
    data: T[],
    onlyShowUsedOptions = false,
  ): Promise<Filter<T>[]> {
    const filters: Filter<T>[] = [];
    for (let filterConfig of filterConfigs) {
      const embedded = resolveEmbeddedField(
        this.schemaService,
        entityConstructor,
        filterConfig.id,
      );
      const schema =
        embedded?.innerSchema ??
        entityConstructor.schema.get(filterConfig.id) ??
        {};
      let filter: Filter<T>;
      const label =
        filterConfig.label ??
        (embedded
          ? getEmbeddedFieldLabel(embedded)
          : (schema.labelShort ?? schema.label));
      const type = filterConfig.type ?? schema.dataType;
      if (type == "configurable-enum") {
        // Add invalid and empty options
        const enumValues =
          this.enumService.getEnumValues(schema.additional) || [];
        const validIds = new Set(enumValues.map((ev) => ev.id));
        // Get all unique values from data for this field (by id if object, or value)
        // Handle both single values and arrays (for isArray / multi-select fields)
        const extractId = (value: any) =>
          value && typeof value === "object" && "id" in value
            ? value.id
            : value;

        const dataValues = [
          ...new Set(
            (data ?? []).flatMap((e) => {
              if (embedded) {
                return this.getEmbeddedFieldValues(e, embedded).map(extractId);
              }
              const v = e?.[filterConfig.id];
              // Handle array values (multi-select fields)
              if (Array.isArray(v)) {
                return v.map(extractId);
              }
              // Handle single object value
              return extractId(v);
            }),
          ),
        ];

        // Find invalid options (not in enum)
        const invalidOptions = dataValues
          .filter(
            (v) =>
              v !== undefined && v !== null && v !== "" && !validIds.has(v),
          )
          .map((invalidId) => ({
            key: `invalid:${invalidId}`,
            label: $localize`:filter option:[Invalid: ${invalidId}]`,
            isInvalid: true,
            filter: { [filterConfig.id + ".id"]: invalidId } as DataFilter<T>,
          }));

        const enumFilter = new ConfigurableEnumFilter(
          filterConfig.id,
          label,
          enumValues,
          filterConfig.singleSelectOnly,
          invalidOptions,
        );
        filter = enumFilter;
        const isArrayField = !embedded && schema.isArray === true;
        enumFilter.options.unshift(
          this.createEmptyOption(filterConfig.id, true, isArrayField, embedded),
        );
      } else if (type == "boolean") {
        filter = new BooleanFilter(
          filterConfig.id,
          label,
          filterConfig as BooleanFilterConfig,
        );
      } else if (type == "prebuilt") {
        filterConfig = this.loadPrebuiltFilter(
          filterConfig as PrebuiltFilterConfig<T>,
        );
        filter = new SelectableFilter(
          filterConfig.id,
          (filterConfig as PrebuiltFilterConfig<T>).options,
          filterConfig.label ?? label,
          filterConfig.singleSelectOnly,
        );
      } else if (
        this.schemaService.getDatatypeOrDefault(type, true) instanceof
        DateDatatype
      ) {
        filter = new DateFilter(
          filterConfig.id,
          label,
          (filterConfig as DateRangeFilterConfig).options ?? defaultDateFilters,
        );
      } else if (this.isFreeTextField(type, schema)) {
        filter = new StringFilter(filterConfig.id, label);
      } else if (
        // type: entity reference (a field can allow referencing several entity types at once,
        // in which case `additional` is an array rather than a single type name)
        this.entities.has(filterConfig.type) ||
        asArray(schema.additional).some((t) => this.entities.has(t))
      ) {
        const entityTypes = filterConfig.type
          ? [filterConfig.type]
          : asArray(schema.additional).filter((t) => this.entities.has(t));
        const filterEntities = (
          await Promise.all(
            entityTypes.map((t) => this.entityMapperService.loadType(t)),
          )
        ).flat();
        const entityFilter = new EntityFilter(
          filterConfig.id,
          label,
          filterEntities,
        );
        filter = entityFilter;
        const isArrayField = !embedded && schema.isArray === true;
        entityFilter.options.unshift(
          this.createEmptyOption(
            filterConfig.id,
            false,
            isArrayField,
            embedded,
          ),
        );
      } else {
        const options = embedded
          ? [
              ...new Set(
                (data ?? []).flatMap((e) =>
                  this.getEmbeddedFieldValues(e, embedded),
                ),
              ),
            ]
          : [...new Set(data.map((c) => c[filterConfig.id]))];
        const fSO: FilterSelectionOption<T>[] =
          SelectableFilter.generateOptions(options, filterConfig.id);
        const isArrayField = !embedded && schema.isArray === true;
        fSO.unshift(
          this.createEmptyOption(
            filterConfig.id,
            false,
            isArrayField,
            embedded,
          ),
        );

        filter = new SelectableFilter<T>(filterConfig.id, fSO, label);
      }

      if (embedded) {
        this.wrapFilterForEmbeddedField(filter, filterConfig.id, embedded);
      }

      if (filterConfig.hasOwnProperty("default")) {
        let defaultVal = this.placeholderService.getPlaceholderValue(
          filterConfig.default,
        );
        if (defaultVal) {
          let defaultString = defaultVal.toString();
          filter.selectedOptionValues = [defaultString];
        } else {
          filter.selectedOptionValues = [filterConfig.default];
        }
      }

      if (filter instanceof SelectableFilter) {
        if (onlyShowUsedOptions) {
          filter.options = filter.options.filter((option) =>
            data.some(this.filterService.getFilterPredicate(option.filter)),
          );
        }
        // Filters should only be added, if they have more than one (the default) option
        if (filter.options?.length <= 1) {
          continue;
        }
      }
      filters.push(filter);
    }
    return filters;
  }

  private createEmptyOption<T extends Entity>(
    fieldName: string,
    includeNestedId = false,
    includeEmptyArray = false,
    embedded?: EmbeddedFieldRef,
  ): FilterSelectionOption<T> {
    let filter: DataFilter<T>;
    if (embedded) {
      const innerEmpty = createEmptyValueFilter<T>(
        embedded.innerProp,
        includeNestedId,
        false,
      );
      filter = embedded.isArray
        ? ({
            // an entry counts as "not defined" if there are no embedded items at all,
            // or if at least one of the items does not have a value for this property
            $or: [
              { [embedded.outerProp]: { $exists: false } },
              { [embedded.outerProp]: { $size: 0 } },
              this.wrapInElemMatch<T>(innerEmpty, embedded.outerProp),
            ],
          } as DataFilter<T>)
        : createEmptyValueFilter<T>(
            `${embedded.outerProp}.${embedded.innerProp}`,
            includeNestedId,
            false,
          );
    } else {
      filter = createEmptyValueFilter(
        fieldName,
        includeNestedId,
        includeEmptyArray,
      );
    }

    return {
      key: EMPTY_FILTER_OPTION_KEY,
      label: $localize`:filter option:not defined`,
      isEmpty: true,
      filter,
    };
  }

  /**
   * Adapt the filter built for a property nested inside an embedded field
   * (built as if `filterId` were a normal, flat field) so that its query actually matches
   * against the outer, embedding field - see {@link wrapEmbeddedDataFilter}.
   *
   * This works generically for any {@link Filter} produced by {@link generate}, regardless of its
   * concrete type: for a {@link SelectableFilter} (and its subclasses), each option's query is
   * adapted; for any other filter type, its `getFilter()` is wrapped to adapt its result.
   */
  private wrapFilterForEmbeddedField<T extends Entity>(
    filter: Filter<T>,
    filterId: string,
    embedded: EmbeddedFieldRef,
  ): void {
    const rewrap = (query: DataFilter<T> | undefined) =>
      this.wrapEmbeddedDataFilter(query, filterId, embedded);

    if (filter instanceof SelectableFilter) {
      // the empty/"not defined" option is already built directly against the embedded
      // field by createEmptyOption and must not be wrapped again
      filter.options = filter.options.map((option) =>
        option.key === EMPTY_FILTER_OPTION_KEY
          ? option
          : { ...option, filter: rewrap(option.filter) },
      );
    } else {
      const originalGetFilter = filter.getFilter.bind(filter);
      filter.getFilter = () => rewrap(originalGetFilter());
    }
  }

  /**
   * Adapt a query built for the full id of a property nested inside an embedded field
   * (e.g. "childrenAttendance.participant") into a query that matches against the outer,
   * embedding field instead:
   * - if the outer field holds an array of embedded objects, using `$elemMatch`
   *   (e.g. `{ childrenAttendance: { $elemMatch: { participant: id } } }`,
   *   matching if *any* of the entries has this value)
   * - if the outer field holds a single embedded object, using a flat dot-path query
   *   (e.g. `{ "phoneNumber.type": "mobile" }`)
   */
  private wrapEmbeddedDataFilter<T extends Entity>(
    query: DataFilter<T> | undefined,
    filterId: string,
    embedded: EmbeddedFieldRef,
  ): DataFilter<T> | undefined {
    if (!query || Object.keys(query).length === 0) {
      return query;
    }

    if (!embedded.isArray) {
      return this.rewriteEmbeddedKeys(
        query,
        filterId,
        `${embedded.outerProp}.${embedded.innerProp}`,
      ) as DataFilter<T>;
    }

    const rewritten = this.rewriteEmbeddedKeys(
      query,
      filterId,
      embedded.innerProp,
    );
    return this.wrapInElemMatch<T>(rewritten, embedded.outerProp);
  }

  /**
   * Wrap a per-item query in `$elemMatch` to match against an array field, matching if *any*
   * item satisfies it - hoisting a top-level `$or` out of `$elemMatch` first (e.g. turning
   * `{ $elemMatch: { $or: [A, B] } }` into `{ $or: [{ $elemMatch: A }, { $elemMatch: B }] }`),
   * since a compound operator like `$or` directly inside `$elemMatch` is not supported by the
   * mongo2js query parser used here. Both forms are logically equivalent for `$elemMatch`
   * (an item matching A-or-B exists iff an item matching A exists, or one matching B exists).
   */
  private wrapInElemMatch<T extends Entity>(
    query: any,
    outerProp: string,
  ): DataFilter<T> {
    if (query && typeof query === "object" && Array.isArray(query.$or)) {
      return {
        $or: query.$or.map((branch: any) =>
          this.wrapInElemMatch<T>(branch, outerProp),
        ),
      } as DataFilter<T>;
    }
    return { [outerProp]: { $elemMatch: query } } as DataFilter<T>;
  }

  /**
   * Recursively replace any query key equal to `fromKey` (or `fromKey + ".id"`, used e.g. for
   * configurable-enum values) with `toKey` (or `toKey + ".id"`) inside a DataFilter query object.
   */
  private rewriteEmbeddedKeys(query: any, fromKey: string, toKey: string): any {
    if (Array.isArray(query)) {
      return query.map((q) => this.rewriteEmbeddedKeys(q, fromKey, toKey));
    }
    if (query && typeof query === "object") {
      const result: any = {};
      for (const [key, value] of Object.entries(query)) {
        let newKey = key;
        if (key === fromKey) {
          newKey = toKey;
        } else if (key === `${fromKey}.id`) {
          newKey = `${toKey}.id`;
        }
        result[newKey] = this.rewriteEmbeddedKeys(value, fromKey, toKey);
      }
      return result;
    }
    return query;
  }

  /**
   * Extract the values of a property nested inside an embedded field from a single entity
   * (e.g. the "participant" of every entry of a Note's "childrenAttendance").
   */
  private getEmbeddedFieldValues<T extends Entity>(
    entity: T,
    embedded: EmbeddedFieldRef,
  ): any[] {
    const rawValue = entity?.[embedded.outerProp];
    const items = embedded.isArray
      ? Array.isArray(rawValue)
        ? rawValue
        : []
      : [rawValue];
    return items.map((item) => item?.[embedded.innerProp]);
  }

  /**
   * Whether the field is a free-text field that should be filtered
   * with a text-search input (see {@link StringFilter}):
   * dataType "string" or "long-text", edited with a plain text edit component.
   */
  private isFreeTextField(type: string, schema: EntitySchemaField): boolean {
    const stringDataTypes = [
      StringDatatype,
      LongTextDatatype,
      EmailDatatype,
      UrlDatatype,
    ];

    const editComponent =
      schema.editComponent ??
      this.schemaService.getDatatypeOrDefault(type)?.editComponent;

    return (
      stringDataTypes.some((dt) => dt.dataType === type) &&
      stringDataTypes.some(
        (dt) =>
          this.schemaService.getDatatypeOrDefault(dt.dataType).editComponent ===
          editComponent,
      )
    );
  }

  /**
   * Load additional filter details from a repository of prebuilt configs,
   * if available.
   * If no information is available, the filterConfig is returned as is.
   * @param filterConfig Filter to load or extend
   * @private
   */
  private loadPrebuiltFilter<T>(
    filterConfig: PrebuiltFilterConfig<T>,
  ): PrebuiltFilterConfig<T> {
    switch (filterConfig.id) {
      case todoDueStatusFilter.id:
        return {
          ...todoDueStatusFilter,
          ...filterConfig,
        };
      default:
        return filterConfig;
    }
  }
}
