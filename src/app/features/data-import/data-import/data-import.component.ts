import { Component, Injectable, Input, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { DataImportService } from "../data-import.service";
import { v4 as uuid } from "uuid";

@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
@Injectable({
  providedIn: "root",
})
export class DataImportComponent implements OnInit {
  @Input() firstFormGroup: FormGroup;
  @Input() secondFormGroup: FormGroup;
  @Input() thirdFormGroup: FormGroup;

  csvFile: Blob = undefined;
  transactionId: string = '';

  constructor(
    private dataImportService: DataImportService,
    private _formBuilder: FormBuilder,
    private dynamicEntityService: DynamicEntityService
  ) {}

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ["", Validators.required],
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ["", Validators.required],
    });
    this.thirdFormGroup = this._formBuilder.group({
      thirdCtrl: ["", [Validators.required, Validators.pattern('^$|^[A-Za-z0-9]{8}$')]],
    })
  }

  getEntitiesMap(): Map<string, EntityConstructor<Entity>> {
    return this.dynamicEntityService.EntityMap;
  }

  get hasValidFile(): boolean {
    return this.csvFile !== undefined;
  }

  entitySelectionChanged(): void {
    // whenver the selection changes, the file can't be valid (if there was one)
    this.csvFile = undefined;
    this.secondFormGroup.setValue({ secondCtrl: "" });
  }

  async setCsvFile(inputEvent: Event): Promise<void> {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];
    const entityType = this.firstFormGroup.get("firstCtrl").value;
    const isValidCsv = await this.dataImportService.validateCsvFile(
      file,
      entityType
    );

    if (!isValidCsv) {
      this.csvFile = undefined;
      this.secondFormGroup.setValue({ secondCtrl: "" });
    } else {
      this.csvFile = file;
      this.secondFormGroup.setValue({ secondCtrl: file.name });
    }
  }

  async importSelectedFile(): Promise<void> {
    if (this.csvFile === undefined) {
      return Promise.resolve(undefined);
    }

    // use transaction id or generate a new one
    const transIdCtrl = this.thirdFormGroup.get("thirdCtrl");
    if (transIdCtrl.valid) {
      this.transactionId = transIdCtrl.value;
    } else {
      this.transactionId = uuid().substring(0, 8);
      this.thirdFormGroup.setValue({ thirdCtrl: this.transactionId});
    }

    await this.dataImportService.handleCsvImport(this.csvFile, this.transactionId);
  }
}
