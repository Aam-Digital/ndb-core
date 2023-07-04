import { Component, ViewChild } from "@angular/core";
import { RouteTarget } from "../../../app.routing";
import { ParsedData } from "../../data-import/input-file/input-file.component";
import { MatStepper } from "@angular/material/stepper";
import { ColumnMapping } from "../column-mapping";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
@RouteTarget("Import")
@Component({
  selector: "app-import",
  templateUrl: "./import.component.html",
  styleUrls: ["./import.component.scss"],
})
export class ImportComponent {
  rawData: ParsedData<any>;
  entityType: string;
  columnMapping: ColumnMapping[];

  @ViewChild(MatStepper) stepper: MatStepper;

  reset() {
    delete this.rawData;
    delete this.entityType;
    delete this.columnMapping;
    // TODO: properly reset the data in the sub-step components like import-file
    this.stepper.reset();
  }

  onDataLoaded(data: ParsedData<any>) {
    this.rawData = data;

    // trigger next step automatically after change detection ran and recognized the current step as [completed]
    setTimeout(() => this.stepper.next());
  }
}
