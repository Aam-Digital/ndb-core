import { Component } from "@angular/core";
import { EditComponent } from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FileService } from "../file.service";
import { AlertService } from "../../alerts/alert.service";
import { LoggingService } from "../../logging/logging.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

@DynamicComponent("EditFile")
@Component({
  selector: "app-edit-file",
  templateUrl: "./edit-file.component.html",
  styleUrls: ["./edit-file.component.scss"],
})
export class EditFileComponent extends EditComponent<string> {
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
    this.fileService.removeFile(this.entity, this.formControlName).subscribe({
      next: () => {
        this.formControl.setValue(undefined);
        this.alertService.addInfo($localize`:Message for user:File deleted`);
      },
    });
  }
}
