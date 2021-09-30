import { Component, Injectable } from "@angular/core";
import { DataImportService } from "../data-import.service";

@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
@Injectable({
  providedIn: "root",
})
export class DataImportComponent {
  constructor(private dataImportService: DataImportService) {}

  importCsvFile(file: Blob): void {
    this.dataImportService.handleCsvImport(file);
  }
}
