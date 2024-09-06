import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { Entity } from "../../../../core/entity/model/entity";
import { PdfGeneratorApiService } from "../../pdf-generator-api/pdf-generator-api.service";
import { MatButton } from "@angular/material/button";
import { DownloadService } from "../../../../core/export/download-service/download.service";
import { FileTemplate } from "../../file-template.entity";
import { EntitySelectComponent } from "../../../../core/common-components/entity-select/entity-select.component";
import { FormControl } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { DisableEntityOperationDirective } from "../../../../core/permissions/permission-directive/disable-entity-operation.directive";
import { finalize } from "rxjs";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatProgressBar } from "@angular/material/progress-bar";

/**
 * Popup for user to select one of the available templates
 * and manage the PDF/file generation process for a specific entity.
 */
@Component({
  selector: "app-file-template-selection-dialog-component",
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    EntitySelectComponent,
    MatDialogClose,
    RouterLink,
    DisableEntityOperationDirective,
    MatProgressSpinner,
    MatProgressBar,
  ],
  templateUrl: "./file-template-selection-dialog.component.html",
  styleUrl: "./file-template-selection-dialog.component.scss",
})
export class FileTemplateSelectionDialogComponent {
  private entity: Entity;

  templateSelectionForm: FormControl = new FormControl();

  FileTemplate = FileTemplate;
  templateEntityFilter: (e: FileTemplate) => boolean = (e) =>
    e.applicableForEntityTypes.includes(this.entity.getType());

  loadingRequestedFile: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: Entity,
    private dialogRef: MatDialogRef<FileTemplateSelectionDialogComponent>,
    private pdfGeneratorApi: PdfGeneratorApiService,
    private downloadService: DownloadService,
  ) {
    this.entity = data;
  }

  requestFile() {
    const templateId = this.templateSelectionForm.value;

    this.loadingRequestedFile = true;
    this.pdfGeneratorApi
      .generatePdfFromTemplate(templateId, this.entity)
      .pipe(finalize(() => (this.loadingRequestedFile = false)))
      .subscribe((file) => {
        this.downloadService.triggerDownload(
          file,
          "pdf",
          this.entity.toString(),
        );
        this.dialogRef.close(true);
      });
  }
}
