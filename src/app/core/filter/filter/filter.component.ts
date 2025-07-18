import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";
import { FilterConfig } from "../../entity-list/EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FilterGeneratorService } from "../filter-generator/filter-generator.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgComponentOutlet } from "@angular/common";
import { getUrlWithoutParams } from "../../../utils/utils";
import { FilterService } from "../filter.service";
import { DataFilter, Filter } from "../filters/filters";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltip } from "@angular/material/tooltip";

/**
 * This component can be used to display filters, for example above tables.
 */
@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  imports: [NgComponentOutlet, FontAwesomeModule, MatButtonModule, MatTooltip],
})
export class FilterComponent<T extends Entity = Entity> implements OnChanges {
  private filterGenerator = inject(FilterGeneratorService);
  private filterService = inject(FilterService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * The filter configuration from the config
   */
  @Input() filterConfig: FilterConfig[];
  /**
   * The type of entities that will be filtered
   */
  @Input() entityType: EntityConstructor<T>;
  /**
   * The list of entities. This is used to detect which options should be available
   */
  @Input() entities: T[];
  /**
   * If true, the filter state will be stored in the url and automatically applied on reload or navigation.
   * default `false`.
   */
  @Input() useUrlQueryParams = false;
  /**
   * If true, only filter options are shown, for which some entities pass the filter.
   * default `false`
   */
  @Input() onlyShowRelevantFilterOptions = false;
  /**
   * A string representation of the current filter state.
   * This can be used to display the active filters as a single string.
   */
  @Input() filterString: string;
  /**
   * The filter query which is build by combining all selected filters.
   * This can be used as two-way-binding or through the `filterObjChange` output.
   */
  @Input() filterObj: DataFilter<T>;
  /**
   * An event emitter that notifies about updates of the filter.
   */
  @Output() filterObjChange = new EventEmitter<DataFilter<T>>();
  /**
   * An event emitter that notifies about updates to the filter string.
   */
  @Output() filterStringChange = new EventEmitter<string>();

  filterSelections: Filter<T>[] = [];
  urlPath: string;
  hasActiveFilters: boolean = false;

  constructor() {
    this.urlPath = getUrlWithoutParams(this.router);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.filterConfig || changes.entityType || changes.entities) {
      this.filterSelections = await this.filterGenerator.generate(
        this.filterConfig,
        this.entityType,
        this.entities,
        this.onlyShowRelevantFilterOptions,
      );
      for (const filter of this.filterSelections) {
        filter.selectedOptionChange.subscribe((event) =>
          this.filterOptionSelected(filter, event),
        );
      }

      this.loadUrlParams();
      this.applyFilterSelections();
    }
  }

  filterOptionSelected(filter: Filter<T>, selectedOptions: string[]) {
    filter.selectedOptionValues = selectedOptions;
    // It is only safe to update `hasActiveFilters` after the view is rendered.
    // Using setTimeout ensures the change happens after Angular’s check cycle.
    setTimeout(() => {
      this.hasActiveFilters = this.filterSelections.some(
        (f) => f.selectedOptionValues?.length > 0,
      );
    });

    this.applyFilterSelections();
    if (this.useUrlQueryParams) {
      this.updateUrl(filter.name, selectedOptions.toString());
    }
  }

  private applyFilterSelections() {
    const previousFilter: string = JSON.stringify(this.filterObj);

    const newFilter: DataFilter<T> = this.filterService.combineFilters<T>(
      this.filterSelections,
    );

    if (previousFilter === JSON.stringify(newFilter)) {
      return;
    }

    this.filterObj = newFilter;
    this.filterObjChange.emit(this.filterObj);
  }

  private updateUrl(key: string, value: string) {
    const MAX_URL_LENGTH = 2000;
    let queryParams = { ...this.route.snapshot.queryParams, [key]: value };

    let potentialUrl = this.router
      .createUrlTree([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: "merge",
      })
      .toString();
    if (potentialUrl.length > MAX_URL_LENGTH) {
      let longestKey: string | null = null;
      let maxLength = 0;
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key].length > maxLength) {
          longestKey = key;
          maxLength = queryParams[key].length;
        }
      });

      if (longestKey) {
        queryParams[longestKey] = undefined;
      } else {
        queryParams[key] = undefined;
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: "merge",
    });
  }

  private loadUrlParams() {
    if (!this.useUrlQueryParams) {
      return;
    }
    const params = this.route.snapshot.queryParams;
    this.filterSelections.forEach((f) => {
      if (params.hasOwnProperty(f.name)) {
        this.hasActiveFilters = true;
        f.selectedOptionValues = params[f.name]
          .split(",")
          .filter((value) => value !== "");
      }
    });
  }

  clearAllFilters() {
    this.filterSelections.forEach((filter) => {
      filter.selectedOptionValues = [];
      filter.selectedOptionChange.emit(filter.selectedOptionValues);
    });

    this.hasActiveFilters = false;

    this.filterObjChange.emit({});
    this.filterStringChange.emit("");

    let newParams = { ...this.route.snapshot.queryParams };
    this.filterSelections.forEach((filter) => {
      newParams[filter.name] = undefined;
    });
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: "merge",
    });
  }
}
