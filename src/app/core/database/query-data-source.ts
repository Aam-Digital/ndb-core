import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { BehaviorSubject, Observable } from "rxjs";
import { MatPaginator } from "@angular/material/paginator";
import { Entity } from "../entity/model/entity";
import { Database } from "./database";

/**
 * Implementation of a datasource that directly queries an index on the {@link Database}
 * supporting optional pagination to only load a subset of the data as required by a paginator.
 *
 * An instance of QueryDataSource can be created and used as source for a mat-table component.
 *
 * also see https://material.angular.io/cdk/table/overview#connecting-the-table-to-a-data-source
 * and https://medium.com/angular-in-depth/angular-material-pagination-datasource-73080d3457fe
 */
export class QueryDataSource<T extends Entity> implements DataSource<T> {
  /** internal observable to emit new result data. This is provided to users calling .connect() */
  private dataSubject = new BehaviorSubject<T[]>([]);

  /** internal observable to emit new loading status. This is provided to users through the public .loading$ */
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /** Indicates whether the datasource is currently loading new data */
  public loading$ = this.loadingSubject.asObservable();

  private _paginator: MatPaginator | null;
  get paginator(): MatPaginator | null {
    return this._paginator;
  }
  set paginator(value: MatPaginator | null) {
    this._paginator = value;

    if (this.paginator) {
      this.paginator.page.subscribe(() => this.loadData());
      this.loadData();
    }
  }

  constructor(
    private database: Database,
    private queryName: string,
  ) {}

  /**
   * Connect to the datasource and receive an observable to subscribe to loaded data.
   * Whenever pagination is changed this will emit new datasets.
   * @param collectionViewer (not necessary)
   */
  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    this.loadData();
    return this.dataSubject.asObservable();
  }

  /**
   * Disconnect and discard open observables for this datasource.
   * @param collectionViewer (not necessary)
   */
  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
    this.loadingSubject.complete();
  }

  /**
   * (re)load data from the database for the given query and (if set) to current pagination values.
   */
  async loadData() {
    this.loadingSubject.next(true);

    const options: any = {
      include_docs: true,
    };
    if (this.paginator) {
      options.limit = this.paginator.pageSize;
      options.skip = this.paginator.pageIndex * this.paginator.pageSize;
    }

    const results = await this.database.query(this.queryName, options);

    this.paginator.length = results.total_rows;
    this.dataSubject.next(results.rows);

    this.loadingSubject.next(false);
  }
}
