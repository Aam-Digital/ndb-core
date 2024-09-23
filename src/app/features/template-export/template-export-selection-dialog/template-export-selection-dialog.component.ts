import { Component, Inject, Input } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { Entity } from "../../../core/entity/model/entity";
import {
  TemplateExportApiService,
  TemplateExportResult,
} from "../template-export-api/template-export-api.service";
import { MatButton } from "@angular/material/button";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { TemplateExport } from "../template-export.entity";
import { EntitySelectComponent } from "../../../core/common-components/entity-select/entity-select.component";
import { FormControl } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatProgressBar } from "@angular/material/progress-bar";
import { AlertService } from "../../../core/alerts/alert.service";

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
  templateUrl: "./template-export-selection-dialog.component.html",
  styleUrl: "./template-export-selection-dialog.component.scss",
})
export class TemplateExportSelectionDialogComponent {
  @Input() entity: Entity;

  templateSelectionForm: FormControl = new FormControl();

  TemplateExport = TemplateExport;
  templateEntityFilter: (e: TemplateExport) => boolean = (e) =>
    e.applicableForEntityTypes.includes(this.entity.getType());

  loadingRequestedFile: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: Entity,
    private dialogRef: MatDialogRef<TemplateExportSelectionDialogComponent>,
    private templateExportApi: TemplateExportApiService,
    private downloadService: DownloadService,
    private alertService: AlertService,
  ) {
    this.entity = data;
  }

  requestFile() {
    const templateId = this.templateSelectionForm.value;

    this.loadingRequestedFile = true;
    this.templateExportApi
      .generatePdfFromTemplate(templateId, this.entity)
      .subscribe({
        error: (error) => {
          this.alertService.addWarning(
            $localize`Failed to generate document [${error}]`,
          );
          this.loadingRequestedFile = false;
        },
        next: (templateResult: TemplateExportResult) => {
          this.downloadService.triggerDownload(
            templateResult.file,
            "pdf",
            templateResult.filename ?? this.entity?.toString(),
          );
          this.loadingRequestedFile = false;
          this.dialogRef.close(true);
        },
      });
  }
}
