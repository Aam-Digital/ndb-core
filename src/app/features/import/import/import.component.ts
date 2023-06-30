import { Component } from "@angular/core";
import { RouteTarget } from "../../../app.routing";

/**
 * View providing a full UI workflow to import data from an uploaded file.
 */
@RouteTarget("Import")
@Component({
  selector: "app-import",
  templateUrl: "./import.component.html",
  styleUrls: ["./import.component.scss"],
})
export class ImportComponent {}
