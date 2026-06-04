import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatRadioModule } from "@angular/material/radio";
import { FormsModule } from "@angular/forms";
import { Logging } from "../../logging/logging.service";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import {
  DownloadService,
  FileDownloadFormat,
} from "../download-service/download.service";
import {
  ExportColumnConfig,
  normalizeQueryKey,
} from "../data-transformation-service/export-column-config";

export interface ExportDialogData {
  /** All records (unfiltered, permissions-limited) */
  allEntities: any[];
  /**
   * Currently filtered/visible records.
   * When omitted, the scope selector is hidden and allEntities are exported directly.
   */
  filteredData?: any[];
  exportConfig?: ExportColumnConfig[];
  preselectedExportConfig?: ExportColumnConfig[];
  filename: string;
}

/**
 * Dialog for selecting export format (CSV/XLSX) and data scope (filtered/all).
 */
@Component({
  selector: "app-export-dialog",
  templateUrl: "./export-dialog.component.html",
  styleUrls: ["./export-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatRadioModule,
    FormsModule,
    BasicAutocompleteComponent,
    DialogCloseComponent,
  ],
})
export class ExportDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<ExportDialogComponent>>(MatDialogRef);
  data = inject<ExportDialogData>(MAT_DIALOG_DATA);
  private readonly downloadService = inject(DownloadService);

  format = signal<FileDownloadFormat>("csv");
  scope = signal<"filtered" | "all">("filtered");
  isLoading = signal<boolean>(false);
  downloadError = signal<string | null>(null);

  /** All available export column options (deduped, excludes internal fields). */
  availableColumns: ExportColumnConfig[] = this.buildAvailableColumns();

  /** Selected export column keys in the order chosen by the user (undefined = use default passed config). */
  selectedColumnKeys = signal<string[] | undefined>(
    (this.data.preselectedExportConfig ?? this.data.exportConfig)?.map((c) =>
      normalizeQueryKey(c.query),
    ),
  );

  selectedColumnCount = computed(() => {
    const keys = this.selectedColumnKeys();
    if (keys !== undefined) {
      return keys.length;
    }
    return this.availableColumns.length;
  });

  columnToString = (col: ExportColumnConfig) => col.label ?? col.query;
  columnToValue = (col: ExportColumnConfig) => normalizeQueryKey(col.query);

  clearSelection() {
    this.selectedColumnKeys.set([]);
  }

  includeAll() {
    this.selectedColumnKeys.set(
      this.availableColumns.map((c) => normalizeQueryKey(c.query)),
    );
  }

  // using shared normalizeQueryKey()

  private buildAvailableColumns(): ExportColumnConfig[] {
    const configs = this.data.exportConfig ?? [];
    const out: ExportColumnConfig[] = [];
    const seen = new Set<string>();
    for (const c of configs) {
      const key = normalizeQueryKey(c.query);
      if (key.startsWith("_")) continue;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(c);
      }
    }
    return out;
  }

  private columnsFromKeys(keys: string[]): ExportColumnConfig[] {
    const byKey = new Map<string, ExportColumnConfig>();
    for (const c of this.availableColumns) {
      byKey.set(normalizeQueryKey(c.query), c);
    }
    return keys
      .map((k) => byKey.get(normalizeQueryKey(k)))
      .filter((c): c is ExportColumnConfig => !!c);
  }

  async download() {
    // Only block when an explicit exportConfig was provided (columns UI visible).
    if (this.data.exportConfig && this.selectedColumnCount() === 0) {
      this.downloadError.set(
        $localize`Please select at least one column before downloading.`,
      );
      return;
    }

    this.isLoading.set(true);
    this.downloadError.set(null);
    await new Promise<void>((resolve) => setTimeout(resolve));
    try {
      const exportData =
        this.data.filteredData && this.scope() === "filtered"
          ? this.data.filteredData
          : this.data.allEntities;
      await this.downloadService.triggerDownload(
        exportData,
        this.format(),
        this.data.filename,
        this.selectedColumnKeys() === undefined
          ? this.data.exportConfig
          : this.columnsFromKeys(this.selectedColumnKeys() ?? []),
      );
      this.dialogRef.close();
    } catch (e) {
      Logging.warn("Export download failed:", e);
      this.downloadError.set(
        $localize`Download failed [${e instanceof Error ? e.message : String(e)}]`,
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
