import { Component } from "@angular/core";
import { ParsedData } from "../../data-import/input-file/input-file.component";

@Component({
  selector: "app-import-select-file",
  templateUrl: "./import-select-file.component.html",
  styleUrls: ["./import-select-file.component.scss"],
})
export class ImportSelectFileComponent {
  loadData(parsedData: ParsedData) {}
}
