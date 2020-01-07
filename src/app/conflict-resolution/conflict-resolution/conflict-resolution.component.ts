import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { QueryDataSource } from '../../core/database/query-data-source';
import { Entity } from '../../core/entity/entity';
import { Database } from '../../core/database/database';


/**
 * List all document conflicts and allow the user to expand for details and manual resolution.
 */
@Component({
  selector: 'app-conflict-resolution',
  templateUrl: './conflict-resolution.component.html',
  styleUrls: ['./conflict-resolution.component.scss'],
})
export class ConflictResolutionComponent implements OnInit, AfterViewInit {
  columnsToDisplay = [ 'id', 'data' ];
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: QueryDataSource<Entity>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private db: Database,
  ) { }

  async ngOnInit() {
  }

  async ngAfterViewInit() {
    await this.createConflictView();
    this.dataSource = new QueryDataSource(this.db, 'conflicts/all');
    this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
  }


  private createConflictView() {
    const designDoc = {
      _id: '_design/conflicts',
      views: {
        all: {
          map: '(doc) => { ' +
            'if (doc._conflicts) { emit(doc._conflicts, doc._id); } ' +
            '}',
        },
      },
    };

    return this.db.saveDatabaseIndex(designDoc);
  }

  stringify(entity: any) {
    return JSON.stringify(entity);
  }
}
