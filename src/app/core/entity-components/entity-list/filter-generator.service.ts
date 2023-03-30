import { Injectable } from "@angular/core";
import {
  DateFilter,
  SelectableFilter,
  FilterSelectionOption,
  BooleanFilter,
  ConfigurableEnumFilter,
} from "../../filter/filter-selection/filter-selection";
import {
  BooleanFilterConfig,
  ConfigurableEnumFilterConfig,
  FilterConfig,
  PrebuiltFilterConfig,
} from "./EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { LoggingService } from "../../logging/logging.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
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

      if (filter.id === "date") {
        let fcs: FilterComponentSettings<T> = {
          filterSettings: new DateFilter(
            filter.id,
            filter.label || schema.label
          ),
          filterConfig: filter,
        };
        filterComponentSettings.push(fcs);
      } else if (schema.dataType === "boolean" || filter.type === "boolean") {
        let fcs: FilterComponentSettings<T> = {
          filterSettings: new BooleanFilter(
            filter.id,
            filter.label || schema.label,
            filter as BooleanFilterConfig
          ),
          filterConfig: filter,
        };
        filterComponentSettings.push(fcs);
      } else if (
        schema.dataType === "configurable-enum" ||
        filter.type === "configurable-enum"
      ) {
        let fcs: FilterComponentSettings<T> = {
          filterSettings: new ConfigurableEnumFilter(
            filter.id,
            filter.label || schema.label,
            this.enumService.getEnumValues(filter.id),
            filter as ConfigurableEnumFilterConfig<T>
          ),
          filterConfig: filter,
        };
        filterComponentSettings.push(fcs);
      } else if (filter.type === "prebuilt") {
        let fcs: FilterComponentSettings<T> = {
          filterSettings: new SelectableFilter(
            filter.id,
            (filter as PrebuiltFilterConfig<T>).options,
            filter.label
          ),
          filterConfig: filter,
        };
        filterComponentSettings.push(fcs);
      } else {
        const filterSettings = new SelectableFilter<T>(
          filter.id,
          [],
          filter.label || schema.label
        );
        let fcs: FilterComponentSettings<T> = {
          filterSettings,
          filterConfig: filter,
        };
        try {
          filterSettings.options = await this.getFilterOptions(
            filter,
            schema,
            data
          );
        } catch (e) {
          this.loggingService.warn(`Could not init filter: ${filter.id}: ${e}`);
        }

        if (onlyShowUsedOptions) {
          filterSettings.options = filterSettings.options.filter((option) =>
            data.some(this.filterService.getFilterPredicate(option.filter))
          );
        }

        // Filters should only be added, if they have more than one (the default) option
        if (filterSettings.options?.length > 1) {
          fcs.selectedOption = filter.hasOwnProperty("default")
            ? filter.default
            : filterSettings.options[0].key;
          filterComponentSettings.push(fcs);
        }
      }
    }
    return filterComponentSettings;
  }

  private async getFilterOptions<T extends Entity>(
    config: FilterConfig,
    schema: EntitySchemaField,
    data: T[]
  ): Promise<FilterSelectionOption<T>[]> {
    if (
      this.entities.has(config.type) ||
      this.entities.has(schema.additional)
    ) {
      return this.createEntityFilterOption(
        config.id,
        config.type || schema.additional
      );
    } else {
      const options = [...new Set(data.map((c) => c[config.id]))];
      return SelectableFilter.generateOptions(options, config.id);
    }
  }

  private async createEntityFilterOption<T extends Entity>(
    property: string,
    entityType: string
  ): Promise<FilterSelectionOption<T>[]> {
    const filterEntities = await this.entityMapperService.loadType(entityType);
    filterEntities.sort((a, b) => a.toString().localeCompare(b.toString()));

    const options = [
      {
        key: "all",
        label: $localize`:Filter option:All`,
        filter: {},
      },
    ];
    options.push(
      ...filterEntities.map((filterEntity) => ({
        key: filterEntity.getId(),
        label: filterEntity.toString(),
        filter: {
          $or: [
            { [property]: filterEntity.getId() },
            { [property]: { $elemMatch: { $eq: filterEntity.getId() } } },
          ],
        },
      }))
    );
    return options;
  }
}
