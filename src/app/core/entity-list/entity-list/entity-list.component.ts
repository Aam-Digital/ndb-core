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
import { DuplicateRecordService } from "../duplicate-records/duplicate-records.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Sort } from "@angular/material/sort";
import { ExportColumnConfig } from "../../export/data-transformation-service/export-column-config";
import { RouteTarget } from "../../../route-target";
import { EntityActionsService } from "app/core/entity/entity-actions/entity-actions.service";

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
  providers: [DuplicateRecordService],
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
    MatTooltipModule,
  ],
  standalone: true,
})
@UntilDestroy()
export class EntityListComponent<T extends Entity>
  implements EntityListConfig, OnChanges, AfterViewInit
{
  @Input() allEntities: T[];

  /** @deprecated this is often used when this has a wrapper component (e.g. ChildrenList), preferably use individual @Input properties */
  @Input() listConfig: EntityListConfig;

  @Input() entity: string;
  @Input() entityConstructor: EntityConstructor<T>;
  @Input() defaultSort: Sort;
  @Input() exportConfig: ExportColumnConfig[];

  @Input() clickMode: "navigate" | "popup" | "none" = "navigate";

  /** initial / default state whether to include archived records in the list */
  @Input() showInactive: boolean;

  @Input() isLoading: boolean;

  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();
  selectedRows: T[];

  @ViewChild(EntitySubrecordComponent) entityTable: EntitySubrecordComponent<T>;

  isDesktop: boolean;

  @Input() title = "";
  @Input() columns: (FormFieldConfig | string)[] = [];
  @Input() columnGroups: ColumnGroupsConfig;
  groups: GroupConfig[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  @Input() filters: FilterConfig[] = [];

  columnsToDisplay: string[] = [];

  filterObj: DataFilter<T>;
  filterString = "";
  filteredData = [];

  get selectedColumnGroupIndex(): number {
    return this.selectedColumnGroupIndex_;
  }

  set selectedColumnGroupIndex(newValue: number) {
    this.selectedColumnGroupIndex_ = newValue;
    this.columnsToDisplay = this.groups[newValue].columns;
  }

  selectedColumnGroupIndex_: number = 0;

  /**
   * defines the bottom margin of the topmost row in the
   * desktop version. This has to be bigger when there are
   * several column groups since there are
   * tabs with zero top-padding in this case
   */
  get offsetFilterStyle(): object {
    const bottomMargin = this.groups.length > 1 ? 29 : 14;
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
    private duplicateRecord: DuplicateRecordService,
    private entityActionsService: EntityActionsService,
  ) {
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("listConfig")) {
      Object.assign(this, this.listConfig);
    }
    return this.buildComponentFromConfig();
  }

  ngAfterViewInit() {
    this.entityTable.recordsDataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
  }

  private async buildComponentFromConfig() {
    if (this.entity) {
      this.entityConstructor = this.entities.get(
        this.entity,
      ) as EntityConstructor<T>;
    }

    if (!this.allEntities) {
      // if no entities are passed as input, by default load all entities of the type
      await this.loadEntities();
    }

    this.title = this.title || this.entityConstructor?.labelPlural;

    this.addColumnsFromColumnGroups();
    this.initColumnGroups(this.columnGroups);

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

  private addColumnsFromColumnGroups() {
    const allColumns = [...this.columns];
    const groupColumns = (this.columnGroups?.groups ?? []).reduce(
      (accumulatedColumns: string[], currentGroup) => [
        ...accumulatedColumns,
        ...currentGroup.columns,
      ],
      [],
    );
    for (const column of groupColumns) {
      if (
        !allColumns.some((existingColumn) =>
          // Check if the column is already defined as object or string
          typeof existingColumn === "string"
            ? existingColumn === column
            : existingColumn.id === column,
        )
      ) {
        allColumns.push(column);
      }
    }

    if (allColumns.length !== this.columns.length) {
      this.columns = [...allColumns];
    }
  }

  private initColumnGroups(columnGroup?: ColumnGroupsConfig) {
    if (columnGroup && columnGroup.groups.length > 0) {
      this.groups = columnGroup.groups;
      this.defaultColumnGroup =
        columnGroup.default || columnGroup.groups[0].name;
      this.mobileColumnGroup = columnGroup.mobile || columnGroup.groups[0].name;
    } else {
      this.groups = [
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
    // TODO: turn this into one of our filter types, so that all filtering happens the same way (and we avoid accessing internal datasource of sub-component here)
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.entityTable.recordsDataSource.filter = filterValue;
    this.filteredData = this.entityTable.recordsDataSource.filteredData.map(
      (x) => x.record,
    );
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
    return this.groups.findIndex((c) => c.name === columnGroupName);
  }

  /**
   * Calling this function will display the filters in a popup
   */
  openFilterOverlay() {
    this.dialog.open(FilterOverlayComponent, {
      data: {
        filterConfig: this.filters,
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

  duplicateRecords() {
    this.duplicateRecord.duplicateRecord(this.selectedRows);
    this.selectedRows = undefined;
  }

  async deleteRecords() {
    await this.entityActionsService.delete(this.selectedRows);
    this.selectedRows = undefined;
  }

  async archiveRecords() {
    await this.entityActionsService.archive(this.selectedRows);
    this.selectedRows = undefined;
  }

  async anonymizeRecords() {
    await this.entityActionsService.anonymize(this.selectedRows);
    this.selectedRows = undefined;
  }
}
