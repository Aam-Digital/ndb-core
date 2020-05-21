import { AfterViewInit, Component, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { QueryDataSource } from "../../core/database/query-data-source";
import { Entity } from "../../core/entity/entity";
import { Database } from "../../core/database/database";

/**
 * List all document conflicts and allow the user to expand for details and manual resolution.
 */
@Component({
  selector: "app-conflict-resolution",
  templateUrl: "./conflict-resolution.component.html",
  styleUrls: ["./conflict-resolution.component.scss"],
})
export class ConflictResolutionComponent implements AfterViewInit {
  /** visible table columns in the template */
  columnsToDisplay = ["id", "data"];

  /** data for the table in the template */
  dataSource: QueryDataSource<Entity>;

  /** reference to mat-table paginator from template, required to set up pagination */
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(private db: Database) {}

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
