import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormRecord,
  Validators,
} from "@angular/forms";
import { DataImportService } from "../data-import.service";
import { ImportColumnMap, ImportMetaData } from "../import-meta-data.type";
import { AlertService } from "app/core/alerts/alert.service";
import { MatStepper } from "@angular/material/stepper";
import { ParseResult } from "ngx-papaparse";
import { v4 as uuid } from "uuid";
import { BehaviorSubject } from "rxjs";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { readFile } from "../../../utils/utils";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { RouteTarget } from "../../../app.routing";

@RouteTarget("Import")
@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
export class DataImportComponent {
  fileNameForm = this.formBuilder.group({
    fileName: ["", Validators.required],
  });
  private csvFile: ParseResult;

  entityForm = this.formBuilder.group({ entity: ["", Validators.required] });

  transactionIDForm = this.formBuilder.group({
    transactionId: [
      "",
      [Validators.required, Validators.pattern("^$|^[A-Fa-f0-9]{8}$")],
    ],
  });

  dateFormatForm = this.formBuilder.group({
    dateFormat: [""],
  });

  columnMappingForm = new FormRecord<FormControl<string>>({});
  private properties: string[] = [];
  filteredProperties = new BehaviorSubject<string[]>([]);

  @ViewChild(MatStepper) private stepper: MatStepper;

  constructor(
    private dataImportService: DataImportService,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    private downloadService: DownloadService,
    public entities: EntityRegistry
  ) {}

  // TODO add supported types for file select
  async setCsvFile(inputEvent: Event): Promise<void> {
    const file = this.getSelectedFile(inputEvent);
    try {
      this.csvFile = await this.loadCSVFile(file);
      this.fileNameForm.setValue({ fileName: file.name });
      this.columnMappingForm = new FormRecord<FormControl<string>>({});
      this.csvFile.meta.fields.forEach((field) =>
        this.columnMappingForm.addControl(field, new FormControl())
      );
      this.entitySelectionChanged();
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
    this.entityForm.enable();
    this.transactionIDForm.enable();
    const csvFile = await this.dataImportService.validateCsvFile(file);
    if (csvFile.meta.fields.includes("_id") && csvFile.data[0]["_id"]) {
      const record = csvFile.data[0] as { _id: string };
      if (record._id.includes(":")) {
        const type = record["_id"].split(":")[0] as string;
        this.entityForm.patchValue({ entity: type });
        this.entityForm.disable();
      }
      this.transactionIDForm.patchValue({ transactionId: "" });
      this.transactionIDForm.disable();
    }
    return csvFile;
  }

  entitySelectionChanged(): void {
    const entityName = this.entityForm.get("entity").value;
    const propertyKeys = this.entities.get(entityName).schema.keys();
    this.properties = [...propertyKeys];

    this.inferColumnPropertyMapping();

    this.stepper.next();
  }

  /**
   * Try to guess mappings of import file columns to entity properties.
   * (e.g. based on column headers)
   * @private
   */
  private inferColumnPropertyMapping() {
    const columnMap: ImportColumnMap = {};

    for (const p of this.properties) {
      if (this.csvFile.meta.fields.includes(p)) {
        columnMap[p] = p;
      }
    }

    this.loadColumnMapping(columnMap);
  }

  setRandomTransactionID() {
    const transactionID = uuid().substr(0, 8);
    this.transactionIDForm.setValue({ transactionId: transactionID });
  }

  processChange(value: string) {
    const usedProperties = Object.values(this.columnMappingForm.getRawValue() as { [key: string]: string });
    this.filteredProperties.next(
      this.properties.filter(
        (property) =>
          property.toLowerCase().includes(value.toLowerCase()) &&
          !usedProperties.includes(property)
      )
    );
  }

  importSelectedFile(): Promise<void> {
    if (this.csvFile) {
      return this.dataImportService.handleCsvImport(
        this.csvFile,
        this.createImportMetaData()
      );
    }
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
    this.entitySelectionChanged();
    this.patchIfPossible(this.transactionIDForm, {
      transactionId: importMeta.transactionId,
    });
    this.patchIfPossible(this.dateFormatForm, {
      dateFormat: importMeta.dateFormat,
    });

    this.loadColumnMapping(importMeta.columnMap);
  }

  private loadColumnMapping(columnMap: ImportColumnMap) {
    const combinedMap = Object.assign(
      this.columnMappingForm.getRawValue(),
      columnMap
    );
    this.patchIfPossible(this.columnMappingForm, combinedMap);
  }

  private patchIfPossible(form: FormGroup, patch: { [key in string]: any }) {
    if (form.enabled) {
      form.patchValue(patch);
    }
  }

  saveConfig() {
    return this.downloadService.triggerDownload(
      this.createImportMetaData(),
      "json",
      "import-config"
    );
  }
}
