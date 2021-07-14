import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { ActivatedRoute, Router } from "@angular/router";
import {
  ColumnGroupsConfig,
  EntityListConfig,
  FilterConfig,
  GroupConfig,
} from "./EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { OperationType } from "../../permissions/entity-permissions.service";
import { FormFieldConfig } from "../entity-form/entity-form/FormConfig";
import { EntitySubrecordComponent } from "../entity-subrecord/entity-subrecord/entity-subrecord.component";
import { FilterGeneratorService } from "./filter-generator.service";
import { FilterComponentSettings } from "./filter-component.settings";
import { entityFilterPredicate } from "./filter-predicate";

/**
 * This component allows to create a full blown table with pagination, filtering, searching and grouping.
 * The filter and grouping settings are written into the URL params to allow going back to the previous view.
 * The pagination settings are stored for each user.
 * The columns can be any kind of component.
 * The column components will be provided with the Entity object, the id for this column, as well as its static config.
 */
@Component({
  selector: "app-entity-list",
  templateUrl: "./entity-list.component.html",
  styleUrls: ["./entity-list.component.scss"],
})
export class EntityListComponent<T extends Entity>
  implements OnChanges, OnInit, AfterViewInit
{
  @Input() allEntities: T[] = [];
  filteredEntities: T[] = [];
  @Input() listConfig: EntityListConfig;
  @Input() entityConstructor: EntityConstructor<T>;
  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();

  @ViewChild(EntitySubrecordComponent) entityTable: EntitySubrecordComponent<T>;

  listName = "";
  columns: (FormFieldConfig | string)[] = [];
  columnGroups: GroupConfig[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  filtersConfig: FilterConfig[] = [];

  operationType = OperationType;

  columnsToDisplay: string[] = [];
  selectedColumnGroup: string = "";

  filterSelections: FilterComponentSettings<T>[] = [];
  filterString = "";

  constructor(
    private media: MediaObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private filterGeneratorService: FilterGeneratorService
  ) {}

  ngOnInit() {
    this.media.asObservable().subscribe((change: MediaChange[]) => {
      switch (change[0].mqAlias) {
        case "xs":
        case "sm": {
          this.displayColumnGroup(this.mobileColumnGroup);
          break;
        }
        case "md": {
          this.displayColumnGroup(this.defaultColumnGroup);
          break;
        }
      }
    });
  }

  ngAfterViewInit() {
    this.entityTable.recordsDataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("listConfig")) {
      this.listName = this.listConfig.title;
      this.addColumnsFromColumnGroups();
      this.initColumnGroups(this.listConfig.columnGroups);
      this.filtersConfig = this.listConfig.filters || [];
      this.displayColumnGroup(this.defaultColumnGroup);
    }
    if (changes.hasOwnProperty("allEntities")) {
      this.filteredEntities = this.allEntities;
      this.initFilterSelections();
    }
    this.loadUrlParams();
  }

  private addColumnsFromColumnGroups() {
    this.columns = this.listConfig.columns || [];
    this.listConfig.columnGroups?.groups?.forEach((group) =>
      group.columns
        .filter(
          (columnId) =>
            !this.columns.some((column) =>
              // Check if the column is already defined as object or string
              typeof column === "string"
                ? column === columnId
                : column.id === columnId
            )
        )
        .forEach((column) => this.columns.push(column))
    );
  }

  private initColumnGroups(columnGroup?: ColumnGroupsConfig) {
    if (columnGroup && columnGroup.groups.length > 0) {
      this.columnGroups = columnGroup.groups;
      this.defaultColumnGroup =
        columnGroup.default || columnGroup.groups[0].name;
      this.mobileColumnGroup = columnGroup.mobile || columnGroup.groups[0].name;
    } else {
      this.columnGroups = [
        {
          name: "default",
          columns: this.columns.map((c) => (typeof c === "string" ? c : c.id)),
        },
      ];
      this.defaultColumnGroup = "default";
      this.mobileColumnGroup = "default";
    }
  }

  private loadUrlParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params["view"]) {
        this.displayColumnGroup(params["view"]);
      }
      this.filterSelections.forEach((f) => {
        if (params.hasOwnProperty(f.filterSettings.name)) {
          f.selectedOption = params[f.filterSettings.name];
        }
      });
      this.applyFilterSelections();
      if (params["search"]) {
        this.applyFilter(params["search"]);
      }
    });
  }

  columnGroupClick(columnGroupName: string) {
    this.displayColumnGroup(columnGroupName);
    this.updateUrl("view", columnGroupName);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.entityTable.recordsDataSource.filter = filterValue;
  }

  filterOptionSelected(
    filter: FilterComponentSettings<T>,
    selectedOption: string
  ) {
    filter.selectedOption = selectedOption;
    this.applyFilterSelections();
    this.updateUrl(filter.filterSettings.name, selectedOption);
  }

  private applyFilterSelections() {
    let filteredData = this.allEntities;

    this.filterSelections.forEach((f) => {
      filteredData = filteredData.filter(
        f.filterSettings.getFilterFunction(f.selectedOption)
      );
    });

    this.filteredEntities = filteredData;
  }

  private updateUrl(key: string, value: string) {
    const params = {};
    params[key] = value;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      queryParamsHandling: "merge",
    });
  }

  private async initFilterSelections(): Promise<void> {
    this.filterSelections = await this.filterGeneratorService.generate(
      this.filtersConfig,
      this.entityConstructor,
      this.allEntities
    );
  }

  private displayColumnGroup(columnGroupName: string) {
    const selectedColumns = this.columnGroups.find(
      (c) => c.name === columnGroupName
    )?.columns;
    if (selectedColumns) {
      this.columnsToDisplay = selectedColumns;
      this.selectedColumnGroup = columnGroupName;
    }
  }

  getNewRecordFactory(): () => T {
    return () => new this.entityConstructor();
  }
}
