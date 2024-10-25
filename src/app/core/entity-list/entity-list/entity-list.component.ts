import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  ColumnGroupsConfig,
  EntityListConfig,
  FilterConfig,
  GroupConfig,
} from "../EntityListConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FilterOverlayComponent } from "../../filter/filter-overlay/filter-overlay.component";
import { MatDialog } from "@angular/material/dialog";
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
} from "@angular/common";
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
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { applyUpdate } from "../../entity/model/entity-update";
import { Subscription } from "rxjs";
import { DataFilter } from "../../filter/filters/filters";
import { EntityCreateButtonComponent } from "../../common-components/entity-create-button/entity-create-button.component";
import { AbilityModule } from "@casl/angular";
import { EntityActionsMenuComponent } from "../../entity-details/entity-actions-menu/entity-actions-menu.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "../../entity/entity-special-loader/entity-special-loader.service";
import { EntityEditService } from "app/core/entity/entity-actions/entity-edit.service";

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
    EntitiesTableComponent,
    FormsModule,
    FilterComponent,
    TabStateModule,
    ViewTitleComponent,
    ExportDataDirective,
    DisableEntityOperationDirective,
    RouterLink,
    MatTooltipModule,
    EntityCreateButtonComponent,
    AbilityModule,
    AsyncPipe,
    EntityActionsMenuComponent,
    ViewActionsComponent,
    // WARNING: all imports here also need to be set for components extending EntityList, like ChildrenListComponent
  ],
  standalone: true,
})
@UntilDestroy()
export class EntityListComponent<T extends Entity>
  implements EntityListConfig, OnChanges
{
  @Input() allEntities: T[];

  @Input() entityType: string;
  @Input() entityConstructor: EntityConstructor<T>;
  @Input() defaultSort: Sort;
  @Input() exportConfig: ExportColumnConfig[];

  /**
   * The special service or method to load data via an index or other special method.
   */
  @Input() loaderMethod: LoaderMethod;

  @Input() clickMode: "navigate" | "popup" | "none" = "navigate";

  /** initial / default state whether to include archived records in the list */
  @Input() showInactive: boolean;

  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();
  selectedRows: T[];

  isDesktop: boolean;

  @Input() title = "";
  @Input() columns: (FormFieldConfig | string)[] = [];
  @Input() columnGroups: ColumnGroupsConfig;
  groups: GroupConfig[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  @Input() filters: FilterConfig[] = [];

  columnsToDisplay: string[];

  filterObj: DataFilter<T>;
  filterString = "";
  filteredData = [];
  filterFreetext: string;

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
    protected entityMapperService: EntityMapperService,
    private entities: EntityRegistry,
    private dialog: MatDialog,
    private duplicateRecord: DuplicateRecordService,
    private entityActionsService: EntityActionsService,
    private entityEditService: EntityEditService,
    @Optional() private entitySpecialLoader: EntitySpecialLoaderService,
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
    return this.buildComponentFromConfig();
  }

  private async buildComponentFromConfig() {
    if (this.entityType) {
      this.entityConstructor = this.entities.get(
        this.entityType,
      ) as EntityConstructor<T>;
    }

    if (!this.allEntities) {
      // if no entities are passed as input, by default load all entities of the type
      await this.loadEntities();
    }

    this.title = this.title || this.entityConstructor?.labelPlural;

    this.initColumnGroups(this.columnGroups);

    this.displayColumnGroupByName(
      this.screenWidthObserver.isDesktop()
        ? this.defaultColumnGroup
        : this.mobileColumnGroup,
    );
  }

  protected async loadEntities() {
    this.allEntities = await this.getEntities();
    this.listenToEntityUpdates();
  }

  /**
   * Template method that can be overwritten to change the loading logic.
   * @protected
   */
  protected getEntities(): Promise<T[]> {
    if (this.loaderMethod && this.entitySpecialLoader) {
      return this.entitySpecialLoader.loadData(this.loaderMethod);
    }

    return this.entityMapperService.loadType(this.entityConstructor);
  }

  private updateSubscription: Subscription;

  private listenToEntityUpdates() {
    if (!this.updateSubscription && this.entityConstructor) {
      this.updateSubscription = this.entityMapperService
        .receiveUpdates(this.entityConstructor)
        .pipe(untilDestroyed(this))
        .subscribe((next) => {
          this.allEntities = applyUpdate(this.allEntities, next);
        });
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
    this.filterFreetext = filterValue.trim().toLowerCase();
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

  async editRecords() {
    await this.entityEditService.edit(
      this.selectedRows,
      this.entityConstructor,
    );
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

  onRowClick(row: T) {
    this.elementClick.emit(row);
  }
}
