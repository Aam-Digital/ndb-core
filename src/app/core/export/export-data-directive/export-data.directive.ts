import { Directive, HostListener, Input } from "@angular/core";
import { ExportService } from "../export-service/export.service";
import { ExportColumnConfig } from "../export-service/export-column-config";

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

  constructor(private exportService: ExportService) {}

  async exportData() {
    const blobData = await this.getFormattedBlobData();
    const link = this.createDownloadLink(blobData);
    link.click();
  }

  @HostListener("click")
  async click() {
    await this.exportData();
  }

  private createDownloadLink(blobData): HTMLAnchorElement {
    const link = document.createElement("a");
    link.setAttribute("style", "display:none;");
    document.body.appendChild(link);
    link.href = window.URL.createObjectURL(blobData);
    link.download = this.filename + "." + this.format.toLowerCase();
    link.addEventListener("click", () => window.URL.revokeObjectURL(blobData));
    return link;
  }

  private async getFormattedBlobData(): Promise<Blob> {
    let result = "";
    switch (this.format.toLowerCase()) {
      case "json":
        result = this.exportService.createJson(this.data); // TODO: support exportConfig for json format
        return new Blob([result], { type: "application/json" });
      case "csv":
        if (typeof this.data === "string") {
          result = this.data;
        } else {
          result = await this.exportService.createCsv(
            this.data,
            this.exportConfig
          );
        }
        return new Blob([result], { type: "text/csv" });
      default:
        console.warn("Not supported format:", this.format);
        return new Blob([""]);
    }
  }
}
