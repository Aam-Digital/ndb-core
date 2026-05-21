import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy,
  signal,
  resource,
} from "@angular/core";
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
import { getEntityRuntimeRoute } from "../../../core/entity/entity-config.service";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class TemplateExportSelectionDialogComponent {
  private dialogRef =
    inject<MatDialogRef<TemplateExportSelectionDialogComponent>>(MatDialogRef);
  private readonly dialogData = inject<Entity>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private templateExportApi = inject(TemplateExportApiService);
  private downloadService = inject(DownloadService);
  private alertService = inject(AlertService);
  private readonly templateExportService = inject(TemplateExportService);

  entity = input<Entity>();

  templateSelectionForm: FormControl = new FormControl();
  TemplateExport = TemplateExport;
  readonly configureTemplatesRoute = signal(
    getEntityRuntimeRoute(TemplateExport),
  );
  readonly currentEntity = computed(() => this.entity() ?? this.dialogData);
  templateEntityFilter: (e: TemplateExport) => boolean = (e) =>
    e.applicableForEntityTypes.includes(this.currentEntity()?.getType() ?? "");

  loadingRequestedFile = signal<boolean>(false);

  isFeatureEnabled = resource({
    loader: () =>
      this.templateExportService.isExportServerEnabled().catch(() => false),
  });

  requestFile() {
    const templateId = this.templateSelectionForm.value;
    const entity = this.currentEntity();
    if (!entity) {
      this.alertService.addWarning(
        $localize`Could not determine current record.`,
      );
      return;
    }

    this.loadingRequestedFile.set(true);
    this.templateExportApi
      .generatePdfFromTemplate(templateId, entity)
      .subscribe({
        error: (error) => {
          this.alertService.addWarning(
            $localize`Failed to generate document [${error}]`,
          );
          this.loadingRequestedFile.set(false);
        },
        next: (templateResult: TemplateExportResult) => {
          this.downloadService.triggerDownload(
            templateResult.file,
            "pdf",
            templateResult.filename ?? entity.toString(),
          );
          this.loadingRequestedFile.set(false);
          this.dialogRef.close(true);
        },
      });
  }
}
