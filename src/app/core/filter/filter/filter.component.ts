import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FilterConfig } from "../../entity-components/entity-list/EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FilterComponentSettings } from "../../entity-components/entity-list/filter-component.settings";
import { DataFilter } from "../../entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterGeneratorService } from "../../entity-components/entity-list/filter-generator.service";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { getUrlWithoutParams } from "../../../utils/utils";
import { ListFilterComponent } from "../list-filter/list-filter.component";
import { NgForOf } from "@angular/common";
import { Angulartics2Module } from "angulartics2";

/**
 * This component can be used to display filters, for example above tables.
 */
@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  imports: [ListFilterComponent, NgForOf, Angulartics2Module],
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
   * A event emitter that notifies about updates of the filter.
   */
  @Output() filterObjChange = new EventEmitter<DataFilter<T>>();

  filterSelections: FilterComponentSettings<T>[] = [];
  urlPath = getUrlWithoutParams(this.router);

  constructor(
    private filterGenerator: FilterGeneratorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.filterConfig || changes.entityType || changes.entities) {
      this.filterSelections = await this.filterGenerator.generate(
        this.filterConfig,
        this.entityType,
        this.entities,
        this.onlyShowRelevantFilterOptions
      );
      this.loadUrlParams();
      this.applyFilterSelections();
    }
  }

  filterOptionSelected(
    filter: FilterComponentSettings<T>,
    selectedOption: string
  ) {
    filter.selectedOption = selectedOption;
    this.applyFilterSelections();
    if (this.useUrlQueryParams) {
      this.updateUrl(filter.filterSettings.name, selectedOption);
    }
  }

  private applyFilterSelections() {
    this.filterObj = this.filterSelections.reduce(
      (obj, filter) =>
        Object.assign(
          obj,
          filter.filterSettings.getFilter(filter.selectedOption)
        ),
      {} as DataFilter<T>
    );
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

  private loadUrlParams(parameters?: Params) {
    if (!this.useUrlQueryParams) {
      return;
    }
    const params = parameters || this.route.snapshot.queryParams;
    this.filterSelections.forEach((f) => {
      if (params.hasOwnProperty(f.filterSettings.name)) {
        f.selectedOption = params[f.filterSettings.name];
      }
    });
  }
}
