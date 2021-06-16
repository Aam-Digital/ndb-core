import { Directive, HostListener, Input } from "@angular/core";
import { BackupService } from "../services/backup.service";

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
  @Input() format: string = "csv";

  /** filename for the download of the exported data */
  @Input() filename: string = "exportedData";

  constructor(private backupService: BackupService) {}

  exportData() {
    const blobData = this.getFormattedBlobData();
    const link = this.createDownloadLink(blobData);
    link.click();
  }

  @HostListener("click")
  click() {
    this.exportData();
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

  private getFormattedBlobData(): Blob {
    let result = "";
    switch (this.format.toLowerCase()) {
      case "json":
        result = this.backupService.createJson(this.data);
        return new Blob([result], { type: "application/json" });
      case "csv":
        result = this.backupService.createCsv(this.data);
        return new Blob([result], { type: "text/csv" });
      default:
        console.warn("Not supported format:", this.format);
        return new Blob([""]);
    }
  }
}
