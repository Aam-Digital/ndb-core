import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import {
  DashboardTheme,
  DashboardWidgetComponent,
} from "../dashboard-widget/dashboard-widget.component";
import { MatTable, MatTableDataSource } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { applyUpdate } from "../../entity/model/entity-update";
import { Entity } from "../../entity/model/entity";
import { WidgetContentComponent } from "../dashboard-widget/widget-content/widget-content.component";

/**
 * Base dashboard widget to build widgets that display a number of entries as a table.
 *
 * This widget automatically handles loading animation and pagination.
 * Define a mat-table with your desired layout for displaying the entries through content-projection
 * and provide the data array as an input using async pipe.
 *
 * <app-dashboard-list-widget [entries]="notes | async">
 *   <table mat-table>
 *     <!-- define row layout here-->
 *   </table>
 * </app-dashboard-list-widget>
 *
 * To highlight a row with a colored bar at the front, apply `class="row-indicator"` to your first <td>
 *   and set the css variable to the desired color, e.g. `[ngStyle]="{'--row-indicator-color': row.getColor?.()}"`
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-dashboard-list-widget",
  templateUrl: "./dashboard-list-widget.component.html",
  styleUrls: ["./dashboard-list-widget.component.scss"],
  imports: [
    DashboardWidgetComponent,
    WidgetContentComponent,
    MatPaginatorModule,
  ],
})
export class DashboardListWidgetComponent<E> {
  private entityMapperService = inject(EntityMapperService);

  subtitle = input<string>();
  icon = input<IconName>("exclamation-triangle");
  theme = input<DashboardTheme>();
  title = input<string | number>();
  /** optional tooltip to explain detailed meaning of this widget / statistic */
  explanation = input<string>();
  headline = input<string>();
  paginationPageSize = input(5); // Default to 5 entries per page

  /**
   * array of items to be displayed in paginated widget table.
   * you can use an observable with async pipe here to let the component automatically handle "loading" indicator:
   * `[entries]="myDataObservable | async"`
   *
   * Alternatively define an entityType and dataPipe to let the component load data itself.
   */
  entries = input<E[]>();

  /**
   * entity type to be loaded for displaying entries
   * (filter or transform entities using the dataPipe input).
   *
   * If you define an entityType, the "entries" input is ignored in favor of directly loading data here
   */
  entityType = input<string>();

  /**
   * Pipe to map, filter or sort the loaded data
   */
  dataMapper = input<(data: E[]) => E[]>();

  /**
   * Async function that loads one page of entries from the database, given how many
   * items to skip and how many to load (limit).
   *
   * If set, the widget fetches and manages pages itself as the user pages through the
   * paginator (querying only what's needed), instead of using `entries`/`entityType`
   * (which load everything upfront). Intended for a data source (e.g. a dedicated
   * PouchDB/CouchDB view) that can return results already sorted/filtered server-side -
   * `dataMapper`, if also set, still applies to each loaded page client-side.
   */
  pageLoader = input<(skip: number, limit: number) => Promise<E[]>>();

  private rawData = signal<E[] | undefined>(undefined);
  private usesOwnLoading = computed(() => !!this.entityType() || !!this.pageLoader());
  private data = computed(() => {
    const sourceData = this.usesOwnLoading() ? this.rawData() : this.entries();
    if (!sourceData) {
      return [] as E[];
    }

    const mapper = this.dataMapper();
    return mapper ? mapper(sourceData) : sourceData;
  });
  isLoading = computed(() => {
    const sourceData = this.usesOwnLoading() ? this.rawData() : this.entries();
    return sourceData === undefined;
  });
  dataSource = new MatTableDataSource<E>();

  matTable = contentChild(MatTable);
  private paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.data();
    });

    effect(() => {
      const matTable = this.matTable();
      if (matTable) {
        matTable.dataSource = this.dataSource;
      }
    });

    effect(() => {
      const paginator = this.paginator();
      // In pageLoader mode, `rawData` already holds only the current page - MatTableDataSource
      // must not also slice it by pageIndex*pageSize itself (it would slice a small, already-
      // paged array as if it were the full dataset). The paginator is still used, just not
      // bound here - see the pageLoader effect below, which reads its `page` events directly.
      // Always assigned explicitly (not just conditionally) so a binding made before
      // pageLoader was set doesn't stick around once it is.
      this.dataSource.paginator = this.pageLoader() ? undefined : paginator;
    });

    effect((onCleanup) => {
      // Loading via `pageLoader`
      const loader = this.pageLoader();
      const paginator = this.paginator();
      if (!loader || !paginator) {
        return;
      }
      const pageSize = this.paginationPageSize();

      let isCurrent = true;
      const loadPage = async (pageIndex: number) => {
        const skip = pageIndex * pageSize;
        // Fetch one extra item to detect whether a further page exists, without a
        // separate count query.
        const page = await loader(skip, pageSize + 1);
        if (!isCurrent) {
          return;
        }
        const hasMore = page.length > pageSize;
        this.rawData.set(hasMore ? page.slice(0, pageSize) : page);
        paginator.length = skip + Math.min(page.length, pageSize) + (hasMore ? pageSize : 0);
      };

      this.rawData.set(undefined);
      void loadPage(0);
      const subscription = paginator.page.subscribe((event) =>
        loadPage(event.pageIndex),
      );

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });

    effect((onCleanup) => {
      // Loading via `entityType`
      const entityType = this.entityType();
      if (!entityType || this.pageLoader()) {
        return;
      }

      let isCurrent = true;
      this.rawData.set(undefined);

      untracked(async () => {
        const entities = await this.entityMapperService.loadType(entityType);
        if (isCurrent) {
          this.rawData.set(entities as E[]);
        }
      });

      const subscription = this.entityMapperService
        .receiveUpdates(entityType)
        .subscribe((update) => {
          const currentData = (this.rawData() ?? []) as Entity[];
          this.rawData.set(applyUpdate(currentData, update) as E[]);
        });

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });
  }
}
