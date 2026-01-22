import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
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
import { AsyncPipe, NgStyle, NgTemplateOutlet } from "@angular/common";
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
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { Sort } from "@angular/material/sort";
import { ExportColumnConfig } from "../../export/data-transformation-service/export-column-config";
import { RouteTarget } from "../../../route-target";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { applyUpdate, UpdatedEntity } from "../../entity/model/entity-update";
import { Subscription } from "rxjs";
import { DataFilter } from "../../filter/filters/filters";
import { EntityCreateButtonComponent } from "../../common-components/entity-create-button/entity-create-button.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "../../entity/entity-special-loader/entity-special-loader.service";
import { AblePurePipe } from "@casl/angular";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { EntityLoadPipe } from "../../common-components/entity-load/entity-load.pipe";
import { PublicFormConfig } from "#src/app/features/public-form/public-form-config";
import { PublicFormsService } from "#src/app/features/public-form/public-forms.service";
import { EntityBulkActionsComponent } from "../../entity-details/entity-bulk-actions/entity-bulk-actions.component";
import { BulkOperationStateService } from "../../entity/entity-actions/bulk-operation-state.service";
import { PerformanceAnalysisLogging } from "#src/app/utils/performance-analysis-logging";

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
    NgStyle,
    MatButtonModule,
    Angulartics2OnModule,
    FontAwesomeModule,
    MatMenuModule,
    NgTemplateOutlet,
    MatTabsModule,
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
    MatProgressBarModule,
    EntityCreateButtonComponent,
    AsyncPipe,
    AblePurePipe,
    ViewActionsComponent,
    EntityLoadPipe,
    EntityBulkActionsComponent,
  ],
})
@UntilDestroy()
export class EntityListComponent<T extends Entity>
  implements EntityListConfig, OnChanges, OnInit
{
  private screenWidthObserver = inject(ScreenWidthObserver);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  protected entityMapperService = inject(EntityMapperService);
  private entities = inject(EntityRegistry);
  private dialog = inject(MatDialog);
  private entitySpecialLoader = inject(EntitySpecialLoaderService, {
    optional: true,
  });
  private readonly formDialog = inject(FormDialogService);
  private readonly bulkOperationState = inject(BulkOperationStateService);

  private readonly publicFormsService = inject(PublicFormsService);
  public publicFormConfigs: PublicFormConfig[] = [];

  @Input() allEntities: T[];

  @Input() entityType: string;
  @Input() entityConstructor: EntityConstructor<T>;
  @Input() defaultSort: Sort;
  @Input() exportConfig: ExportColumnConfig[];

  /**
   * The special service or method to load data via an index or other special method.
   */
  @Input() loaderMethod: LoaderMethod;

  @Input() clickMode: "navigate" | "popup" | "popup-details" | "none" =
    "navigate";

  /** initial / default state whether to include archived records in the list */
  @Input() showInactive: boolean;

  @Output() elementClick = new EventEmitter<T>();
  @Output() addNewClick = new EventEmitter();
  @Output() showInactiveChange = new EventEmitter<boolean>();
  selectedRows: T[];

  isDesktop: boolean;

  @Input() title = "";
  @Input() columns: (FormFieldConfig | string)[] = [];
  @Input() columnGroups: ColumnGroupsConfig;
  groups: GroupConfig[] = [];
  defaultColumnGroup = "";
  mobileColumnGroup = "";
  @Input() filters: FilterConfig[] = [];

  /**
   * Whether the list's default row coloring should reflect each entity's color.
   */
  @Input() showEntityColor: boolean = false;

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

  constructor() {
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

  async ngOnInit() {
    await this.loadPublicFormConfig();
  }

  private async loadPublicFormConfig() {
    const allForms = await this.publicFormsService.getAllPublicFormConfigs();
    this.publicFormConfigs = allForms.filter(
      (config) =>
        config.entity &&
        config.entity.toLowerCase() ===
          this.entityConstructor?.ENTITY_TYPE?.toLowerCase(),
    );
  }

  async copyPublicFormLinkForEntityType(config: PublicFormConfig) {
    await this.publicFormsService.copyPublicFormLinkFromConfig(config);
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
  protected async getEntities(): Promise<T[]> {
    if (this.loaderMethod && this.entitySpecialLoader) {
      return this.entitySpecialLoader.loadData(this.loaderMethod);
    }

    const activeRecords = await this.entityMapperService.loadType(
      this.entityConstructor,
      "active",
    );
    if (this.showInactive) this.loadInactiveEntities();
    return activeRecords;
  }

  private inactiveLoaded = false;
  loadingInactive = signal(false);

  async onShowInactiveChange(showInactive: boolean) {
    this.showInactive = showInactive;
    this.showInactiveChange.emit(showInactive);
    if (showInactive && !this.inactiveLoaded) {
      await this.loadInactiveEntities();
    }
  }

  private async loadInactiveEntities() {
    this.loadingInactive.set(true);
    const inactiveEntities = await this.entityMapperService.loadType(
      this.entityConstructor,
      "inactive",
    );
    this.allEntities = [...this.allEntities, ...inactiveEntities];
    this.inactiveLoaded = true;
    this.loadingInactive.set(false);
  }

  private updateSubscription: Subscription;

  private listenToEntityUpdates() {
    if (this.updateSubscription || !this.entityConstructor) {
      return;
    }

    this.updateSubscription = this.entityMapperService
      .receiveUpdates(this.entityConstructor)
      .pipe(untilDestroyed(this))
      .subscribe(async (updatedEntity: UpdatedEntity<T>) => {
        if (this.bulkOperationState.isBulkOperationInProgress()) {
          //buffer updates during bulk operations to avoid UI performance issues
          const inProgress =
            this.bulkOperationState.updateBulkOperationProgress(1, false);
          if (!inProgress) {
            // reload the list once
            this.allEntities = await this.getEntities();
            // Use setTimeout and requestAnimationFrame to detect when UI rendering is complete and inform the bulk action update
            setTimeout(() => {
              requestAnimationFrame(() => {
                this.bulkOperationState.completeBulkOperation();
              });
            });
          }
          return;
        }

        //get specially enhanced entity if necessary
        if (this.loaderMethod && this.entitySpecialLoader) {
          updatedEntity = await this.entitySpecialLoader.extendUpdatedEntity(
            this.loaderMethod,
            updatedEntity,
          );
        }
        this.allEntities = applyUpdate(this.allEntities, updatedEntity);
      });
  }

  private initColumnGroups(columnGroup?: ColumnGroupsConfig) {
    if (columnGroup && columnGroup.groups.length > 0) {
      this.groups = columnGroup.groups;
      this.defaultColumnGroup =
        columnGroup.default && this.configuredTabExists(columnGroup.default)
          ? columnGroup.default
          : columnGroup.groups[0].name;

      this.mobileColumnGroup =
        columnGroup.mobile && this.configuredTabExists(columnGroup.mobile)
          ? columnGroup.mobile
          : columnGroup.groups[0].name;
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

  private configuredTabExists(groupName: string): boolean {
    return this.groups.some((group) => group.name === groupName);
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

  addNew(newEntity?: T) {
    if (!newEntity) {
      newEntity = new this.entityConstructor();
    }

    switch (this.clickMode) {
      case "navigate":
        this.router.navigate(["new"], { relativeTo: this.activatedRoute });
        break;
      case "popup":
        this.formDialog.openFormPopup(newEntity, this.columns);
        break;
      case "popup-details":
        this.formDialog.openView(newEntity);
        break;
    }

    this.addNewClick.emit();
  }

  onRowClick(row: T) {
    this.elementClick.emit(row);
  }
}
