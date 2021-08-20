import { Component, Input } from "@angular/core";
import { ExportService } from "../export-service/export.service";
import { ExportColumnConfig } from "../export-service/export-column-config";

/**
 * Generic export data button that allows the user to download a file of the given data.
 */
@Component({
  selector: "app-export-data-button",
  templateUrl: "./export-data-button.component.html",
  styleUrls: ["./export-data-button.component.scss"],
})
export class ExportDataButtonComponent {
  /** data to be exported */
  @Input() data: any = [];

  /**
   * (Optional) definition of fields to be exported.
   *
   * If not provided, all properties will be included in the export.
   */
  @Input() exportConfig: ExportColumnConfig[];

  /** What kind of data should be export? Currently implemented are 'json', 'csv' */
  @Input() format: string = "csv";

  /** filename for the download of the exported data */
  @Input() filename: string = "exportedData";

  @Input() disabled: boolean = false;

  constructor(private exportService: ExportService) {}

  /**
   * Trigger the download of the export file.
   */
  async exportData() {
    const blobData = await this.getFormattedBlobData();
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

  private async getFormattedBlobData(): Promise<Blob> {
    let result = "";
    switch (this.format.toLowerCase()) {
      case "json":
        result = this.exportService.createJson(this.data); // TODO: support exportConfig for json format
        return new Blob([result], { type: "application/json" });
      case "csv":
        result = await this.exportService.createCsv(
          this.data,
          this.exportConfig
        );
        return new Blob([result], { type: "text/csv" });
      default:
        console.warn("Not supported format:", this.format);
        return new Blob([""]);
    }
  }
}
