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
import { MatSelectModule } from "@angular/material/select";
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
import { ColumnGroupsConfig } from "../../entity-list/EntityListConfig";

export interface ExportDialogData {
  /** Resolves with all records (unfiltered, permissions-limited) */
  allEntities: () => Promise<any[]>;
  /**
   * Resolves with the currently filtered/visible records.
   * When omitted, the scope selector is hidden and allEntities are exported directly.
   */
  filteredData?: () => Promise<any[]>;
  exportConfig?: ExportColumnConfig[];
  preselectedExportConfig?: ExportColumnConfig[];
  filename: string;
  columnGroups?: ColumnGroupsConfig;
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
    MatSelectModule,
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

  /** Column groups passed from the list (admin-configured) */
  columnGroups = this.data.columnGroups;

  /** Currently selected column group name (if any) */
  selectedGroupName = signal<string | undefined>(
    this.columnGroups && this.columnGroups.groups.length > 0
      ? this.columnGroups.groups[0].name
      : undefined,
  );

  applyColumnGroup(groupName?: string) {
    if (!groupName || !this.columnGroups) return;
    const grp = this.columnGroups.groups.find((g) => g.name === groupName);
    if (!grp) return;
    // Map group columns to normalized keys and set selection
    this.selectedColumnKeys.set(grp.columns.map((c) => normalizeQueryKey(c)));
  }

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

  /** Map selected column keys back to their full export column config (incl. label). */
  private columnsFromKeys(keys: string[]): ExportColumnConfig[] {
    const byKey = new Map<string, ExportColumnConfig>();
    for (const c of this.availableColumns) {
      byKey.set(normalizeQueryKey(c.query), c);
    }
    return keys
      .map((k) => byKey.get(normalizeQueryKey(k)))
      .filter((c): c is ExportColumnConfig => !!c);
  }

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
          ? await this.data.filteredData()
          : await this.data.allEntities();
      const selectedKeys = this.selectedColumnKeys();
      await this.downloadService.triggerDownload(
        exportData,
        this.format(),
        this.data.filename,
        selectedKeys === undefined
          ? undefined
          : this.columnsFromKeys(selectedKeys),
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
