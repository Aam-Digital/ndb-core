import { Component, Input, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatProgressBar } from "@angular/material/progress-bar";
import { RouterLink } from "@angular/router";
import { AlertService } from "../../../core/alerts/alert.service";
import { EditEntityComponent } from "../../../core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";
import { Entity } from "../../../core/entity/model/entity";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";
import {
  TemplateExportApiService,
  TemplateExportResult,
} from "../template-export-api/template-export-api.service";
import { TemplateExportService } from "../template-export-service/template-export.service";
import { TemplateExport } from "../template-export.entity";

/**
 * Popup for user to select one of the available templates
 * and manage the PDF/file generation process for a specific entity.
 */
@Component({
  selector: "app-file-template-selection-dialog-component",
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    EditEntityComponent,
    MatDialogClose,
    RouterLink,
    DisableEntityOperationDirective,
    MatProgressBar,
    FeatureDisabledInfoComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
  ],
  templateUrl: "./template-export-selection-dialog.component.html",
  styleUrl: "./template-export-selection-dialog.component.scss",
})
export class TemplateExportSelectionDialogComponent implements OnInit {
  private dialogRef =
    inject<MatDialogRef<TemplateExportSelectionDialogComponent>>(MatDialogRef);
  private templateExportApi = inject(TemplateExportApiService);
  private downloadService = inject(DownloadService);
  private alertService = inject(AlertService);
  private readonly templateExportService = inject(TemplateExportService);

  @Input() entity: Entity;

  templateSelectionForm: FormControl = new FormControl();
  isFeatureEnabled: boolean;
  TemplateExport = TemplateExport;
  templateEntityFilter: (e: TemplateExport) => boolean = (e) =>
    e.applicableForEntityTypes.includes(this.entity.getType());

  loadingRequestedFile: boolean;

  constructor() {
    const data = inject<Entity>(MAT_DIALOG_DATA);

    this.entity = data;
  }

  async ngOnInit() {
    this.isFeatureEnabled =
      await this.templateExportService.isExportServerEnabled();
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
