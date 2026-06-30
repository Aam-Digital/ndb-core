import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  resource,
} from "@angular/core";
import { FilterConfig } from "../../entity-list/EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FilterGeneratorService } from "../filter-generator/filter-generator.service";
import { TableStateUrlService } from "../../common-components/entities-table/table-state-url.service";
import { NgComponentOutlet } from "@angular/common";
import { FilterService } from "../filter.service";
import { DataFilter, Filter, SelectableFilter } from "../filters/filters";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltip } from "@angular/material/tooltip";
import { IconButtonComponent } from "../../common-components/icon-button/icon-button.component";

/**
 * This component can be used to display filters, for example above tables.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  imports: [
    NgComponentOutlet,
    FontAwesomeModule,
    MatButtonModule,
    MatTooltip,
    IconButtonComponent,
  ],
})
export class FilterComponent<T extends Entity = Entity> {
  private filterGenerator = inject(FilterGeneratorService);
  private filterService = inject(FilterService);
  private readonly tableStateUrl = inject(TableStateUrlService);

  /**
   * The filter configuration from the config
   */
  filterConfig = input<FilterConfig[]>([]);
  /**
   * The type of entities that will be filtered
   */
  entityType = input<EntityConstructor<T>>();
  /**
   * The list of entities. This is used to detect which options should be available
   */
  entities = input<T[]>([]);
  /**
   * If true, the filter state will be stored in the url and automatically applied on reload or navigation.
   * default `false`.
   */
  useUrlQueryParams = input(false);
  /**
   * If true, only filter options are shown, for which some entities pass the filter.
   * default `false`
   */
  onlyShowRelevantFilterOptions = input(false);
  /**
   * A string representation of the current filter state.
   * This can be used to display the active filters as a single string.
   */
  filterString = input("");
  /**
   * The filter query which is build by combining all selected filters.
   * This can be used as two-way-binding or through the `filterObjChange` output.
   */
  filterObj = input<DataFilter<T>>({});
  /**
   * An event emitter that notifies about updates of the filter.
   */
  filterObjChange = output<DataFilter<T>>();
  /**
   * An event emitter that notifies about updates to the filter string.
   */
  filterStringChange = output<string>();

  filterSelections = linkedSignal<Filter<T>[]>(
    () => this.generatedFilterSelections.value() ?? [],
  );

  hasActiveFilters = computed(() =>
    this.filterSelections().some((f) => f.selectedOptionValues?.length > 0),
  );

  readonly showClearButton = computed(
    () => this.hasActiveFilters() || !!this.filterString(),
  );

  private readonly generatedFilterSelections = resource({
    params: () => ({
      filterConfig: this.getEffectiveFilterConfig(),
      entityType: this.entityType(),
      entities: this.entities(),
      onlyShowRelevantFilterOptions: this.onlyShowRelevantFilterOptions(),
    }),
    loader: async ({ params }) => {
      if (!params.entityType) {
        return [];
      }

      return this.filterGenerator.generate(
        params.filterConfig,
        params.entityType,
        params.entities,
        params.onlyShowRelevantFilterOptions,
      );
    },
  });

  constructor() {
    effect(() => {
      const selectionsWithUrlParams = this.loadUrlParams(
        this.filterSelections(),
      );
      this.applyFilterSelections(selectionsWithUrlParams);
    });

    effect((onCleanup) => {
      const subscriptions = this.filterSelections().map((filter) =>
        filter.selectedOptionChange.subscribe((event) =>
          this.filterOptionSelected(filter, event),
        ),
      );
      onCleanup(() =>
        subscriptions.forEach((subscription) => subscription.unsubscribe()),
      );
    });
  }

  filterOptionSelected(filter: Filter<T>, selectedOptions: string[]) {
    const updatedSelections = this.updateSelectionsByFilterName(
      filter.name,
      selectedOptions,
    );
    this.applyFilterSelections(updatedSelections);
    if (this.useUrlQueryParams()) {
      this.tableStateUrl.updateFilterParam(
        filter.name,
        selectedOptions.join(","),
        false,
      );
    }
  }

  private applyFilterSelections(
    selections: Filter<T>[] = this.filterSelections(),
  ) {
    const previousFilter: string = JSON.stringify(this.filterObj() ?? {});

    const newFilter: DataFilter<T> =
      this.filterService.combineFilters<T>(selections);

    if (previousFilter === JSON.stringify(newFilter)) {
      return;
    }

    this.filterObjChange.emit(newFilter);
  }

  /**
   * Returns the filter config extended with any URL params that refer to valid entity
   * schema fields but are not already covered by the configured filterConfig.
   * This ensures that navigation links (e.g. from EntityCountDashboard) pre-apply
   * a filter even when the target list view has not explicitly configured that field
   * as a filter UI element.
   */
  private getEffectiveFilterConfig(): FilterConfig[] {
    if (!this.useUrlQueryParams() || !this.entityType()) {
      return this.filterConfig() ?? [];
    }

    const params = this.tableStateUrl.getFilterParams();
    const configuredIds = new Set((this.filterConfig() ?? []).map((f) => f.id));
    const extraConfigs: FilterConfig[] = Object.keys(params)
      .filter((k) => !configuredIds.has(k) && this.entityType().schema.has(k))
      .map((k) => ({ id: k }));

    return [...(this.filterConfig() ?? []), ...extraConfigs];
  }

  /**
   * Parse a URL query-param string into the list of selected option values.
   *
   * Multiple selected values are joined by "," in the URL. Legacy option ids
   * (e.g. configurable-enum ids created before they were normalized) may
   * themselves contain a comma, which would otherwise be mistaken for the
   * multi-value separator (see issue #4104). To stay backwards-compatible
   * without changing the URL format, the raw value is resolved against the
   * filter's known option keys instead of being split blindly.
   */
  private parseFilterValue(filter: Filter<T>, raw: string): string[] {
    const validKeys =
      filter instanceof SelectableFilter
        ? (filter.options?.map((option) => option.key) ?? [])
        : [];

    // filters without a known set of option keys (e.g. date range filters):
    // keep the legacy comma-split behaviour.
    if (validKeys.length === 0) {
      return raw.split(",").filter((value) => value !== "");
    }

    // a single option key may itself contain a comma, so a whole-string match
    // takes precedence over splitting.
    if (validKeys.includes(raw)) {
      return [raw];
    }

    // greedily reconstruct values: at each position prefer the longest run of
    // comma-separated tokens that matches a valid option key; tokens that match
    // no key are kept as-is so stale/unknown values from old URLs are preserved.
    const tokens = raw.split(",");
    const values: string[] = [];
    let i = 0;
    while (i < tokens.length) {
      let matchedLength = 0;
      for (let length = tokens.length - i; length >= 1; length--) {
        if (validKeys.includes(tokens.slice(i, i + length).join(","))) {
          matchedLength = length;
          break;
        }
      }
      const consumed = matchedLength || 1;
      values.push(tokens.slice(i, i + consumed).join(","));
      i += consumed;
    }
    return values.filter((value) => value !== "");
  }

  private loadUrlParams(filterSelections: Filter<T>[]): Filter<T>[] {
    if (!this.useUrlQueryParams()) {
      return filterSelections;
    }

    const params = this.tableStateUrl.getFilterParams();
    const hasUrlParams = Object.keys(params).length > 0;
    let hasChanges = false;

    const updatedSelections = filterSelections.map((filter) => {
      let nextValues: string[] | undefined;

      if (Object.hasOwn(params, filter.name)) {
        nextValues = this.parseFilterValue(filter, params[filter.name]);
      } else if (
        hasUrlParams &&
        (filter.selectedOptionValues?.length ?? 0) > 0
      ) {
        nextValues = [];
      }

      if (nextValues === undefined) {
        return filter;
      }

      if (
        JSON.stringify(filter.selectedOptionValues ?? []) !==
        JSON.stringify(nextValues)
      ) {
        hasChanges = true;
        const clone = Object.assign(
          Object.create(Object.getPrototypeOf(filter)),
          filter,
          { selectedOptionValues: nextValues },
        );
        return clone;
      }

      return filter;
    });

    if (hasChanges) {
      this.filterSelections.set(updatedSelections);
      return updatedSelections;
    }

    return filterSelections;
  }

  clearAllFilters() {
    const updatedSelections = this.filterSelections().map((filter) =>
      Object.assign(Object.create(Object.getPrototypeOf(filter)), filter, {
        selectedOptionValues: [],
      }),
    );

    this.filterSelections.set(updatedSelections);

    updatedSelections.forEach((filter) => {
      filter.selectedOptionChange.emit(filter.selectedOptionValues ?? []);
    });

    this.filterObjChange.emit({});
    this.filterStringChange.emit("");

    if (this.useUrlQueryParams()) {
      const filterKeys = this.filterSelections().map((f) => f.name);
      this.tableStateUrl.clearFilterParams(filterKeys, false);
    }
  }

  private updateSelectionsByFilterName(
    filterName: string,
    selectedOptions: string[],
  ): Filter<T>[] {
    const updatedSelections = this.filterSelections().map((currentFilter) =>
      currentFilter.name === filterName
        ? Object.assign(
            Object.create(Object.getPrototypeOf(currentFilter)),
            currentFilter,
            { selectedOptionValues: selectedOptions },
          )
        : currentFilter,
    );

    this.filterSelections.set(updatedSelections);
    return updatedSelections;
  }
}
