import { AfterViewInit, Component, Optional, ViewChild } from "@angular/core";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { QueryDataSource } from "../../core/database/query-data-source";
import { Entity } from "../../core/entity/model/entity";
import { Database } from "../../core/database/database";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { RouteTarget } from "../../app.routing";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { CompareRevComponent } from "../compare-rev/compare-rev.component";

/**
 * List all document conflicts and allow the user to expand for details and manual resolution.
 */
@RouteTarget("ConflictResolution")
@Component({
  selector: "app-conflict-resolution-list",
  templateUrl: "./conflict-resolution-list.component.html",
  imports: [
    NgIf,
    MatProgressBarModule,
    AsyncPipe,
    MatTableModule,
    MatSortModule,
    CompareRevComponent,
    NgForOf,
    MatPaginatorModule,
  ],
  standalone: true,
})
export class ConflictResolutionListComponent implements AfterViewInit {
  /** visible table columns in the template */
  columnsToDisplay = ["id", "data"];

  /** data for the table in the template */
  dataSource: QueryDataSource<Entity>;

  /** reference to mat-table paginator from template, required to set up pagination */
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private db: Database,
    @Optional() private entitySchemaService: EntitySchemaService,
  ) {}

  async ngAfterViewInit() {
    await this.createDatabaseIndexForConflicts();
    this.dataSource = new QueryDataSource(this.db, "conflicts/all");
    this.dataSource.paginator = this.paginator;
  }

  /**
   * Create the database index to query document conflicts, if the index doesn't exist already.
   */
  private createDatabaseIndexForConflicts() {
    const designDoc = {
      _id: "_design/conflicts",
      views: {
        all: {
          map:
            "(doc) => { " +
            "if (doc._conflicts) { emit(doc._conflicts, doc._id); } " +
            "}",
        },
      },
    };

    return this.db.saveDatabaseIndex(designDoc);
  }
}
