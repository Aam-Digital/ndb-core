import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  ChangeDetectionStrategy,
  signal,
  resource,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatRadioModule } from "@angular/material/radio";
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
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
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
 * and manage the file generation process (as PDF or as an editable file
 * in the format of the template) for a specific entity.
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
    MatRadioModule,
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
  private readonly entityMapper = inject(EntityMapperService);

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
    e.applicableForEntityTypes.includes(
      this.currentEntity()?.getType() ?? "",
    ) &&
    // an arrayReport combines all selected records into one document, so it
    // is only useful (and only offered) for a bulk selection of records
    (!e.arrayReport || this.isBulk());

  /**
   * The full TemplateExport entity currently selected in the form, reactively reloaded
   * whenever the selection changes - needed to check `arrayReport` before submitting.
   */
  private readonly selectedTemplateId = toSignal(
    this.templateSelectionForm.valueChanges,
    { initialValue: this.templateSelectionForm.value },
  );
  private readonly selectedTemplate = resource<TemplateExport, string>({
    params: () => this.selectedTemplateId(),
    loader: ({ params: templateId }) =>
      templateId
        ? this.entityMapper.load(TemplateExport, templateId)
        : Promise.resolve(undefined),
  });
  readonly selectedTemplateIsArrayReport = computed(
    () =>
      this.selectedTemplate.hasValue() &&
      !!this.selectedTemplate.value().arrayReport,
  );
  /**
   * The format of the selected template's file (e.g. "docx"),
   * offered as an editable alternative to the PDF.
   */
  readonly templateFileFormat = computed(() =>
    this.selectedTemplate.hasValue()
      ? this.selectedTemplate.value()?.getEditableOutputFormat()
      : undefined,
  );
  /**
   * User-controlled choice to generate an editable file in the format of the template
   * instead of a PDF. Starts again from PDF whenever another template is selected.
   */
  readonly useTemplateFileFormat = linkedSignal<string, boolean>({
    source: this.selectedTemplateId,
    computation: () => false,
  });
  /**
   * The file format to generate, as its file extension.
   */
  readonly outputFormat = computed(
    () => (this.useTemplateFileFormat() && this.templateFileFormat()) || "pdf",
  );
  /**
   * Multiple records can only be merged into a single file as PDF.
   */
  readonly canCombine = computed(() => this.outputFormat() === "pdf");

  /**
   * Generating requires the full template entity, so this stays false while the selected template is still loading.
   */
  readonly canGenerate = computed(
    () =>
      !!this.selectedTemplateId() &&
      !this.selectedTemplate.isLoading() &&
      this.selectedTemplate.hasValue(),
  );

  readonly phase = signal<"select" | "running" | "done">("select");
  readonly totalRecords = signal<number>(0);
  readonly failures = signal<{ entity: Entity; error: unknown }[]>([]);

  /**
   * User-controlled toggle (bulk only): when on, the backend returns a single combined
   * multi-page PDF instead of a ZIP of N independent files.
   * Only applies while {@link canCombine}.
   */
  readonly combineIntoSinglePdf = signal<boolean>(false);
  /**
   * Whether the records of a bulk selection are actually merged into a single PDF.
   */
  readonly combineRecords = computed(
    () => this.combineIntoSinglePdf() && this.canCombine(),
  );

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

  /**
   * Multiple records are packaged in a zip, unless they are combined into one file.
   */
  private downloadExtension(
    template: TemplateExport,
    recordCount: number,
    format: string,
  ): string {
    const isZip =
      !template.arrayReport && recordCount > 1 && !this.combineRecords();
    return isZip ? "zip" : format;
  }

  async requestFile() {
    const entities = this.entities();
    if (entities.length === 0) {
      this.alertService.addWarning(
        $localize`No records selected for file generation.`,
      );
      return;
    }
    if (!this.canGenerate()) {
      // the button is disabled in this state; guard against a click racing the template load
      return;
    }
    const template = this.selectedTemplate.value();

    this.phase.set("running");
    this.totalRecords.set(entities.length);
    this.failures.set([]);

    const format = this.outputFormat();

    try {
      let result: TemplateExportResult;
      if (template.arrayReport || entities.length === 1) {
        result = await firstValueFrom(
          this.templateExportApi.generateFileFromTemplate(
            template,
            template.arrayReport ? entities : entities[0],
            format,
          ),
        );
      } else {
        result = await firstValueFrom(
          this.templateExportApi.generateBatchFromTemplate(
            template,
            entities,
            this.combineRecords() ? "combined" : "zip",
            format,
          ),
        );
      }
      this.downloadService.triggerFileDownload(
        result.file,
        result.filename,
        this.downloadExtension(template, entities.length, format),
      );
      this.dialogRef.close(true);

      if (result.incomplete) {
        this.alertService.addWarning(
          $localize`Files generated, but some related records could not be loaded and are missing from them. Please try again.`,
        );
      } else {
        this.alertService.addInfo($localize`Files generated successfully.`);
      }
    } catch (error) {
      Logging.warn("Failed to generate files", error);
      this.failures.set(entities.map((entity) => ({ entity, error })));
      this.phase.set("done");
    }
  }
}
