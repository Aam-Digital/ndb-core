import { ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";
import { EntityConstructor } from "app/core/entity/model/entity";
import { DataImportService } from "../data-import.service";
import { v4 as uuid } from "uuid";
import { ImportMetaData } from "../import-meta-data.type";
import { AlertService } from "app/core/alerts/alert.service";
import { Alert } from "app/core/alerts/alert";
import { AlertDisplay } from "app/core/alerts/alert-display";
import { CsvValidationStatus } from "../csv-validation-status.enum";
import { MatStepper } from "@angular/material/stepper";

@Component({
  selector: "app-data-import",
  templateUrl: "./data-import.component.html",
  styleUrls: ["./data-import.component.scss"],
})
export class DataImportComponent implements OnInit {
  entityForm = this.formBuilder.group({ entity: ["", Validators.required] });
  fileNameForm = this.formBuilder.group({
    fileName: ["", Validators.required],
  });
  transactionIDForm = this.formBuilder.group({
    transactionID: ["", Validators.pattern("^$|^[A-Fa-f0-9]{8}$")],
  });

  csvFile: Blob = undefined;
  transactionId: string = "";

  entitiesMap: Map<string, EntityConstructor>;

  @ViewChild(MatStepper) stepper: MatStepper;

  constructor(
    private dataImportService: DataImportService,
    private formBuilder: FormBuilder,
    private dynamicEntityService: DynamicEntityService,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.entitiesMap = this.dynamicEntityService.EntityMap;
  }

  get hasValidFile(): boolean {
    return this.csvFile !== undefined;
  }

  get hasTransactionId(): boolean {
    return this.transactionId !== "";
  }

  entitySelectionChanged(): void {
    // whenever the selection changes, the file can't be valid (if there was one)
    this.csvFile = undefined;
    this.fileNameForm.patchValue({ fileName: "" });
    this.stepper.next();
  }

  async setCsvFile(inputEvent: Event): Promise<void> {
    const target = inputEvent.target as HTMLInputElement;
    const file = target.files[0];
    const entityType = this.entityForm.get("entity").value;
    const csvValidationResult = await this.dataImportService.validateCsvFile(
      file,
      entityType
    );

    if (csvValidationResult.status !== CsvValidationStatus.Valid) {
      this.csvFile = undefined;
      this.fileNameForm.patchValue({ fileName: "" });

      this.alertService.addAlert(
        new Alert(
          csvValidationResult.message,
          Alert.DANGER,
          AlertDisplay.TEMPORARY
        )
      );
    } else {
      this.csvFile = file;
      this.fileNameForm.setValue({ fileName: file.name });
      this.stepper.next();
      this.changeDetectorRef.detectChanges();
    }
  }

  async importSelectedFile(): Promise<void> {
    if (this.csvFile === undefined) {
      return;
    }

    // use transaction id or generate a new one
    const transIdCtrl = this.transactionIDForm.get("transactionID");
    if (transIdCtrl.valid) {
      this.transactionId = transIdCtrl.value;
    } else {
      this.transactionId = uuid().substring(0, 8);
      this.transactionIDForm.patchValue({
        transactionID: this.transactionId,
      });
    }

    const entityType = this.entityForm.get("entity").value;

    const importMeta: ImportMetaData = {
      transactionId: this.transactionId,
      entityType: entityType,
    };

    await this.dataImportService.handleCsvImport(this.csvFile, importMeta);
  }
}
