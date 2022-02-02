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
import { readFile } from "../../../utils/utils";

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
    transactionId: [
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

  async setCsvFile(inputEvent: Event): Promise<void> {
    const file = this.getSelectedFile(inputEvent);
    try {
      this.csvFile = await this.loadCSVFile(file);
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

  private getSelectedFile(inputEvent: Event) {
    const target = inputEvent.target as HTMLInputElement;
    return target.files[0];
  }

  private async loadCSVFile(file: File) {
    const csvFile = await this.dataImportService.validateCsvFile(file);
    if (csvFile.meta.fields.includes("_id")) {
      const record = csvFile.data[0];
      const [type, id] = record["_id"].split(":") as string[];
      this.entityForm.patchValue({ entity: type });
      this.entityForm.disable();
      this.entitySelectionChanged();
      this.transactionIDForm.patchValue({ transactionID: "" });
      if (id) {
        this.transactionIDForm.disable();
      } else {
        this.transactionIDForm.enable();
      }
    } else {
      this.entityForm.enable();
      this.transactionIDForm.enable();
    }
    return csvFile;
  }

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

  setRandomTransactionID() {
    const transactionID = uuid().substr(0, 8);
    this.transactionIDForm.setValue({ transactionId: transactionID });
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
      transactionId: this.transactionIDForm.get("transactionId").value,
      entityType: this.entityForm.get("entity").value,
      columnMap: this.columnMappingForm.getRawValue(),
      dateFormat: this.dateFormatForm.get("dateFormat").value,
    };
  }

  async loadConfig(inputEvent: Event) {
    const file = this.getSelectedFile(inputEvent);
    const fileContent = await readFile(file);
    const importMeta = JSON.parse(fileContent) as ImportMetaData;
    this.patchIfPossible(this.entityForm, { entity: importMeta.entityType });
    this.patchIfPossible(this.transactionIDForm, {
      transactionId: importMeta.transactionId,
    });
    this.patchIfPossible(this.dateFormatForm, {
      dateFormat: importMeta.dateFormat,
    });
    this.patchIfPossible(this.columnMappingForm, importMeta.columnMap);
  }

  private patchIfPossible(form: FormGroup, patch: { [key in string]: any }) {
    if (form.enabled) {
      form.patchValue(patch);
      console.log("form", form, patch);
    }
  }

  saveConfig() {
    return this.downloadDialogService.openDownloadDialog(
      this.createImportMetaData(),
      "json",
      "import-config"
    );
  }
}
