import { Component } from "@angular/core";
import { EditComponent } from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { FileService } from "../file.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpEventType } from "@angular/common/http";
import { ProgressSpinnerMode } from "@angular/material/progress-spinner";
import { AlertService } from "../../alerts/alert.service";
import { LoggingService } from "../../logging/logging.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

@DynamicComponent("edit-file")
@Component({
  selector: "app-edit-file",
  templateUrl: "./edit-file.component.html",
  styleUrls: ["./edit-file.component.scss"],
})
export class EditFileComponent extends EditComponent<string> {
  uploadProgress: number;
  mode: ProgressSpinnerMode = "determinate";
  done = false;

  constructor(
    private fileService: FileService,
    private entityMapper: EntityMapperService,
    private alertService: AlertService,
    private logger: LoggingService,
    private confirmationServer: ConfirmationDialogService
  ) {
    super();
  }

  async onFileSelected(event) {
    const file: File = event.target.files[0];
    this.uploadProgress = 0;
    this.mode = "determinate";
    this.done = false;

    if (this.formControl.value) {
      const shouldReplace = await this.confirmationServer.getConfirmation(
        $localize`Replacing file`,
        $localize`Are you sure you want to replace "${this.formControl.value}" with "${file.name}"?`
      );
      if (!shouldReplace) {
        return;
      }
    }

    // The maximum file size which can be processed by CouchDB before a timeout is around 200mb
    this.fileService
      .uploadFile(file, this.entity._id, this.formControlName)
      .subscribe({
        next: (event) => this.processEvent(event),
        error: (err) => this.handleError(err),
        complete: () => this.updateEntity(file.name),
      });
  }

  private handleError(err) {
    this.logger.error("Failed uploading file: " + err);
    this.alertService.addDanger("Could not upload file, please try again.");
    this.done = true;
  }

  private async updateEntity(filename: string) {
    this.formControl.setValue(filename);
    this.entity[this.formControlName] = filename;
    await this.entityMapper.save(this.entity);
    this.done = true;
  }

  private processEvent(event) {
    if (event.type == HttpEventType.UploadProgress) {
      this.uploadProgress = Math.round(100 * (event.loaded / event.total));
      if (this.uploadProgress === 100) {
        this.mode = "indeterminate";
      }
    }
  }

  fileClicked() {
    if (this.formControl.value) {
      this.fileService.showFile(this.entity._id, this.formControlName);
    }
  }
}
