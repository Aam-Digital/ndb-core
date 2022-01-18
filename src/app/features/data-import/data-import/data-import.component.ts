import { Component, Injectable, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { DataImportService } from "../data-import.service";
import { v4 as uuid } from "uuid";
import { ImportMetaData } from "../import-meta-data.type";
import { AlertService } from "app/core/alerts/alert.service";
import { Alert } from "app/core/alerts/alert";
import { AlertDisplay } from "app/core/alerts/alert-display";
import { CsvValidationStatus } from "../csv-validation-status.enum";

@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
@Injectable({
  providedIn: "root",
})
export class DataImportComponent implements OnInit {
  entitySelectionFormGroup: FormGroup;
  fileSelectionFormGroup: FormGroup;
  transactionIdFormGroup: FormGroup;

  csvFile: Blob = undefined;
  transactionId: string = "";

  entitiesMap: Map<string, EntityConstructor<Entity>>;

  constructor(
    private dataImportService: DataImportService,
    private formBuilder: FormBuilder,
    private dynamicEntityService: DynamicEntityService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.entitiesMap = this.dynamicEntityService.EntityMap;

    this.entitySelectionFormGroup = this.formBuilder.group({
      entitySelectionCtrl: ["", Validators.required],
    });
    this.fileSelectionFormGroup = this.formBuilder.group({
      fileNameCtrl: [{ value: "", disabled: true }, Validators.required],
    });
    this.transactionIdFormGroup = this.formBuilder.group({
      transactionIdInputCtrl: [
        "",
        [Validators.required, Validators.pattern("^$|^[A-Fa-f0-9]{8}$")],
      ],
    });
  }

  get hasValidFile(): boolean {
    return this.csvFile !== undefined;
  }

  get hasTransactionId(): boolean {
    return this.transactionId !== "";
  }

  entitySelectionChanged(): void {
    // whenver the selection changes, the file can't be valid (if there was one)
    this.csvFile = undefined;
    this.fileSelectionFormGroup.setValue({ fileNameCtrl: "" });
  }

  async setCsvFile(inputEvent: Event): Promise<void> {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];
    const entityType = this.entitySelectionFormGroup.get("entitySelectionCtrl")
      .value;
    const csvValidationResult = await this.dataImportService.validateCsvFile(
      file,
      entityType
    );

    if (csvValidationResult.status !== CsvValidationStatus.Valid) {
      this.csvFile = undefined;
      this.fileSelectionFormGroup.setValue({ fileNameCtrl: "" });

      this.alertService.addAlert(
        new Alert(
          csvValidationResult.message,
          Alert.DANGER,
          AlertDisplay.TEMPORARY
        )
      );
    } else {
      this.csvFile = file;
      this.fileSelectionFormGroup.setValue({ fileNameCtrl: file.name });
    }
  }

  async importSelectedFile(): Promise<void> {
    if (this.csvFile === undefined) {
      return;
    }

    // use transaction id or generate a new one
    const transIdCtrl = this.transactionIdFormGroup.get(
      "transactionIdInputCtrl"
    );
    if (transIdCtrl.valid) {
      this.transactionId = transIdCtrl.value;
    } else {
      this.transactionId = uuid().substring(0, 8);
      this.transactionIdFormGroup.setValue({
        transactionIdInputCtrl: this.transactionId,
      });
    }

    const entityType = this.entitySelectionFormGroup.get("entitySelectionCtrl")
      .value;

    const importMeta: ImportMetaData = {
      transactionId: this.transactionId,
      entityType: entityType,
    };

    await this.dataImportService.handleCsvImport(this.csvFile, importMeta);
  }
}
