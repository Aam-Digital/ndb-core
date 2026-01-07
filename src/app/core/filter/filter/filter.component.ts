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
import { Router } from "@angular/router";
import { TableStateUrlService } from "../../common-components/entities-table/table-state-url.service";
import { NgComponentOutlet } from "@angular/common";
import { getUrlWithoutParams } from "../../../utils/utils";
import { FilterService } from "../filter.service";
import { DataFilter, Filter } from "../filters/filters";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltip } from "@angular/material/tooltip";
import { IconButtonComponent } from "../../common-components/icon-button/icon-button.component";

/**
 * This component can be used to display filters, for example above tables.
 */
@Component({
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
export class FilterComponent<T extends Entity = Entity> implements OnChanges {
  private filterGenerator = inject(FilterGeneratorService);
  private filterService = inject(FilterService);
  private router = inject(Router);
  private readonly tableStateUrl = inject(TableStateUrlService);

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
      // Check if there are any active filters which applied by codebase(for example in Todo List)
      this.hasActiveFilters = this.filterSelections.some(
        (f) => f.selectedOptionValues?.length > 0,
      );

      this.loadUrlParams();
      this.applyFilterSelections();
    }
  }

  filterOptionSelected(filter: Filter<T>, selectedOptions: string[]) {
    filter.selectedOptionValues = selectedOptions;
    // It is only safe to update `hasActiveFilters` after the view is rendered.
    setTimeout(() => {
      this.hasActiveFilters = this.filterSelections.some(
        (f) => f.selectedOptionValues?.length > 0,
      );
    });

    this.applyFilterSelections();
    if (this.useUrlQueryParams) {
      this.tableStateUrl.updateFilterParam(
        filter.name,
        selectedOptions.toString(),
        false,
      );
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

  private loadUrlParams() {
    if (!this.useUrlQueryParams) {
      return;
    }
    const params = this.tableStateUrl.getFilterParams();
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

    if (this.useUrlQueryParams) {
      const filterKeys = this.filterSelections.map((f) => f.name);
      this.tableStateUrl.clearFilterParams(filterKeys, false);
    }
  }
}
