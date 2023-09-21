import {
  AfterViewInit,
  Component,
  ContentChild,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import {
  DashboardTheme,
  DashboardWidgetComponent,
} from "../dashboard-widget/dashboard-widget.component";
import { MatTable, MatTableDataSource } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { BehaviorSubject } from "rxjs";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { filter, map } from "rxjs/operators";
import { applyUpdate } from "../../entity/model/entity-update";
import { Entity } from "../../entity/model/entity";
import { NgIf } from "@angular/common";
import { WidgetContentComponent } from "../dashboard-widget/widget-content/widget-content.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

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
@UntilDestroy()
@Component({
  selector: "app-dashboard-list-widget",
  templateUrl: "./dashboard-list-widget.component.html",
  styleUrls: ["./dashboard-list-widget.component.scss"],
  imports: [
    DashboardWidgetComponent,
    WidgetContentComponent,
    NgIf,
    MatPaginatorModule,
  ],
  standalone: true,
})
export class DashboardListWidgetComponent<E>
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() subtitle: string;
  @Input() icon: IconName = "exclamation-triangle";
  @Input() theme: DashboardTheme;
  @Input() title: string | number;
  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() headline: string;

  /**
   * array of items to be displayed in paginated widget table.
   * you can use an observable with async pipe here to let the component automatically handle "loading" indicator:
   * `[entries]="myDataObservable | async"`
   *
   * Alternatively define an entityType and dataPipe to let the component load data itself.
   */
  @Input() entries: E[];

  /**
   * entity type to be loaded for displaying entries
   * (filter or transform entities using the dataPipe input).
   *
   * If you define an entityType, the "entries" input is ignored in favor of directly loading data here
   */
  @Input() entityType: string;

  /**
   * Pipe to map, filter or sort the loaded data
   */
  @Input() dataMapper: (data: E[]) => E[];

  isLoading: boolean = true;
  data = new BehaviorSubject<E[]>(undefined);
  dataSource = new MatTableDataSource<E>();

  @ContentChild(MatTable) matTable: MatTable<E>;
  @ViewChild("paginator") private paginator: MatPaginator;

  constructor(private entityMapperService: EntityMapperService) {}

  ngOnInit() {
    this.data
      .pipe(
        filter((d) => !!d),
        map((d) => (this.dataMapper ? this.dataMapper(d) : d)),
        untilDestroyed(this),
      )
      .subscribe((newData) => {
        this.dataSource.data = newData;
        this.isLoading = !newData;
      });
  }

  private async loadDataForType() {
    // load data
    const entities = await this.entityMapperService.loadType(this.entityType);
    this.data.next(entities as E[]);

    // subscribe to relevant updates of data
    this.entityMapperService
      .receiveUpdates(this.entityType)
      .pipe(untilDestroyed(this))
      .subscribe((update) =>
        this.data.next(applyUpdate(this.data.value as Entity[], update) as E[]),
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entries && !this.entityType) {
      this.data.next(this.entries);
    }
    if (changes.entityType && !!this.entityType) {
      this.loadDataForType();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.matTable.dataSource = this.dataSource;
  }
}
