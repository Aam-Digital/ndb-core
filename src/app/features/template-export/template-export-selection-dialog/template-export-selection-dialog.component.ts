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
import { MatCheckboxModule } from "@angular/material/checkbox";
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
import { firstValueFrom } from "rxjs";
import { Logging } from "#src/app/core/logging/logging.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { EditEntityComponent } from "../../../core/basic-datatypes/entity/edit-entity/edit-entity.component";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";
import { getEntityRuntimeRoute } from "../../../core/entity/entity-config.service";
import { Entity } from "../../../core/entity/model/entity";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";
import { TemplateExportApiService } from "../template-export-api/template-export-api.service";
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
    MatCheckboxModule,
  ],
  templateUrl: "./template-export-selection-dialog.component.html",
  styleUrl: "./template-export-selection-dialog.component.scss",
})
export class TemplateExportSelectionDialogComponent {
  private readonly dialogData = inject<Entity | Entity[]>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private templateExportApi = inject(TemplateExportApiService);
  private downloadService = inject(DownloadService);
  private alertService = inject(AlertService);
  private readonly dialogRef = inject(
    MatDialogRef<TemplateExportSelectionDialogComponent>,
  );
  private readonly templateExportService = inject(TemplateExportService);

  entity = input<Entity | Entity[]>();

  templateSelectionForm: FormControl = new FormControl();
  TemplateExport = TemplateExport;
  readonly configureTemplatesRoute = signal(
    getEntityRuntimeRoute(TemplateExport),
  );
  readonly entities = computed<Entity[]>(() => {
    const raw = this.entity() ?? this.dialogData;
    if (Array.isArray(raw)) return raw;
    return raw ? [raw as Entity] : [];
  });
  readonly isBulk = computed(() => this.entities().length > 1);
  readonly currentEntity = computed<Entity | undefined>(
    () => this.entities()[0],
  );
  templateEntityFilter: (e: TemplateExport) => boolean = (e) =>
    e.applicableForEntityTypes.includes(this.currentEntity()?.getType() ?? "");

  readonly phase = signal<"select" | "running" | "done">("select");
  readonly totalRecords = signal<number>(0);
  readonly failures = signal<{ entity: Entity; error: unknown }[]>([]);

  /**
   * User-controlled toggle (bulk only): when on, the backend returns a single combined
   * multi-page PDF instead of a ZIP of N independent files.
   */
  readonly combineIntoSinglePdf = signal<boolean>(false);

  readonly succeededCount = computed(
    () => this.totalRecords() - this.failures().length,
  );
  readonly failedEntityNames = computed(() =>
    this.failures()
      .map((f) => f.entity.toString())
      .join(", "),
  );

  isFeatureEnabled = resource({
    loader: () =>
      this.templateExportService.isExportServerEnabled().catch(() => false),
  });

  setCombineIntoSinglePdf(value: boolean) {
    this.combineIntoSinglePdf.set(value);
  }

  async requestFile() {
    const templateId = this.templateSelectionForm.value;
    const entities = this.entities();
    if (entities.length === 0) {
      this.alertService.addWarning(
        $localize`No records selected for file generation.`,
      );
      return;
    }

    this.phase.set("running");
    this.totalRecords.set(entities.length);
    this.failures.set([]);

    try {
      if (entities.length === 1) {
        const result = await firstValueFrom(
          this.templateExportApi.generatePdfFromTemplate(
            templateId,
            entities[0],
          ),
        );
        await this.downloadService.triggerDownload(
          result.file,
          "pdf",
          result.filename ?? entities[0].toString(),
        );
      } else {
        const combined = this.combineIntoSinglePdf();
        const result = await firstValueFrom(
          this.templateExportApi.generateBatchFromTemplate(
            templateId,
            entities,
            combined ? "combined" : "zip",
          ),
        );
        await this.downloadService.triggerDownload(
          result.file,
          combined ? "pdf" : "zip",
          result.filename,
        );
      }
      this.dialogRef.close(true);

      this.alertService.addInfo(
        $localize`Generated ${entities.length} of ${entities.length} files.`,
      );
    } catch (error) {
      Logging.warn("Failed to generate files", error);
      this.failures.set(entities.map((entity) => ({ entity, error })));
      this.phase.set("done");
    }
  }
}
