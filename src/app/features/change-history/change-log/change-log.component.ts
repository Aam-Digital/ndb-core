import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatChipsModule } from "@angular/material/chips";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { DateRangeFilterComponent } from "../../../core/basic-datatypes/date/date-range-filter/date-range-filter.component";
import { DateFilter } from "../../../core/filter/filters/dateFilter";
import { DateRangeFilterConfigOption } from "../../../core/entity-list/EntityListConfig";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { Logging } from "../../../core/logging/logging.service";
import { NotificationTimePipe } from "../../notification/notification-time.pipe";
import { ChangeHistoryService } from "../change-history.service";
import { authorEntityId } from "../change-log-query";
import { ChangeHistoryActionBadgeComponent } from "../change-history-action-badge/change-history-action-badge.component";

/**
 * Presets offered by the date-range filter, alongside the two date inputs the
 * shared filter also provides. Same shape and periods as the reports screen, so
 * "last month" means the same thing in both places.
 */
export const CHANGE_LOG_DATE_RANGES: DateRangeFilterConfigOption[] = [
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
  selector: "app-change-log",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
    ViewTitleComponent,
    FeatureDisabledInfoComponent,
    FaDynamicIconComponent,
    EntityBlockComponent,
    EntityFieldLabelComponent,
    CustomDatePipe,
    DateRangeFilterComponent,
    NotificationTimePipe,
    ChangeHistoryActionBadgeComponent,
  ],
  templateUrl: "./change-log.component.html",
  styleUrl: "./change-log.component.scss",
})
export class ChangeLogComponent {
  private readonly service = inject(ChangeHistoryService);
  private readonly entityRegistry = inject(EntityRegistry);

  /** backend feature flag (undefined while loading, then true/false) */
  readonly auditEnabled = this.service.isAuditEnabled;
  /**
   * Whether the user may read the audit data. A signal rather than a one-off
   * check: this screen stays open long enough for the permission rules behind it
   * to change (the roles admin is a click away).
   */
  readonly hasPermission = this.service.hasAuditPermission;

  readonly displayedColumns = [
    "when",
    "entity",
    "action",
    "changedBy",
    "changedFields",
  ];

  readonly entityTypes = this.entityRegistry
    .getEntityTypes(true)
    .map(({ key, value }) => ({ key, label: value.label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  readonly entityTypeFilter = signal<string | undefined>(undefined);
  readonly changedByFilter = signal<string | undefined>(undefined);
  readonly dateFrom = signal<Date | undefined>(undefined);
  readonly dateTo = signal<Date | undefined>(undefined);

  /**
   * Drives the shared date-range filter, the same control (and presets shape)
   * the reports screen uses, rather than a change-log-specific dropdown.
   */
  readonly dateFilterConfig = new DateFilter<Entity>(
    "timestamp",
    $localize`:Change log filter label:Date range`,
    CHANGE_LOG_DATE_RANGES,
  );

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50, 100];

  /** Whether the audit data can be queried at all. */
  private readonly canQuery = computed(
    () => this.auditEnabled() === true && this.hasPermission(),
  );

  private readonly pageResource = resource({
    params: () =>
      this.canQuery()
        ? {
            entityType: this.entityTypeFilter(),
            changedBy: this.changedByFilter(),
            from: this.dateFrom(),
            to: this.dateTo(),
            pageSize: this.pageSize(),
            pageIndex: this.pageIndex(),
          }
        : undefined,
    // failures are caught here and returned as state rather than left to reject:
    // reading a failed resource's value() re-throws, which would take the whole
    // page down instead of showing the error below the table
    loader: async ({ params }) => {
      try {
        const page = await this.service.queryChangeLog(
          {
            entityType: params.entityType,
            changedBy: params.changedBy,
            from: params.from,
            to: params.to,
          },
          params.pageSize,
          params.pageIndex,
        );
        return { ...page, failed: false };
      } catch (err) {
        Logging.error("Failed to load the change log", err);
        return { entries: [], hasMore: false, failed: true };
      }
    },
  });

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

  readonly entries = computed(() => this.pageResource.value()?.entries ?? []);
  readonly isLoading = this.pageResource.isLoading;
  readonly loadError = computed(
    () => this.pageResource.value()?.failed === true,
  );
  readonly authors = computed(() =>
    (this.authorsResource.value() ?? []).map((value) => ({
      value,
      entityId: authorEntityId(value),
    })),
  );

  /**
   * Length reported to the paginator: everything paged through so far, plus one
   * if the backend reported a further page, which is what keeps "next" enabled.
   * `_find` gives no total count, so the real total stays unknown (hence no
   * last-page button).
   */
  readonly pageLengthHint = computed(() => {
    const seen = this.pageIndex() * this.pageSize() + this.entries().length;
    return this.pageResource.value()?.hasMore ? seen + 1 : seen;
  });

  constructor() {
    // the flag fetch is lazy, so nothing loads until a change-history UI asks
    this.service.loadAuditFeatureFlag();
  }

  setEntityTypeFilter(entityType: string | undefined) {
    this.entityTypeFilter.set(entityType);
    this.pageIndex.set(0);
  }

  setChangedByFilter(changedBy: string | undefined) {
    this.changedByFilter.set(changedBy);
    this.pageIndex.set(0);
  }

  onDateRangeChange(range: { from: Date | null; to: Date | null }) {
    this.dateFrom.set(range.from ?? undefined);
    this.dateTo.set(range.to ?? undefined);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent) {
    // a different page size makes the requested page index meaningless
    const sizeChanged = event.pageSize !== this.pageSize();
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(sizeChanged ? 0 : event.pageIndex);
  }
}
