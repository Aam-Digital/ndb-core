import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
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
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import {
  DownloadService,
  FileDownloadFormat,
} from "../download-service/download.service";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";

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
    DialogCloseComponent,
    FaDynamicIconComponent,
    CdkDropList,
    CdkDrag,
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
  /** currently selected subset & order of export columns (undefined = use default passed config) */
  selectedExportConfig = signal<ExportColumnConfig[] | undefined>(
    this.data.preselectedExportConfig ?? this.data.exportConfig,
  );

  clearSelection() {
    this.selectedExportConfig.set([]);
  }

  private normalizeQueryKey(query: string): string {
    return query.startsWith(".") ? query.slice(1) : query;
  }

  isSelected(col: ExportColumnConfig): boolean {
    const current = this.selectedExportConfig() ?? this.data.exportConfig ?? [];
    const key = this.normalizeQueryKey(col.query);
    return current.some((c) => this.normalizeQueryKey(c.query) === key);
  }

  includeAll() {
    if (this.data.exportConfig) {
      // clone to allow reordering independently
      this.selectedExportConfig.set([...this.data.exportConfig]);
    }
  }

  toggleColumn(col: ExportColumnConfig) {
    const current = this.selectedExportConfig() ?? this.data.exportConfig;
    if (!current) return;
    const key = this.normalizeQueryKey(col.query);
    const idx = current.findIndex(
      (c) => this.normalizeQueryKey(c.query) === key,
    );
    if (idx === -1) {
      this.selectedExportConfig.set([...current, col]);
    } else {
      const next = [...current];
      next.splice(idx, 1);
      this.selectedExportConfig.set(next);
    }
  }

  drop(event: CdkDragDrop<ExportColumnConfig[]>) {
    const current = this.selectedExportConfig() ?? this.data.exportConfig ?? [];
    const next = [...current];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.selectedExportConfig.set(next);
  }

  moveUp(index: number) {
    const current = this.selectedExportConfig() ?? this.data.exportConfig;
    if (!current) return;
    if (index <= 0) return;
    const next = [...current];
    const item = next.splice(index, 1)[0];
    next.splice(index - 1, 0, item);
    this.selectedExportConfig.set(next);
  }

  moveDown(index: number) {
    const current = this.selectedExportConfig() ?? this.data.exportConfig;
    if (!current) return;
    if (index >= current.length - 1) return;
    const next = [...current];
    const item = next.splice(index, 1)[0];
    next.splice(index + 1, 0, item);
    this.selectedExportConfig.set(next);
  }

  async download() {
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
        this.selectedExportConfig() ?? this.data.exportConfig,
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
