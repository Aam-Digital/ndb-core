import { Injectable } from "@angular/core";
import {
  DateFilter,
  SelectableFilter,
  BooleanFilter,
  ConfigurableEnumFilter,
  EntityFilter,
  Filter,
} from "../../filter/filter-selection/filter-selection";
import {
  BooleanFilterConfig,
  ConfigurableEnumFilterConfig,
  FilterConfig,
  PrebuiltFilterConfig,
} from "./EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { LoggingService } from "../../logging/logging.service";
import { FilterComponentSettings } from "./filter-component.settings";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { FilterService } from "../../filter/filter.service";
import { ConfigurableEnumService } from "../../configurable-enum/configurable-enum.service";

@Injectable({
  providedIn: "root",
})
export class FilterGeneratorService {
  constructor(
    private enumService: ConfigurableEnumService,
    private loggingService: LoggingService,
    private entities: EntityRegistry,
    private entityMapperService: EntityMapperService,
    private filterService: FilterService
  ) {}

  /**
   *
   * @param filtersConfig
   * @param entityConstructor
   * @param data
   * @param onlyShowUsedOptions (Optional) whether to remove those filter options for selection that are not present in the data
   */
  async generate<T extends Entity>(
    filtersConfig: FilterConfig[],
    entityConstructor: EntityConstructor<T>,
    data: T[],
    onlyShowUsedOptions = false
  ): Promise<FilterComponentSettings<T>[]> {
    const filterComponentSettings: FilterComponentSettings<T>[] = [];
    for (const filter of filtersConfig) {
      const schema = entityConstructor.schema.get(filter.id) || {};

      function addFilterComponentSettings(filterSettings: Filter<T>) {
        const fcs: FilterComponentSettings<T> = {
          filterSettings: filterSettings,
          filterConfig: filter,
        };
        filterComponentSettings.push(fcs);
      }

      function addSelectableFilterComponentSettings(
        filterSettings: SelectableFilter<T>
      ) {
        const fcs: FilterComponentSettings<T> = {
          filterSettings,
          filterConfig: filter,
        };
        if (onlyShowUsedOptions) {
          filterSettings.options = filterSettings.options.filter((option) =>
            data.some(this.filterService.getFilterPredicate(option.filter))
          );
        }
        // Filters should only be added, if they have more than one (the default) option
        if (filterSettings.options?.length > 1) {
          fcs.selectedOption = filterSettings.hasOwnProperty("default")
            ? filter.default
            : filterSettings.options[0].key;
          filterComponentSettings.push(fcs);
        }
      }

      switch (schema.dataType || filter.type) {
        case "configurable-enum":
          addSelectableFilterComponentSettings(
            new ConfigurableEnumFilter(
              filter.id,
              filter.label || schema.label,
              this.enumService.getEnumValues(filter.id)
            )
          );
          break;
        case "boolean":
          addSelectableFilterComponentSettings(
            new BooleanFilter(
              filter.id,
              filter.label || schema.label,
              filter as BooleanFilterConfig
            )
          );
          break;
        case "prebuilt":
          addSelectableFilterComponentSettings(
            new SelectableFilter(
              filter.id,
              (filter as PrebuiltFilterConfig<T>).options,
              filter.label
            )
          );
          break;
        default:
          if (filter.id === "date") {
            addFilterComponentSettings(
              new DateFilter(filter.id, filter.label || schema.label)
            );
          } else if (
            this.entities.has(filter.type) ||
            this.entities.has(schema.additional)
          ) {
            const entityType = filter.type || schema.additional;
            const filterEntities = await this.entityMapperService.loadType(
              entityType
            );
            addSelectableFilterComponentSettings(
              new EntityFilter(filter.id, entityType, filterEntities)
            );
          } else {
            const options = [...new Set(data.map((c) => c[filter.id]))];
            const fSO = SelectableFilter.generateOptions(options, filter.id);
            addSelectableFilterComponentSettings(
              new SelectableFilter<T>(
                filter.id,
                fSO,
                filter.label || schema.label
              )
            );
          }
      }
    }
    return filterComponentSettings;
  }
}
