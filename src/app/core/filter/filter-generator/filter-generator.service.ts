import { Injectable } from "@angular/core";
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

@Injectable({
  providedIn: "root",
})
export class FilterGeneratorService {
  constructor(
    private enumService: ConfigurableEnumService,
    private entities: EntityRegistry,
    private entityMapperService: EntityMapperService,
    private filterService: FilterService,
    private schemaService: EntitySchemaService,
  ) {}

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
    for (const filterConfig of filterConfigs) {
      const schema = entityConstructor.schema.get(filterConfig.id) || {};
      let filter: Filter<T>;
      const type = filterConfig.type ?? schema.dataType;
      if (type == "configurable-enum") {
        filter = new ConfigurableEnumFilter(
          filterConfig.id,
          filterConfig.label || schema.label,
          this.enumService.getEnumValues(schema.additional),
        );
      } else if (type == "boolean") {
        filter = new BooleanFilter(
          filterConfig.id,
          filterConfig.label || schema.label,
          filterConfig as BooleanFilterConfig,
        );
      } else if (type == "prebuilt") {
        filter = new SelectableFilter(
          filterConfig.id,
          (filterConfig as PrebuiltFilterConfig<T>).options,
          filterConfig.label,
        );
      } else if (
        this.schemaService.getDatatypeOrDefault(type, true) instanceof
        DateDatatype
      ) {
        filter = new DateFilter(
          filterConfig.id,
          filterConfig.label || schema.label,
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
        filter = new EntityFilter(
          filterConfig.id,
          filterConfig.label || schema.label,
          filterEntities,
        );
      } else {
        const options = [...new Set(data.map((c) => c[filterConfig.id]))];
        const fSO: FilterSelectionOption<T>[] =
          SelectableFilter.generateOptions(options, filterConfig.id);

        filter = new SelectableFilter<T>(
          filterConfig.id,
          fSO,
          filterConfig.label || schema.label,
        );
      }

      if (filterConfig.hasOwnProperty("default")) {
        filter.selectedOptionValues = [filterConfig.default];
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
}
