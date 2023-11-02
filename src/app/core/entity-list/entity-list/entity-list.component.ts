import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  ColumnGroupsConfig,
  EntityListConfig,
  FilterConfig,
  GroupConfig,
} from "../EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { EntitySubrecordComponent } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { entityFilterPredicate } from "../../filter/filter-generator/filter-predicate";
import { AnalyticsService } from "../../analytics/analytics.service";
import { RouteTarget } from "../../../app.routing";
import { RouteData } from "../../config/dynamic-routing/view-config.interface";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DataFilter } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterOverlayComponent } from "../../filter/filter-overlay/filter-overlay.component";
import { MatDialog } from "@angular/material/dialog";
import { NgForOf, NgIf, NgStyle, NgTemplateOutlet } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2OnModule } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { FilterComponent } from "../../filter/filter/filter.component";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { ExportDataDirective } from "../../export/export-data-directive/export-data.directive";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { DuplicateRecordDirective } from "app/core/duplicate-records/duplicates-data-directive/duplicate-records.directive";

/**
 * This component allows to create a full-blown table with pagination, filtering, searching and grouping.
 * The filter and grouping settings are written into the URL params to allow going back to the previous view.
 * The pagination settings are stored for each user.
 * The columns can be any kind of component.
 * The column components will be provided with the Entity object, the id for this column, as well as its static config.
 *
 * The component can be either used inside a template, or directly in a route through the config object.
 */
@RouteTarget("EntityList")
@Component({
  selector: "app-entity-list",
  templateUrl: "./entity-list.component.html",
  styleUrls: ["./entity-list.component.scss"],
  imports: [
    NgIf,
    NgStyle,
    MatButtonModule,
    Angulartics2OnModule,
    FontAwesomeModule,
    MatMenuModule,
    NgTemplateOutlet,
    MatTabsModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    EntitySubrecordComponent,
    FormsModule,
    FilterComponent,
    TabStateModule,
    ViewTitleComponent,
    ExportDataDirective,
    DisableEntityOperationDirective,
    RouterLink,
   DuplicateRecordDirective,
  ],
  standalone: true,
})
@UntilDestroy()
export class EntityListComponent<T extends Entity>
  implements OnChanges, AfterViewInit
{
  @Input() allEntities: T[];
  @Input() listConfig: EntityListConfig;
  @Input() entityConstructor: EntityConstructor<T>;

  @Input() clickMode: "navigate" | "popup" | "none" = "navigate";

  /** initial / default state whether to include archived records in the list */
  @Input() showInactive: boolean;

  @Input() isLoading: boolean;

  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();
  @Input() selectedRows : T[] = [];

  @ViewChild(EntitySubrecordComponent) entityTable: EntitySubrecordComponent<T>;

  isDesktop: boolean;

  listName = "";
  columns: (FormFieldConfig | string)[] = [];
  columnGroups: GroupConfig[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  filtersConfig: FilterConfig[] = [];

  columnsToDisplay: string[] = [];

  filterObj: DataFilter<T>;
  filterString = "";

  get selectedColumnGroupIndex(): number {
    return this.selectedColumnGroupIndex_;
  }

  set selectedColumnGroupIndex(newValue: number) {
    this.selectedColumnGroupIndex_ = newValue;
    this.columnsToDisplay = this.columnGroups[newValue].columns;
  }

  selectedColumnGroupIndex_: number = 0;

  /**
   * defines the bottom margin of the topmost row in the
   * desktop version. This has to be bigger when there are
   * several column groups since there are
   * tabs with zero top-padding in this case
   */
  get offsetFilterStyle(): object {
    const bottomMargin = this.columnGroups.length > 1 ? 29 : 14;
    return {
      "margin-bottom": `${bottomMargin}px`,
    };
  }

  constructor(
    private screenWidthObserver: ScreenWidthObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private analyticsService: AnalyticsService,
    private entityMapperService: EntityMapperService,
    private entities: EntityRegistry,
    private dialog: MatDialog,
  ) {
    if (this.activatedRoute.component === EntityListComponent) {
      // the component is used for a route and not inside a template
      this.activatedRoute.data.subscribe((data: RouteData<EntityListConfig>) =>
        this.buildComponentFromConfig(data.config),
      );
    }

    this.screenWidthObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => {
        if (!isDesktop) {
          this.displayColumnGroupByName(this.mobileColumnGroup);
        } else if (
          this.selectedColumnGroupIndex ===
          this.getSelectedColumnIndexByName(this.mobileColumnGroup)
        ) {
          this.displayColumnGroupByName(this.defaultColumnGroup);
        }

        this.isDesktop = isDesktop;
      });
  }

  private async buildComponentFromConfig(newConfig: EntityListConfig) {
    this.listConfig = newConfig;

    if (this.listConfig?.entity) {
      this.entityConstructor = this.entities.get(
        this.listConfig.entity,
      ) as EntityConstructor<T>;
    }

    if (!this.allEntities) {
      // if no entities are passed as input, by default load all entities of the type
      await this.loadEntities();
    }

    this.listName =
      this.listConfig.title ||
      this.listName ||
      this.entityConstructor?.labelPlural;

    this.addColumnsFromColumnGroups();
    this.initColumnGroups(this.listConfig.columnGroups);
    this.filtersConfig = this.listConfig.filters ?? this.filtersConfig ?? [];

    this.displayColumnGroupByName(
      this.screenWidthObserver.isDesktop()
        ? this.defaultColumnGroup
        : this.mobileColumnGroup,
    );
  }

  private async loadEntities() {
    this.isLoading = true;

    this.allEntities = await this.entityMapperService.loadType(
      this.entityConstructor,
    );

    this.isLoading = false;
  }

  ngAfterViewInit() {
    this.entityTable.recordsDataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.hasOwnProperty("listConfig")) {
      await this.buildComponentFromConfig(this.listConfig);
    }
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
                : column.id === columnId,
            ),
        )
        .forEach((column) => this.columns.push(column)),
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

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.entityTable.recordsDataSource.filter = filterValue;

    this.analyticsService.eventTrack("list_filter_freetext", {
      category: this.entityConstructor?.ENTITY_TYPE,
    });
  }

  private displayColumnGroupByName(columnGroupName: string) {
    const selectedColumnIndex =
      this.getSelectedColumnIndexByName(columnGroupName);
    if (selectedColumnIndex !== -1) {
      this.selectedColumnGroupIndex = selectedColumnIndex;
    }
  }

  private getSelectedColumnIndexByName(columnGroupName: string) {
    return this.columnGroups.findIndex((c) => c.name === columnGroupName);
  }

  /**
   * Calling this function will display the filters in a popup
   */
  openFilterOverlay() {
    this.dialog.open(FilterOverlayComponent, {
      data: {
        filterConfig: this.filtersConfig,
        entityType: this.entityConstructor,
        entities: this.allEntities,
        useUrlQueryParams: true,
        filterObjChange: (filter: DataFilter<T>) => (this.filterObj = filter),
      },
    });
  }

  addNew() {
    if (this.clickMode === "navigate") {
      this.router.navigate(["new"], { relativeTo: this.activatedRoute });
    }
    this.addNewClick.emit();
  }

  setSelectedRows(data: any) {
    if (data.event.checked) {
      this.selectedRows.push(data.row); 
    } else {
      const index = this.selectedRows.indexOf(data.row);
      if (index > -1) {
        this.selectedRows.splice(index, 1);
      }
    }
  }
  
  clearSelectedRows() {
    this.selectedRows = []; 
  }
}
