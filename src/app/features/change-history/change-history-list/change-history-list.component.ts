import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { PaginatedDataSource } from "../../../core/common-components/entities-table/data-source/paginated-data-source";
import { LoaderMethod } from "../../../core/entity/entity-special-loader/entity-special-loader.service";
import { DateRangeFilterComponent } from "../../../core/basic-datatypes/date/date-range-filter/date-range-filter.component";
import { DateFilter } from "../../../core/filter/filters/dateFilter";
import { DateRangeFilterConfigOption } from "../../../core/entity-list/EntityListConfig";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../core/entity/model/entity";
import { Logging } from "../../../core/logging/logging.service";
import { ChangeHistoryService } from "../change-history.service";
import { FILTERABLE_ACTIONS } from "../change-history.types";
import { ChangeHistoryActionBadgeComponent } from "../change-history-action-badge/change-history-action-badge.component";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { ensureValidEntityId } from "../display-audit-user/display-audit-user.component";
import { ChangeHistoryDialogComponent } from "../change-history-dialog/change-history-dialog.component";
import { AuditRecord } from "../model/audit-record";
import { buildAuditFilter } from "../audit-filter";

/**
 * Presets offered by the date-range filter, alongside the two date inputs the
 * shared filter also provides. Same shape and periods as the reports screen, so
 * "last month" means the same thing in both places.
 */
export const CHANGE_HISTORY_DATE_RANGES: DateRangeFilterConfigOption[] = [
  {
    startOffsets: [{ amount: 0, unit: "weeks" }],
    endOffsets: [{ amount: 0, unit: "weeks" }],
    label: $localize`:Change log date filter:Current week`,
  },
  {
    startOffsets: [{ amount: 0, unit: "months" }],
    endOffsets: [{ amount: 0, unit: "months" }],
    label: $localize`:Change log date filter:Current month`,
  },
  {
    startOffsets: [{ amount: -1, unit: "months" }],
    endOffsets: [{ amount: -1, unit: "months" }],
    label: $localize`:Change log date filter:Last month`,
  },
  {
    startOffsets: [{ amount: 0, unit: "quarter" }],
    endOffsets: [{ amount: 0, unit: "quarter" }],
    label: $localize`:Change log date filter:Current quarter`,
  },
  {
    startOffsets: [{ amount: 0, unit: "years" }],
    endOffsets: [{ amount: 0, unit: "years" }],
    label: $localize`:Change log date filter:Current year`,
  },
];

/**
 * Admin screen listing every recorded change across the whole system, newest
 * first: when, which record, what kind of change, by whom and which fields.
 *
 * Complements the per-record change-history dialog, which is unreachable for a
 * deleted record because its details view is gone.
 */
@Component({
  selector: "app-change-history-list",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    ViewTitleComponent,
    FeatureDisabledInfoComponent,
    EntitiesTableComponent,
    DateRangeFilterComponent,
    ChangeHistoryActionBadgeComponent,
    EntityBlockComponent,
    FaDynamicIconComponent,
  ],
  templateUrl: "./change-history-list.component.html",
  styleUrl: "./change-history-list.component.scss",
})
export class ChangeHistoryListComponent {
  private readonly service = inject(ChangeHistoryService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly route = inject(ActivatedRoute);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly dialog = inject(MatDialog);

  /** backend feature flag (undefined while loading, then true/false) */
  readonly auditEnabled = this.service.isAuditEnabled;
  /** whether the user may read the audit data */
  readonly hasPermission = this.service.hasHistoryPermission();

  readonly auditRecordType = AuditRecord;

  /**
   * Built here rather than resolved by the table, because resolveDataSource
   * decides on the session type while this type's database is remote in every
   * session. The table takes a data source as an input, so nothing else is
   * needed to bypass it.
   *
   * It also answers the related-record filter, which needs a different query
   * than the rest of the filter bar.
   */
  readonly dataSource = new PaginatedDataSource<AuditRecord>();

  /**
   * Newest first. Pinned explicitly because the default would order by `_id`,
   * which groups an audit database by record rather than by time - plausible
   * looking, and wrong.
   */
  readonly sortBy = { active: "timestamp", direction: "desc" as const };

  readonly columns = [
    {
      id: "timestamp",
      label: $localize`:Change log column:When`,
      viewComponent: "DisplayAuditTimestamp",
    },
    {
      id: "recordType",
      label: $localize`:Change log column:Record type`,
      viewComponent: "DisplayEntityType",
    },
    {
      id: "record",
      label: $localize`:Change log column:Record`,
      viewComponent: "DisplayAuditRecord",
    },
    {
      id: "action",
      label: $localize`:Change log column:Action`,
      viewComponent: "ChangeHistoryActionBadge",
    },
    {
      id: "user",
      label: $localize`:Change log column:Changed by`,
      viewComponent: "DisplayAuditUser",
    },
    {
      id: "changedFields",
      label: $localize`:Change log column:Changed fields`,
      viewComponent: "ChangeHistoryChangedFields",
    },
  ];

  /**
   * The actions offered by the filter. Each option renders the same badge the
   * table uses, so there is no second copy of the action wording to keep in sync.
   */
  readonly actions = FILTERABLE_ACTIONS;

  readonly entityTypes = this.entityRegistry
    .getEntityTypes(true)
    .map(({ key, value }) => ({ key, label: value.label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  /**
   * Pre-filled from the `entityType` query parameter, so an entity list can link
   * here for its own record type and land on that type's changes.
   */
  readonly entityTypeFilter = signal<string | undefined>(
    this.route.snapshot.queryParamMap.get("entityType") ?? undefined,
  );
  readonly changedByFilter = signal<string | undefined>(undefined);
  readonly relatedEntityFilter = signal<string | undefined>(undefined);
  readonly actionFilter = signal<string | undefined>(undefined);
  readonly dateFrom = signal<Date | undefined>(undefined);
  readonly dateTo = signal<Date | undefined>(undefined);

  /**
   * The related-record filter is served by a view keyed on the referenced id, so
   * only the date range narrows it further; record type, action and author would
   * need a different key order and are therefore unavailable while it is set.
   */
  readonly otherFiltersDisabled = computed(() => !!this.relatedEntityFilter());

  readonly disabledFilterHint = $localize`:Change log filter hint:Not available while filtering by a related record`;

  /**
   * Drives the shared date-range filter, the same control (and presets shape)
   * the reports screen uses, rather than a change-history-specific dropdown.
   */
  readonly dateFilterConfig = new DateFilter<Entity>(
    "timestamp",
    $localize`:Change log filter label:Date range`,
    CHANGE_HISTORY_DATE_RANGES,
  );

  /** Whether the audit data can be queried at all. */
  private readonly canQuery = computed(
    () => this.auditEnabled() === true && this.hasPermission,
  );

  readonly filter = computed(() =>
    buildAuditFilter(
      // the disabled filters keep their selection but must not be applied, or
      // the list would silently contradict the query it ran
      this.otherFiltersDisabled()
        ? { from: this.dateFrom(), to: this.dateTo() }
        : {
            entityType: this.entityTypeFilter(),
            changedBy: this.changedByFilter(),
            action: this.actionFilter(),
            from: this.dateFrom(),
            to: this.dateTo(),
          },
    ),
  );

  private readonly authorsResource = resource({
    params: () => (this.canQuery() ? {} : undefined),
    // an unavailable author list only costs the filter its options, so it must
    // not fail the screen
    loader: async () => {
      try {
        return await this.service.getChangeAuthors();
      } catch (err) {
        Logging.debug("could not load the change log's author options", err);
        return [];
      }
    },
  });

  readonly authors = computed(() =>
    (this.authorsResource.value() ?? []).map((value) => ({
      value,
      entityId: ensureValidEntityId(value),
    })),
  );

  constructor() {
    // the flag fetch is lazy, so nothing loads until a change-history UI asks
    this.service.loadAuditFeatureFlag();
    this.applyRelatedRecord();
  }

  setEntityTypeFilter(entityType: string | undefined) {
    this.entityTypeFilter.set(entityType);
  }

  setActionFilter(action: string | undefined) {
    this.actionFilter.set(action);
  }

  setChangedByFilter(changedBy: string | undefined) {
    this.changedByFilter.set(changedBy);
  }

  /**
   * @param relatedEntityId a record id as displayed and copied elsewhere in the
   *        app (`User:1`); anything blank clears the filter
   */
  setRelatedEntityFilter(relatedEntityId: string | undefined) {
    this.relatedEntityFilter.set(relatedEntityId?.trim() || undefined);
    this.applyRelatedRecord();
  }

  onDateRangeChange(range: { from: Date | null; to: Date | null }) {
    this.dateFrom.set(range.from ?? undefined);
    this.dateTo.set(range.to ?? undefined);
    // the view is keyed on the date range too, so it has to be re-queried
    if (this.relatedEntityFilter()) {
      this.applyRelatedRecord();
    }
  }

  /**
   * Point the list at the query the current filters need: the ordinary audit
   * records, or - when a related record is named - the loader that serves the
   * view keyed on it. Changing the config resets the paging, since everything
   * loaded so far answered the previous query.
   */
  private applyRelatedRecord() {
    const recordId = this.relatedEntityFilter();
    this.dataSource.loadRecordConfig.set({
      entityCtr: AuditRecord,
      loaderMethod: recordId
        ? LoaderMethod.AuditRecordsRelatedToEntity
        : undefined,
      forEntity: recordId ? this.standInFor(recordId) : undefined,
    });
  }

  /**
   * Whether this row can be opened as a record history, which takes only the
   * changed record's id: the history is queried by id, and the dialog's other
   * content (the record block, the created/updated metadata) is optional.
   */
  canOpenHistory(record: AuditRecord): boolean {
    return !!record.record;
  }

  /**
   * Open the same per-record change-history dialog the record's details view
   * offers, showing this record's full history rather than the single change of
   * the clicked row.
   */
  async openHistory(record: AuditRecord) {
    if (!this.canOpenHistory(record)) {
      return;
    }

    ChangeHistoryDialogComponent.open(
      this.dialog,
      await this.loadRecord(record),
      // the row's own audit record, so the dialog opens on the change that was
      // clicked rather than a collapsed list to search through again
      record.getId(),
    );
  }

  /**
   * The record of a change-log row, as an entity for the history dialog.
   *
   * A deleted record - which the log deliberately still lists - can no longer be
   * loaded, so an empty instance carrying just its id stands in: the dialog needs
   * the id to query the history and the type for the field labels, and it hides
   * the created/last-updated metadata that such a stand-in has none of.
   */
  /**
   * A placeholder for a record that can no longer be loaded, carrying its id so
   * the history can still be queried by it.
   *
   * Uses the registered constructor where there is one, so the dialog still
   * shows the right type. Where there is not, the stand-in carries the record's
   * type anyway: the plain Entity would prefix the id a second time
   * ("Entity:Child:1") and query a history that does not exist. An unregistered
   * type is otherwise fine here - only the id is needed to load the history,
   * and the dialog's remaining content is optional.
   */
  private standInFor(recordId: string): Entity {
    const recordType = Entity.extractTypeFromId(recordId);
    const ctor = this.entityRegistry.has(recordType)
      ? this.entityRegistry.get(recordType)
      : class extends Entity {
          static override ENTITY_TYPE = recordType;
        };
    return new ctor(recordId);
  }

  private async loadRecord(record: AuditRecord): Promise<Entity> {
    try {
      return await this.entityMapper.load(record.recordType, record.record);
    } catch (err) {
      Logging.debug(
        "change log: record not available, showing its history only",
        record.record,
        err,
      );
      return this.standInFor(record.record);
    }
  }
}
