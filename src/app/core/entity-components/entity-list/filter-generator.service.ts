import { Injectable } from "@angular/core";
import {
  DateFilter,
  SelectableFilter,
  BooleanFilter,
  ConfigurableEnumFilter,
  EntityFilter,
  Filter,
} from "../../filter/filters/filters";
import {
  BooleanFilterConfig,
  DateRangeFilterConfig,
  FilterConfig,
  PrebuiltFilterConfig,
} from "./EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigurableEnumService } from "../../configurable-enum/configurable-enum.service";
import { FilterService } from "app/core/filter/filter.service";

@Injectable({
  providedIn: "root",
})
export class FilterGeneratorService {
  constructor(
    private enumService: ConfigurableEnumService,
    private entities: EntityRegistry,
    private entityMapperService: EntityMapperService,
    private filterService: FilterService
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
    onlyShowUsedOptions = false
  ): Promise<Filter<T>[]> {
    const filters: Filter<T>[] = [];
    for (const filterConfig of filterConfigs) {
      const schema = entityConstructor.schema.get(filterConfig.id) || {};
      let filter: Filter<T>;

      switch (schema.dataType || filterConfig.type) {
        case "configurable-enum":
          filter = new ConfigurableEnumFilter(
            filterConfig.id,
            filterConfig.label || schema.label,
            this.enumService.getEnumValues(filterConfig.id)
          );
          break;
        case "boolean":
          filter = new BooleanFilter(
            filterConfig.id,
            filterConfig.label || schema.label,
            filterConfig as BooleanFilterConfig
          );
          break;
        case "prebuilt":
          filter = new SelectableFilter(
            filterConfig.id,
            (filterConfig as PrebuiltFilterConfig<T>).options,
            filterConfig.label
          );
          break;
        default:
          if (filterConfig.id === "date") {
            filter = new DateFilter(
              filterConfig.id,
              filterConfig.label || schema.label,
              (filterConfig as DateRangeFilterConfig).options
            );
          } else if (
            this.entities.has(filterConfig.type) ||
            this.entities.has(schema.additional)
          ) {
            const entityType = filterConfig.type || schema.additional;
            const filterEntities = await this.entityMapperService.loadType(
              entityType
            );
            filter = new EntityFilter(
              filterConfig.id,
              entityType,
              filterEntities
            );
          } else {
            const options = [...new Set(data.map((c) => c[filterConfig.id]))];
            const fSO = SelectableFilter.generateOptions(
              options,
              filterConfig.id
            );

            filter = new SelectableFilter<T>(
              filterConfig.id,
              fSO,
              filterConfig.label || schema.label
            );
          }
      }

      if (filterConfig.hasOwnProperty("default")) {
        filter.selectedOption = filterConfig.default;
      }

      if (filter instanceof SelectableFilter) {
        if (onlyShowUsedOptions) {
          filter.options = filter.options.filter((option) =>
            data.some(this.filterService.getFilterPredicate(option.filter))
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
