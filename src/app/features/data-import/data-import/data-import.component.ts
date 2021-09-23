import { Component, Injectable, OnInit } from '@angular/core';
import {DataImportService} from "../data-import.service";

@Component({
  selector: 'app-data-import',
  templateUrl: './data-import.component.html',
  styleUrls: ['./data-import.component.scss']
})
@Injectable({
  providedIn: "root",
})
export class DataImportComponent implements OnInit {

  constructor(
    private dataImportService: DataImportService
  ) {  }

  ngOnInit(): void {
  }

  importCsvFile(file: Blob): void {
    this.dataImportService.loadCsv(file);
  }
}
