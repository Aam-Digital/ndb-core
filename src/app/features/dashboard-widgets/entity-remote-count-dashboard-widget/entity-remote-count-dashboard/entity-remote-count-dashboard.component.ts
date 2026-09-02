import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from "@angular/core";
import { Router } from "@angular/router";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { debounceTime } from "rxjs/operators";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { DashboardListWidgetComponent } from "#src/app/core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { getEntityRuntimeRoute } from "#src/app/core/entity/entity-config.service";
import { EntityFieldLabelComponent } from "#src/app/core/entity/entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Number of ids fetched per request while counting a group. Larger than the
 * paginated table's page size because the `idOnly` responses are tiny, so fewer
 * round-trips is the better trade-off here.
 */
export const REMOTE_COUNT_BATCH_SIZE = 10000;

/** row id used for the "value set, but not a known option" aggregate row */
const INVALID_OPTION_ROW_ID = "__invalid__";

/**
 * Configuration (stored in the Config document in the DB) for the dashboard widget.
 */
export interface EntityRemoteCountDashboardConfig {
  entityType?: string;
  groupBy?: string;
}

/**
 * One row of disaggregated counts (the number of records that have a specific
 * category / configurable-enum option set).
 */
interface RemoteCountRow {
  label: string | undefined;
  id: string;

  /** the number of records that have this option set */
  value: number;

  color?: string;

  /** true for the aggregate row of records whose value matches no known option */
  isInvalidOption?: boolean;

  /** entity instance carrying the option value, for the display component */
  entity?: Entity;

  /** field name for the display component */
  fieldName?: string;
}

/**
 * Dashboard widget that shows how many records exist for each option of a
 * configurable-enum field (by default: how many {@link Note}s per category).
 *
 * Unlike {@link EntityCountDashboardComponent}, which loads every record into
 * the browser and groups them in memory, this widget calculates each count on
 * the server: for every option it pages through all matches with an `idOnly`
 * projection, so only the matching document ids - not their contents - are
 * transferred. This keeps the amount of transferred data small even for entity
 * types with a large number of records.
 *
 * Besides one row per configured option it also reports an aggregate row for
 * records whose stored value is not (or no longer) a configured option, and one
 * for records where the field is not set at all.
 *
 * Because it relies on the database `find` API it only works against a remote
 * CouchDB connection (same constraint as {@link PaginatedDataSource}).
 */
@DynamicComponent("EntityRemoteCountDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-remote-count-dashboard-widget",
  templateUrl: "./entity-remote-count-dashboard.component.html",
  styleUrls: ["./entity-remote-count-dashboard.component.scss"],
  imports: [
    MatTableModule,
    FontAwesomeModule,
    Angulartics2Module,
    DashboardListWidgetComponent,
    MatTooltipModule,
    EntityFieldLabelComponent,
    EntityFieldViewComponent,
  ],
})
export class EntityRemoteCountDashboardComponent {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly router = inject(Router);
  private readonly entities = inject(EntityRegistry);
  private readonly configurableEnum = inject(ConfigurableEnumService);

  entityType = input("Note");
  /** the (single) configurable-enum field whose options are counted */
  groupBy = input<string>("category");
  subtitle = input<string>();
  explanation = input<string>(
    $localize`:dashboard widget explanation:Counting all records per category. Each count is calculated by the server, so the records themselves are never transferred to your browser.`,
  );

  /** one row per option; `undefined` while still loading */
  entries = signal<RemoteCountRow[] | undefined>(undefined);

  entityDefinition = computed(() => this.entities.get(this.entityType()));

  totalCount = computed<number | undefined>(() =>
    this.entries()?.reduce((sum, row) => sum + row.value, 0),
  );

  constructor() {
    effect((onCleanup) => {
      const entityDefinition = this.entityDefinition();
      const groupBy = this.groupBy();
      let isCurrent = true;

      this.entries.set(undefined);

      const reload = () =>
        untracked(async () => {
          const rows = await this.loadGroupCounts(entityDefinition, groupBy);
          if (isCurrent) {
            this.entries.set(rows);
          }
        });
      void reload();

      // Recalculate when records change. Debounced because - other than in the
      // in-memory sibling widget - every refresh re-issues one request per
      // option, so bursts (e.g. an import) should collapse into a single reload.
      const subscription = this.entityMapper
        .receiveUpdates(entityDefinition.ENTITY_TYPE)
        .pipe(debounceTime(2500))
        .subscribe(() => void reload());

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });
  }

  goToEntityList(filterId: string) {
    const params = {};
    params[this.groupBy()] = encodeURIComponent(filterId);
    this.router.navigate([getEntityRuntimeRoute(this.entityDefinition())], {
      queryParams: params,
    });
  }

  static getRequiredEntities(config: EntityRemoteCountDashboardConfig) {
    return config?.entityType || "Note";
  }

  /**
   * Load one row per option of the given configurable-enum field (each holding
   * the server-calculated number of matching records), plus two aggregate rows:
   * one for records whose value is not a currently configured option and one
   * for records where the field is not set at all.
   */
  private async loadGroupCounts(
    entityDefinition: EntityConstructor,
    fieldName: string,
  ): Promise<RemoteCountRow[]> {
    const field = entityDefinition.schema.get(fieldName);
    if (field?.dataType !== "configurable-enum") {
      Logging.warn(
        `EntityRemoteCountDashboard: field "${fieldName}" of ${entityDefinition.ENTITY_TYPE} is not a configurable-enum and cannot be counted per option`,
      );
      return [];
    }

    const enumValues = this.configurableEnum.getEnumValues(
      field.additional as string,
    );
    // sorting by the grouped field lets find() build/use a Mango index on it
    const fieldSort = { prop: fieldName, dir: "asc" as const };

    // Derive the "invalid" and "not set" counts from two type-wide counts
    // instead of `$exists` / `$nin` queries, so both stay index-friendly:
    // - allDocs: every record of this type (`_id` range)
    // - withValue: records holding any non-empty value (indexed range on the field)
    const [optionRows, allDocsCount, withValueCount] = await Promise.all([
      Promise.all(
        enumValues.map(async (option) => {
          const value = await this.countMatchingRecords(
            entityDefinition,
            { [fieldName]: option.id },
            fieldSort,
          );

          const entity = new entityDefinition();
          entity[fieldName] = option;

          const row: RemoteCountRow = {
            label: option.label,
            id: option.id,
            value,
            fieldName,
            entity,
          };
          if (option.color !== undefined) {
            row.color = option.color;
          }
          return row;
        }),
      ),
      this.countMatchingRecords(entityDefinition, {}),
      this.countMatchingRecords(
        entityDefinition,
        { [fieldName]: { $gt: "" } },
        fieldSort,
      ),
    ]);

    const validCount = optionRows.reduce((sum, row) => sum + row.value, 0);
    const invalidCount = Math.max(0, withValueCount - validCount);
    const notSetCount = Math.max(0, allDocsCount - withValueCount);

    return [
      ...optionRows,
      { label: undefined, id: "", value: notSetCount, fieldName },
      {
        label: undefined,
        id: INVALID_OPTION_ROW_ID,
        value: invalidCount,
        isInvalidOption: true,
      },
    ];
  }

  /**
   * Count all records matching the filter by paging through the database in
   * batches with an id-only projection - the same "request every page
   * explicitly" approach as {@link PaginatedDataSource.getAllData}, but without
   * keeping the documents (only their number is needed).
   */
  private async countMatchingRecords(
    entityDefinition: EntityConstructor,
    filter: DataFilter<Entity>,
    sort?: { prop?: string; dir?: "asc" | "desc" },
  ): Promise<number> {
    let count = 0;
    let bookmark: string | undefined;
    let lastPageSize: number;
    do {
      const res = await this.entityMapper.findType(
        entityDefinition,
        filter,
        { limit: REMOTE_COUNT_BATCH_SIZE, bookmark },
        sort,
        { idOnly: true },
      );
      lastPageSize = res.records.length;
      bookmark = res.bookmark;
      count += lastPageSize;
    } while (lastPageSize === REMOTE_COUNT_BATCH_SIZE);
    return count;
  }
}
