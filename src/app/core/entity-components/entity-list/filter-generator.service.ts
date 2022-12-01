import { Injectable } from "@angular/core";
import {
  FilterSelection,
  FilterSelectionOption,
} from "../../filter/filter-selection/filter-selection";
import {
  BooleanFilterConfig,
  FilterConfig,
  PrebuiltFilterConfig,
  DateRangeFilterConfig,
  weekDayMap,
} from "./EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { FilterComponentSettings } from "./filter-component.settings";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { FilterService } from "../../filter/filter.service";
import moment from "moment";

@Injectable({
  providedIn: "root",
})
export class FilterGeneratorService {
  constructor(
    private configService: ConfigService,
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
    onlyShowUsedOptions: boolean = false
  ): Promise<FilterComponentSettings<T>[]> {
    const filterSettings: FilterComponentSettings<T>[] = [];
    for (const filter of filtersConfig) {
      const schema = entityConstructor.schema.get(filter.id) || {};
      const fs: FilterComponentSettings<T> = {
        filterSettings: new FilterSelection(
          filter.id,
          [],
          filter.label || schema.label
        ),
      };
      try {
        fs.filterSettings.options = await this.getFilterOptions(
          filter,
          schema,
          data
        );
      } catch (e) {
        this.loggingService.warn(`Could not init filter: ${filter.id}: ${e}`);
      }

      if (onlyShowUsedOptions) {
        fs.filterSettings.options = fs.filterSettings.options.filter((option) =>
          data.some(this.filterService.getFilterPredicate(option.filter))
        );
      }

      // Filters should only be added, if they have more than one (the default) option
      if (fs.filterSettings.options?.length > 1) {
        fs.selectedOption = filter.hasOwnProperty("default")
          ? filter.default
          : fs.filterSettings.options[0].key;
        filterSettings.push(fs);
      }
    }
    return filterSettings;
  }

  private async getFilterOptions<T extends Entity>(
    config: FilterConfig,
    schema: EntitySchemaField,
    data: T[]
  ): Promise<FilterSelectionOption<T>[]> {
    if (config.type === "prebuilt") {
      return (config as PrebuiltFilterConfig<T>).options;
    } else if (schema.dataType === "date") {
      return this.createDateRangeFilterOptions(config as DateRangeFilterConfig);
    } else if (schema.dataType === "boolean" || config.type === "boolean") {
      return this.createBooleanFilterOptions(config as BooleanFilterConfig);
    } else if (schema.dataType === "configurable-enum") {
      return this.createConfigurableEnumFilterOptions(
        config.id,
        schema.innerDataType
      );
    } else if (
      this.entities.has(config.type) ||
      this.entities.has(schema.additional)
    ) {
      return this.createEntityFilterOption(
        config.id,
        config.type || schema.additional
      );
    } else {
      const options = [...new Set(data.map((c) => c[config.id]))];
      return FilterSelection.generateOptions(options, config.id);
    }
  }

  private createDateRangeFilterOptions<T extends Entity>(
    filterConfig: DateRangeFilterConfig
  ): FilterSelectionOption<T>[] {
    if (filterConfig.startingDayOfWeek) {
      const configStartingDayOfWeek =
        weekDayMap[filterConfig.startingDayOfWeek.toLowerCase()];
      moment.updateLocale(moment.locale(), {
        week: {
          dow: configStartingDayOfWeek,
        },
      });
    }
    const dateFS = [];
    for (const option of filterConfig.options) {
      let relevantDate = moment().startOf(option.offsets[0].unit);
      option.offsets.forEach((offset) =>
        relevantDate.subtract(offset.amount, offset.unit)
      );
      dateFS.push({
        key: "option_" + (dateFS.length + 1),
        label: option.label,
        filterFun: (c: Entity) => {
          return moment(c[filterConfig.id]).isSameOrAfter(relevantDate, "day");
        },
      });
    }
    dateFS.push({ key: "", label: $localize`All`, filterFun: () => true });
    return dateFS;
  }

  private createBooleanFilterOptions<T extends Entity>(
    filter: BooleanFilterConfig
  ): FilterSelectionOption<T>[] {
    return [
      { key: "all", label: filter.all, filter: {} },
      {
        key: "true",
        label: filter.true,
        filter: { [filter.id]: true },
      },
      {
        key: "false",
        label: filter.false,
        filter: { [filter.id]: false },
      },
    ];
  }

  private createConfigurableEnumFilterOptions<T extends Entity>(
    property: string,
    enumId: string
  ): FilterSelectionOption<T>[] {
    const options: FilterSelectionOption<T>[] = [
      {
        key: "all",
        label: $localize`:Filter label:All`,
        filter: {},
      },
    ];

    const enumValues = this.configService.getConfigurableEnumValues(enumId);
    const key = property + ".id";

    for (const enumValue of enumValues) {
      options.push({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: { [key]: enumValue.id },
      });
    }

    return options;
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
