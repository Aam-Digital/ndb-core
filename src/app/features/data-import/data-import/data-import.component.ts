import { ChangeDetectorRef, Component } from "@angular/core";
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { DataImportService } from "../data-import.service";
import { ImportColumnMap, ImportMetaData } from "../import-meta-data.type";
import { AlertService } from "app/core/alerts/alert.service";
import { v4 as uuid } from "uuid";
import { BehaviorSubject } from "rxjs";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { RouteTarget } from "../../../app.routing";
import { Entity } from "app/core/entity/model/entity";
import {
  InputFileComponent,
  ParsedData,
} from "../input-file/input-file.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { AsyncPipe, KeyValuePipe, NgForOf, NgIf } from "@angular/common";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import * as _ from "lodash";

@RouteTarget("Import")
@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    KeyValuePipe,
    MatExpansionModule,
    MatInputModule,
    MatButtonModule,
    NgIf,
    NgForOf,
    MatAutocompleteModule,
    AsyncPipe,
    InputFileComponent,
  ],
  standalone: true,
})
export class DataImportComponent {
  importData: ParsedData;
  readyForImport: boolean;

  entityForm = new FormControl("", [Validators.required]);

  transactionIDForm = new FormControl("", [
    Validators.required,
    Validators.pattern("^$|^[A-Fa-f0-9]{8}$"),
  ]);

  dateFormatForm = new FormControl("YYYY-MM-DD");

  columnMap: { [key: string]: { key: string; label: string } } = {};
  private properties: { label: string; key: string }[] = [];
  filteredProperties = new BehaviorSubject<{ label: string; key: string }[]>(
    []
  );

  constructor(
    private dataImportService: DataImportService,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    private downloadService: DownloadService,
    public entities: EntityRegistry
  ) {}

  async loadData(parsedData: ParsedData): Promise<void> {
    this.importData = parsedData;

    this.entityForm.enable();
    this.transactionIDForm.enable();

    this.updateConfigFromDataIds();

    this.updateColumnMappingFromData();

    this.entitySelectionChanged();
  }

  /**
   * Check if new data contains _id and infer config options.
   * @private
   */
  private updateConfigFromDataIds() {
    if (
      this.importData?.fields.includes("_id") &&
      this.importData?.data[0]["_id"]
    ) {
      const record = this.importData.data[0] as { _id: string };
      if (record._id.toString().includes(":")) {
        const type = Entity.extractTypeFromId(record["_id"]);
        this.entityForm.patchValue(type);
        this.entityForm.disable();
      }
      this.transactionIDForm.patchValue("");
      this.transactionIDForm.disable();
    }
  }

  private updateColumnMappingFromData() {
    this.columnMap = this.importData.fields.reduce(
      (obj, col) => Object.assign(obj, { [col]: undefined }),
      {}
    );
  }

  entitySelectionChanged(): void {
    const entityName = this.entityForm.value;
    if (!entityName) {
      return;
    }

    const propertyKeys = this.entities.get(entityName).schema.entries();
    this.properties = [...propertyKeys].map(([key, { label }]) => ({
      key,
      label: label ?? key,
    }));

    this.inferColumnPropertyMapping();

    this.readyForImport = !!entityName && !!this.importData;
  }

  /**
   * Try to guess mappings of import file columns to entity properties.
   * (e.g. based on column headers)
   * @private
   */
  private inferColumnPropertyMapping() {
    const columnMap: ImportColumnMap = {};

    for (const p of this.properties) {
      const match = this.importData?.fields.find(
        (f) => f === p.label || f === p.key
      );
      if (match) {
        columnMap[match] = p;
      }
    }

    this.loadColumnMapping(columnMap);
  }

  setRandomTransactionID() {
    const transactionID = uuid().substring(0, 8);
    this.transactionIDForm.setValue(transactionID);
  }

  processChange(selected: string, value: string) {
    const usedProperties = Object.values(this.columnMap)
      .filter((col) => !!col)
      .map(({ key }) => key);
    this.filteredProperties.next(
      this.properties.filter(
        ({ key, label }) =>
          (label ?? key).toLowerCase().includes(value.toLowerCase()) &&
          (key === selected || !usedProperties.includes(key))
      )
    );
  }

  selectOption(input: string, col: string) {
    if (!this.properties.some(({ label }) => input === label)) {
      if (this.filteredProperties.value.length === 1) {
        this.columnMap[col] = this.filteredProperties.value[0];
      } else {
        this.columnMap[col] = undefined;
      }
    }
  }

  importSelectedFile(): Promise<void> {
    if (this.importData) {
      return this.dataImportService.handleCsvImport(
        this.importData.data,
        this.createImportMetaData()
      );
    }
  }

  private createImportMetaData(): ImportMetaData {
    return {
      transactionId: this.transactionIDForm.value,
      entityType: this.entityForm.value,
      columnMap: this.columnMap,
      dateFormat: this.dateFormatForm.value,
    };
  }

  async loadConfig(loadedConfig: ParsedData<ImportMetaData>) {
    const importMeta = loadedConfig.data;
    this.patchIfPossible(this.entityForm, importMeta.entityType);
    this.entitySelectionChanged();
    this.patchIfPossible(this.transactionIDForm, importMeta.transactionId);
    this.patchIfPossible(this.dateFormatForm, importMeta.dateFormat);

    this.loadColumnMapping(importMeta.columnMap);
  }

  private loadColumnMapping(columnMap: ImportColumnMap) {
    Object.assign(
      this.columnMap,
      _.pick(columnMap, Object.keys(this.columnMap))
    );
  }

  private patchIfPossible<T>(form: AbstractControl<T>, patch: T) {
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
