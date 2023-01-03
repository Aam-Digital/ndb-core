import {
  AfterViewInit,
  Component,
  ContentChild,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { DashboardTheme } from "../dashboard-widget/dashboard-widget.component";
import { MatTable, MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { BehaviorSubject } from "rxjs";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { filter, map } from "rxjs/operators";
import { applyUpdate } from "../../entity/model/entity-update";

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
  selector: "app-dashboard-list-widget",
  templateUrl: "./dashboard-list-widget.component.html",
  styleUrls: ["./dashboard-list-widget.component.scss"],
})
export class DashboardListWidgetComponent<E>
  implements OnChanges, AfterViewInit
{
  @Input() subtitle: string;
  @Input() icon: IconName;
  @Input() theme: DashboardTheme;
  @Input() title: string | number;
  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() headline: string;

  /**
   * array of items to be displayed in paginated widget table
   * you can use an observable with async pipe here to let the component automatically handle "loading" indicator.
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
        map((d) => (this.dataMapper ? this.dataMapper(d) : d))
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
      .subscribe((update) =>
        // @ts-ignore
        this.data.next(applyUpdate(this.data.value, update))
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
