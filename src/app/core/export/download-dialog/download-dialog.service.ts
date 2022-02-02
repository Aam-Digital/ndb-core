import { Injectable } from "@angular/core";
import { ExportColumnConfig } from "../export-service/export-column-config";
import { ExportDataFormat } from "../export-data-directive/export-data.directive";
import { ExportService } from "../export-service/export.service";

@Injectable()
export class DownloadDialogService {
  constructor(private exportService: ExportService) {}

  async openDownloadDialog(
    data: any,
    format: ExportDataFormat,
    filename: string,
    exportConfig?: ExportColumnConfig[]
  ) {
    const blobData = await this.getFormattedBlobData(
      data,
      format,
      exportConfig
    );
    const filenameWithExtension = filename + "." + format.toLowerCase();
    const link = this.createDownloadLink(blobData, filenameWithExtension);
    link.click();
  }

  private createDownloadLink(blobData, filename: string): HTMLAnchorElement {
    const link = document.createElement("a");
    link.setAttribute("style", "display:none;");
    document.body.appendChild(link);
    link.href = window.URL.createObjectURL(blobData);
    link.download = filename;
    link.addEventListener("click", () => window.URL.revokeObjectURL(blobData));
    return link;
  }

  private async getFormattedBlobData(
    data: any,
    format: ExportDataFormat,
    exportConfig?: ExportColumnConfig[]
  ): Promise<Blob> {
    let result = "";
    switch (format.toLowerCase()) {
      case "json":
        result = this.exportService.createJson(data); // TODO: support exportConfig for json format
        return new Blob([result], { type: "application/json" });
      case "csv":
        result = await this.exportService.createCsv(data, exportConfig);
        return new Blob([result], { type: "text/csv" });
      default:
        console.warn("Not supported format:", format);
        return new Blob([""]);
    }
  }
}
