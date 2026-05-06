import {
  ChangeDetectionStrategy,
  Component,
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
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
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
  filename: string;
}

/**
 * Dialog for selecting export format (CSV/XLSX) and data scope (filtered/all).
 */
@Component({
  selector: "app-export-dialog",
  templateUrl: "./export-dialog.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatRadioModule,
    FormsModule,
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
        this.data.exportConfig,
      );
      this.dialogRef.close();
    } catch (e) {
      Logging.warn("Export download failed:", e);
      this.downloadError.set(
        $localize`Download failed [${e instanceof Error ? e.message : e}]`,
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
