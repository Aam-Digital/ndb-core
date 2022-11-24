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
import { FilterOverlayComponent } from "../filter-overlay/filter-overlay.component";
import { MatDialog } from "@angular/material/dialog";
import { getUrlWithoutParams } from "../../../utils/utils";

@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
})
export class FilterComponent<T extends Entity = Entity> implements OnChanges {
  @Input() filterConfig: FilterConfig[];
  @Input() entityType: EntityConstructor<T>;
  @Input() entities: T[];
  @Input() withUrl = false;
  @Input() onlyUsed = false;

  @Input() filterObj: DataFilter<T>;
  @Output() filterObjChange = new EventEmitter<DataFilter<T>>();

  filterSelections: FilterComponentSettings<T>[] = [];
  urlPath = getUrlWithoutParams(this.router);

  constructor(
    private filterGenerator: FilterGeneratorService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.filterConfig || changes.entityType || changes.entities) {
      this.filterSelections = await this.filterGenerator.generate(
        this.filterConfig,
        this.entityType,
        this.entities,
        this.onlyUsed
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
    if (this.withUrl) {
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
    if (!this.withUrl) {
      return;
    }
    const params = parameters || this.route.snapshot.queryParams;
    this.filterSelections.forEach((f) => {
      if (params.hasOwnProperty(f.filterSettings.name)) {
        f.selectedOption = params[f.filterSettings.name];
      }
    });
  }

  openFilterOverlay() {
    this.dialog.open(FilterOverlayComponent, {
      data: {
        filterSelections: this.filterSelections,
        filterChangeCallback: (
          filter: FilterComponentSettings<T>,
          option: string
        ) => {
          this.filterOptionSelected(filter, option);
        },
      },
    });
  }
}
