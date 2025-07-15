import { Injectable, inject } from "@angular/core";
import {
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
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { DateFilter } from "../filters/dateFilter";
import { BooleanFilter } from "../filters/booleanFilter";
import { ConfigurableEnumFilter } from "../filters/configurableEnumFilter";
import { EntityFilter } from "../filters/entityFilter";
import { DynamicPlaceholderValueService } from "app/core/default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { todoDueStatusFilter } from "../../../features/todos/add-default-todo-views";

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
      const schema = entityConstructor.schema.get(filterConfig.id) || {};
      let filter: Filter<T>;
      const label = filterConfig.label ?? schema.labelShort ?? schema.label;
      const type = filterConfig.type ?? schema.dataType;
      if (type == "configurable-enum") {
        filter = new ConfigurableEnumFilter(
          filterConfig.id,
          label,
          this.enumService.getEnumValues(schema.additional),
          filterConfig.singleSelectOnly,
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
      } else if (
        // type: entity reference
        this.entities.has(filterConfig.type) ||
        this.entities.has(schema.additional)
      ) {
        const entityType = filterConfig.type || schema.additional;
        const filterEntities =
          await this.entityMapperService.loadType(entityType);
        filter = new EntityFilter(filterConfig.id, label, filterEntities);
      } else {
        const options = [...new Set(data.map((c) => c[filterConfig.id]))];
        const fSO: FilterSelectionOption<T>[] =
          SelectableFilter.generateOptions(options, filterConfig.id);

        filter = new SelectableFilter<T>(filterConfig.id, fSO, label);
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
