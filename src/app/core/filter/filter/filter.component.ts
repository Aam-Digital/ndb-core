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
import { DataFilter } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterGeneratorService } from "../filter-generator/filter-generator.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ListFilterComponent } from "../list-filter/list-filter.component";
import { NgForOf, NgIf } from "@angular/common";
import { Angulartics2Module } from "angulartics2";
import { DateRangeFilterComponent } from "../../basic-datatypes/date/date-range-filter/date-range-filter.component";
import { Filter } from "../filters/filters";
import { getUrlWithoutParams } from "../../../utils/utils";
import { FilterService } from "../filter.service";

/**
 * This component can be used to display filters, for example above tables.
 */
@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  imports: [
    ListFilterComponent,
    NgForOf,
    Angulartics2Module,
    DateRangeFilterComponent,
    NgIf,
  ],
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
  urlPath = getUrlWithoutParams(this.router);

  constructor(
    private filterGenerator: FilterGeneratorService,
    private filterService: FilterService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.filterConfig || changes.entityType || changes.entities) {
      this.filterSelections = await this.filterGenerator.generate(
        this.filterConfig,
        this.entityType,
        this.entities,
        this.onlyShowRelevantFilterOptions,
      );
      this.loadUrlParams();
      this.applyFilterSelections();
    }
  }

  filterOptionSelected(filter: Filter<T>, selectedOptions: string[]) {
    filter.selectedOptionsKeys = selectedOptions;
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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
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
        let values: string[] = params[f.name].split(",");
        f.selectedOptionsKeys = values.filter((value) => value !== "");
      } else {
        f.selectedOptionsKeys = [];
      }
    });
  }
}
