import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { EditComponent } from "../../../core/entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { AlertService } from "../../../core/alerts/alert.service";
import { Logging } from "../../../core/logging/logging.service";
import { FileService } from "../file.service";
import { distinctUntilChanged, filter } from "rxjs/operators";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgClass, NgIf } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ErrorHintComponent } from "../../../core/common-components/error-hint/error-hint.component";
import { NotAvailableOfflineError } from "../../../core/session/not-available-offline.error";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { FileFieldConfig } from "../file.datatype";

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
export class EditFileComponent extends EditComponent<string> implements OnInit {
  @ViewChild("fileUpload") fileUploadInput: ElementRef<HTMLInputElement>;
  private selectedFile: File;
  private removeClicked = false;
  initialValue: string;

  /**
   * config for the given form field / entity attribute, containing special settings for this component.
   * (re-declared here for better typing)
   */
  declare additional: FileFieldConfig;

  /**
   * The accepted file types for file selection dialog.
   * If not defined, allows any file.
   */
  acceptedFileTypes: string = "*";

  constructor(
    protected fileService: FileService,
    private alertService: AlertService,
    private entityMapper: EntityMapperService,
    @Inject(NAVIGATOR_TOKEN) protected navigator: Navigator,
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.initialValue = this.formControl.value;

    this.acceptedFileTypes =
      this.additional?.acceptedFileTypes ?? this.acceptedFileTypes;

    this.formControl.statusChanges
      .pipe(
        distinctUntilChanged(),
        filter((change) => change === "DISABLED"),
      )
      .subscribe(() => {
        if (
          this.selectedFile &&
          this.selectedFile.name === this.formControl.value
        ) {
          this.saveNewFile(this.selectedFile);
        } else if (
          this.removeClicked &&
          !this.formControl.value &&
          !!this.initialValue
        ) {
          this.deleteExistingFile();
        } else {
          this.resetFile();
        }
      });
  }

  async onFileSelected(file: File) {
    // directly reset input so subsequent selections with the same name also trigger the change event
    this.fileUploadInput.nativeElement.value = "";
    this.selectedFile = file;
    this.formControl.markAsDirty();
    this.formControl.setValue(file.name);
  }

  protected saveNewFile(file: File) {
    // The maximum file size is set to 5 MB
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
    let errorMessage: string;
    if (err?.status === 413) {
      errorMessage = $localize`:File Upload Error Message:File too large. Usually files up to 5 MB are supported.`;
    } else if (err instanceof NotAvailableOfflineError) {
      errorMessage = $localize`:File Upload Error Message:Changes to file attachments are not available offline.`;
    } else {
      Logging.error("Failed to update file: " + JSON.stringify(err));
      errorMessage = $localize`:File Upload Error Message:Failed to update file attachment. Please try again.`;
    }
    this.alertService.addDanger(errorMessage);

    return this.revertEntityChanges();
  }

  private async revertEntityChanges() {
    // ensure we have latest _rev of entity
    this.entity = await this.entityMapper.load(
      this.entity.getConstructor(),
      this.entity.getId(),
    );

    // Reset entity to how it was before
    this.entity[this.formControlName] = this.initialValue;
    this.formControl.setValue(this.initialValue);

    await this.entityMapper.save(this.entity);

    this.resetFile();
  }

  formClicked() {
    if (this.initialValue && this.formControl.value === this.initialValue) {
      this.showFile();
    } else {
      this.fileUploadInput.nativeElement.click();
    }
  }

  showFile() {
    if (this.initialValue && this.formControl.value === this.initialValue) {
      this.fileService.showFile(this.entity, this.formControlName);
    }
  }

  delete() {
    this.formControl.markAsDirty();
    this.formControl.setValue(undefined);
    this.selectedFile = undefined;
    // remove is only necessary if an initial value was set
    this.removeClicked = true;
  }

  protected deleteExistingFile() {
    this.fileService.removeFile(this.entity, this.formControlName).subscribe({
      error: (err) => this.handleError(err),
      complete: () => {
        this.alertService.addInfo(
          $localize`:Message for user:File "${this.initialValue}" deleted`,
        );
        this.initialValue = undefined;
        this.removeClicked = false;
      },
    });
  }

  protected resetFile() {
    this.selectedFile = undefined;
  }
}
