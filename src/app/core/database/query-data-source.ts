import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { Entity } from '../entity/entity';
import { Database } from './database';

export class QueryDataSource<T extends Entity> implements DataSource<T> {
  private dataSubject = new BehaviorSubject<T[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

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

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    this.loadData();
    return this.dataSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.dataSubject.complete();
    this.loadingSubject.complete();
  }


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
