import { Directive, HostListener, Input, inject } from "@angular/core";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";
import {
  DownloadService,
  FileDownloadFormat,
} from "../download-service/download.service";

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
  standalone: true,
})
export class ExportDataDirective {
  private downloadService = inject(DownloadService);

  /** data to be exported */
  @Input("appExportData") data: any = [];

  /** What kind of data should be export? Currently implemented are 'json', 'csv' */
  @Input() format: FileDownloadFormat = "csv";

  /** filename for the download of the exported data */
  @Input() filename: string = "exportedData";

  /**
   * (Optional) definition of fields to be exported.
   *
   * If not provided, all properties will be included in the export.
   */
  @Input() exportConfig: ExportColumnConfig[];

  @HostListener("click")
  click() {
    return this.downloadService.triggerDownload(
      this.data,
      this.format,
      this.filename,
      this.exportConfig,
    );
  }
}
