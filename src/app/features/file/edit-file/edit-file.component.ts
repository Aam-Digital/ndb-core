import { Component, ElementRef, ViewChild } from "@angular/core";
import { EditComponent } from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { AlertService } from "../../../core/alerts/alert.service";
import { LoggingService } from "../../../core/logging/logging.service";
import { FileService } from "../file.service";
import { distinctUntilChanged, filter } from "rxjs/operators";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgClass, NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ErrorHintComponent } from "../../../core/entity-components/entity-utils/error-hint/error-hint.component";

/**
 * This component should be used as a `editComponent` when a property should store files.
 * It allows to show, upload and remove files.
 */
@DynamicComponent("EditFile")
@Component({
  selector: "app-edit-file",
  templateUrl: "./edit-file.component.html",
  styleUrls: ["./edit-file.component.scss"],
  imports: [
    MatFormFieldModule,
    NgClass,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltipModule,
    NgIf,
    MatButtonModule,
    FontAwesomeModule,
    ErrorHintComponent,
  ],
  standalone: true,
})
export class EditFileComponent extends EditComponent<string> {
  @ViewChild("fileUpload") fileInput: ElementRef<HTMLInputElement>;
  private selectedFile: File;
  private removeClicked = false;
  private initialValue: string;

  constructor(
    protected fileService: FileService,
    private alertService: AlertService,
    private logger: LoggingService,
    private entityMapper: EntityMapperService
  ) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.initialValue = this.formControl.value;
    this.formControl.statusChanges
      .pipe(
        distinctUntilChanged(),
        filter((change) => change === "DISABLED")
      )
      .subscribe(() => {
        if (
          this.selectedFile &&
          this.selectedFile.name === this.formControl.value
        ) {
          this.saveNewFile(this.selectedFile);
        } else if (this.removeClicked && !this.formControl.value) {
          this.deleteExistingFile();
        } else {
          this.resetFile();
        }
      });
  }

  async onFileSelected(file: File) {
    // directly reset input so subsequent selections with the same name also trigger the change event
    this.fileInput.nativeElement.value = "";
    this.selectedFile = file;
    this.formControl.setValue(file.name);
  }

  protected saveNewFile(file: File) {
    // The maximum file size which can be processed by CouchDB before a timeout is around 200mb
    this.fileService
      .uploadFile(file, this.entity, this.formControlName)
      .subscribe({
        error: (err) => this.handleError(err),
        complete: () => {
          this.initialValue = this.formControl.value;
          this.selectedFile = undefined;
        },
      });
  }

  private handleError(err) {
    this.logger.error("Failed uploading file: " + JSON.stringify(err));
    this.alertService.addDanger("Could not upload file, please try again.");
    // Reset entity to how it was before
    this.entity[this.formControlName] = this.initialValue;
    this.formControl.setValue(this.initialValue);
    return this.entityMapper.save(this.entity);
  }

  formClicked() {
    if (this.formControl.disabled) {
      this.fileClicked();
    }
  }

  fileClicked() {
    if (this.initialValue && this.formControl.value === this.initialValue) {
      this.fileService.showFile(this.entity, this.formControlName);
    }
  }

  delete() {
    this.formControl.setValue(null);
    this.selectedFile = undefined;
    // remove is only necessary if an initial value was set
    this.removeClicked = !!this.initialValue;
  }

  protected deleteExistingFile() {
    this.fileService
      .removeFile(this.entity, this.formControlName)
      .subscribe(() => {
        this.alertService.addInfo(
          $localize`:Message for user:File "${this.initialValue}" deleted`
        );
        this.initialValue = undefined;
        this.removeClicked = false;
      });
  }

  protected resetFile() {
    this.selectedFile = undefined;
  }
}
