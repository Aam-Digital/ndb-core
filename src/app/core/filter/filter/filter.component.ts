import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FilterConfig } from "../../entity-list/EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FilterGeneratorService } from "../filter-generator/filter-generator.service";
import { ActivatedRoute, Router } from "@angular/router";
import { NgComponentOutlet } from "@angular/common";
import { getUrlWithoutParams } from "../../../utils/utils";
import { FilterService } from "../filter.service";
import { DataFilter, Filter } from "../filters/filters";

/**
 * This component can be used to display filters, for example above tables.
 */
@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  imports: [NgComponentOutlet],
  standalone: true,
})
export class FilterComponent<T extends Entity = Entity> implements OnChanges {
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
   * The filter query which is build by combining all selected filters.
   * This can be used as two-way-binding or through the `filterObjChange` output.
   */
  @Input() filterObj: DataFilter<T>;
  /**
   * An event emitter that notifies about updates of the filter.
   */
  @Output() filterObjChange = new EventEmitter<DataFilter<T>>();

  filterSelections: Filter<T>[] = [];
  urlPath: string;

  constructor(
    private filterGenerator: FilterGeneratorService,
    private filterService: FilterService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
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
    const params = {};
    params[key] = value;

    let potentialUrl = this.router
      .createUrlTree([], {
        relativeTo: this.route,
        queryParams: { ...this.route.snapshot.queryParams, ...params },
        queryParamsHandling: "merge",
      })
      .toString();

    if (potentialUrl.length <= 2000) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: "merge",
      });
    } else {
      let longestKey: string | null = null;
      let maxLength = 0;

      Object.keys(params).forEach((key) => {
        if (params[key].length > maxLength) {
          longestKey = key;
          maxLength = params[key].length;
        }
      });

      if (longestKey) {
        delete params[longestKey];
        potentialUrl = this.router
          .createUrlTree([], {
            relativeTo: this.route,
            queryParams: { ...this.route.snapshot.queryParams, ...params },
            queryParamsHandling: "merge",
          })
          .toString();

        if (potentialUrl.length <= 2000) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: params,
            queryParamsHandling: "merge",
          });
        }
      }
    }
  }
  getCurrentUrl(): string {
    const params = this.filterSelections.reduce((acc, filter) => {
      if (filter.selectedOptionValues.length > 0) {
        acc[filter.name] = filter.selectedOptionValues.join(",");
      }
      return acc;
    }, {});

    return this.router
      .createUrlTree([], {
        relativeTo: this.route,
        queryParams: { ...this.route.snapshot.queryParams, ...params },
        queryParamsHandling: "merge",
      })
      .toString();
  }

  private loadUrlParams() {
    if (!this.useUrlQueryParams) {
      return;
    }
    const params = this.route.snapshot.queryParams;
    this.filterSelections.forEach((f) => {
      if (params.hasOwnProperty(f.name)) {
        f.selectedOptionValues = params[f.name]
          .split(",")
          .filter((value) => value !== "");
      }
    });
  }
}
