import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";
import { DataImportService } from "../data-import.service";
import { ImportMetaData } from "../import-meta-data.type";
import { AlertService } from "app/core/alerts/alert.service";
import { MatStepper } from "@angular/material/stepper";
import { ParseResult } from "ngx-papaparse";
import { v4 as uuid } from "uuid";
import { BehaviorSubject } from "rxjs";
import { DownloadDialogService } from "../../../core/export/download-dialog/download-dialog.service";

@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
export class DataImportComponent {
  entityForm = this.formBuilder.group({ entity: ["", Validators.required] });

  fileNameForm = this.formBuilder.group({
    fileName: ["", Validators.required],
  });
  csvFile: ParseResult;

  transactionIDForm = this.formBuilder.group({
    transactionID: [
      "",
      [Validators.required, Validators.pattern("^$|^[A-Fa-f0-9]{8}$")],
    ],
  });

  dateFormatForm = this.formBuilder.group({
    dateFormat: [""],
  });

  columnMappingForm = new FormGroup({});
  properties: string[] = [];
  filteredProperties = new BehaviorSubject<string[]>([]);

  @ViewChild(MatStepper) stepper: MatStepper;

  constructor(
    private dataImportService: DataImportService,
    private formBuilder: FormBuilder,
    public dynamicEntityService: DynamicEntityService,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    private downloadDialogService: DownloadDialogService
  ) {}

  entitySelectionChanged(): void {
    const entityName = this.entityForm.get("entity").value;
    const propertyKeys = this.dynamicEntityService.EntityMap.get(
      entityName
    ).schema.keys();
    this.properties = [...propertyKeys];
    this.csvFile = undefined;
    this.fileNameForm.patchValue({ fileName: "" });
    this.stepper.next();
  }

  async setCsvFile(inputEvent: Event): Promise<void> {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];
    const entityType = this.entityForm.get("entity").value;
    try {
      this.csvFile = await this.loadCSVFile(file, entityType);
      this.fileNameForm.setValue({ fileName: file.name });
      this.columnMappingForm = new FormGroup({});
      this.csvFile.meta.fields.forEach((field) =>
        this.columnMappingForm.addControl(field, new FormControl())
      );
      this.stepper.next();
    } catch (e) {
      this.fileNameForm.setErrors({ fileInvalid: e.message });
    }
    this.changeDetectorRef.detectChanges();
  }

  private async loadCSVFile(file: File, entityType: string) {
    const csvFile = await this.dataImportService.validateCsvFile(file);
    if (csvFile.meta.fields.includes("_id")) {
      const record = csvFile.data[0];
      const [type, id] = record["_id"].split(":") as string[];
      if (type != entityType) {
        throw new Error("Wrong entity type in file");
      }
      this.transactionIDForm.setValue({ transactionID: "" });
      if (id) {
        this.transactionIDForm.disable();
      } else {
        this.transactionIDForm.enable();
      }
    }
    return csvFile;
  }

  setRandomTransactionID() {
    const transactionID = uuid().substr(0, 8);
    this.transactionIDForm.setValue({ transactionID: transactionID });
  }

  processChange(value: string) {
    const usedProperties = Object.values(this.columnMappingForm.getRawValue());
    this.filteredProperties.next(
      this.properties.filter(
        (property) =>
          property.includes(value) && !usedProperties.includes(property)
      )
    );
  }

  importSelectedFile(): Promise<void> {
    if (this.csvFile === undefined) {
      return;
    }
    return this.dataImportService.handleCsvImport(
      this.csvFile,
      this.createImportMetaData()
    );
  }

  private createImportMetaData(): ImportMetaData {
    return {
      transactionId: this.transactionIDForm.get("transactionID").value,
      entityType: this.entityForm.get("entity").value,
      columnMap: this.columnMappingForm.getRawValue(),
      dateFormat: this.dateFormatForm.get("dateFormat").value,
    };
  }

  saveConfig() {
    return this.downloadDialogService.openDownloadDialog(
      this.createImportMetaData(),
      "json",
      "import-config"
    );
  }
}
