import { Component, Input } from "@angular/core";
import { BackupService } from "../services/backup.service";

/**
 * Generic export data button that allows the user to download a file of the given data.
 */
@Component({
  selector: "app-export-data",
  templateUrl: "./export-data.component.html",
  styleUrls: ["./export-data.component.scss"],
})
export class ExportDataComponent {
  /** data to be exported */
  @Input() data: any = [];

  /** What kind of data should be export? Currently implemented are 'json', 'csv' */
  @Input() format: string = "csv";

  /** filename for the download of the exported data */
  @Input() filename: string = "exportedData";

  @Input() disabled: boolean = false;

  constructor(private backupService: BackupService) {}

  /**
   * Trigger the download of the export file.
   */
  exportData() {
    const blobData = this.getFormattedBlobData();
    const link = this.createDownloadLink(blobData);
    link.click();
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
