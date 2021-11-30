import {Component, Injectable, Input, OnInit} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { DataImportService } from "../data-import.service";

@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
@Injectable({
  providedIn: "root",
})
export class DataImportComponent implements OnInit{
  @Input() firstFormGroup: FormGroup;
  @Input() secondFormGroup: FormGroup;

  csvFile: Blob = undefined;

  constructor(
    private dataImportService: DataImportService,
    private _formBuilder: FormBuilder,
    private dynamicEntityService: DynamicEntityService) {}

    ngOnInit() {
      this.firstFormGroup = this._formBuilder.group({
        firstCtrl: ['', Validators.required],
      });
      this.secondFormGroup = this._formBuilder.group({
        secondCtrl: ['', Validators.required],
      });
    }

    getEntitiesMap(): Map<string, EntityConstructor<Entity>> {
      return this.dynamicEntityService.EntityMap;
    }

    setCsvFile(file: File): void {
      this.csvFile = file;
      this.secondFormGroup.setValue({ secondCtrl: file.name});
    }

    async importSelectedFile(): Promise<void> {
      if(this.csvFile === undefined) {
        return;
      }
      await this.dataImportService.handleCsvImport(this.csvFile);
    }

  importCsvFile(file: Blob): Promise<void> {
    return this.dataImportService.handleCsvImport(file);
  }
}
