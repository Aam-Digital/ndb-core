import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";
import { DataImportService } from "../data-import.service";
import { ImportMetaData } from "../import-meta-data.type";
import { AlertService } from "app/core/alerts/alert.service";
import { MatStepper } from "@angular/material/stepper";
import { ParseResult } from "ngx-papaparse";
import { v4 as uuid } from "uuid";
import { BehaviorSubject } from "rxjs";

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
  transactionIDForm = this.formBuilder.group({
    transactionID: [
      "",
      [Validators.required, Validators.pattern("^$|^[A-Fa-f0-9]{8}$")],
    ],
  });
  dateFormatForm = this.formBuilder.group({
    dateFormat: [""],
  });

  csvFile: ParseResult;
  columnMap: { [key in string]: string };
  properties: string[] = [];
  filteredProperties = new BehaviorSubject<string[]>([]);

  @ViewChild(MatStepper) stepper: MatStepper;

  constructor(
    private dataImportService: DataImportService,
    private formBuilder: FormBuilder,
    public dynamicEntityService: DynamicEntityService,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef
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
      this.columnMap = {};
      this.csvFile.meta.fields.forEach((field) => (this.columnMap[field] = ""));
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
    const usedProperties = Object.values(this.columnMap);
    this.filteredProperties.next(
      this.properties.filter(
        (property) =>
          property.includes(value) && !usedProperties.includes(property)
      )
    );
  }

  selectProperty(columnName: string, property: string) {
    this.processChange("");
    if (this.filteredProperties.value.includes(property)) {
      this.columnMap[columnName] = property;
    } else {
      this.columnMap[columnName] = "";
    }
  }

  async importSelectedFile(): Promise<void> {
    if (this.csvFile === undefined) {
      return;
    }

    // TODO give option to save this as a file together with option to import
    const importMeta: ImportMetaData = {
      transactionId: this.transactionIDForm.get("transactionID").value,
      entityType: this.entityForm.get("entity").value,
      columnMap: this.columnMap,
      dateFormat: this.dateFormatForm.get("dateFormat").value,
    };

    await this.dataImportService.handleCsvImport(this.csvFile, importMeta);
  }
}
