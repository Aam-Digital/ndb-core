import { Directive, HostListener, Input } from "@angular/core";
import { ExportColumnConfig } from "../export-service/export-column-config";
import { DownloadDialogService } from "../download-dialog/download-dialog.service";

export type ExportDataFormat = "csv" | "json";

/**
 * A directive that can be attached to a html element, commonly a button.
 * Usage:
 * ```html
 *  <button
 *    mat-stroked-button
 *    [appExportData]="data"
 *    format="csv"
 *  >
 *    Export CSV
 *  </button
 *
 * ```
 */
@Directive({
  selector: "[appExportData]",
})
export class ExportDataDirective {
  /** data to be exported */
  @Input("appExportData") data: any = [];

  /** What kind of data should be export? Currently implemented are 'json', 'csv' */
  @Input() format: ExportDataFormat = "csv";

  /** filename for the download of the exported data */
  @Input() filename: string = "exportedData";

  /**
   * (Optional) definition of fields to be exported.
   *
   * If not provided, all properties will be included in the export.
   */
  @Input() exportConfig: ExportColumnConfig[];

  constructor(private downloadDialogService: DownloadDialogService) {}

  @HostListener("click")
  click() {
    return this.downloadDialogService.openDownloadDialog(
      this.data,
      this.format,
      this.filename,
      this.exportConfig
    );
  }
}
