import { Component, ElementRef, ViewChild } from "@angular/core";
import { EditComponent } from "../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { AlertService } from "../../../core/alerts/alert.service";
import { LoggingService } from "../../../core/logging/logging.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { FileService } from "../file.service";

/**
 * This component should be used as a `editComponent` when a property should store files.
 * It allows to show, upload and remove files.
 */
@DynamicComponent("EditFile")
@Component({
  selector: "app-edit-file",
  templateUrl: "./edit-file.component.html",
  styleUrls: ["./edit-file.component.scss"],
})
export class EditFileComponent extends EditComponent<string> {
  @ViewChild("fileUpload") fileInput: ElementRef<HTMLInputElement>;

  constructor(
    private fileService: FileService,
    private alertService: AlertService,
    private logger: LoggingService,
    private confirmationDialog: ConfirmationDialogService
  ) {
    super();
  }

  async onFileSelected(event) {
    const file: File = event.target.files[0];
    // directly reset input so subsequent selections with the same name also trigger the change event
    this.fileInput.nativeElement.value = "";

    if (this.formControl.value) {
      const shouldReplace = await this.confirmationDialog.getConfirmation(
        $localize`Replacing file`,
        $localize`Do you want to replace the file "${this.formControl.value}" with "${file.name}"?`
      );
      if (!shouldReplace) {
        return;
      }
    }

    // The maximum file size which can be processed by CouchDB before a timeout is around 200mb
    this.fileService
      .uploadFile(file, this.entity, this.formControlName)
      .subscribe({
        error: (err) => this.handleError(err),
        complete: () => this.formControl.setValue(file.name),
      });
  }

  private handleError(err) {
    this.logger.error("Failed uploading file: " + JSON.stringify(err));
    this.alertService.addDanger("Could not upload file, please try again.");
  }

  formClicked() {
    if (this.formControl.disabled) {
      this.fileClicked();
    }
  }

  fileClicked() {
    if (this.formControl.value) {
      this.fileService.showFile(this.entity, this.formControlName);
    }
  }

  async delete() {
    const shouldDelete = await this.confirmationDialog.getConfirmation(
      $localize`Deleting file`,
      $localize`Do you want to delete the file "${this.formControl.value}"?`
    );
    if (!shouldDelete) {
      return;
    }
    this.fileService
      .removeFile(this.entity, this.formControlName)
      .subscribe(() => {
        this.formControl.setValue(undefined);
        this.alertService.addInfo($localize`:Message for user:File deleted`);
      });
  }
}
