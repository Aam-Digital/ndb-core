import { Component, inject, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import {
  EditFileComponent,
  EditFileComponent_IMPORTS,
} from "../../file/edit-file/edit-file.component";
import { TemplateExportApiService } from "#src/app/features/template-export/template-export-api/template-export-api.service";
import { TemplateExportService } from "../template-export-service/template-export.service";

/**
 * An edit component that allows to manage template files stored in the PDF Generator API.
 * Shows conditional UI based on whether the export server is enabled.
 */
@DynamicComponent("EditTemplateExportFile")
@Component({
  selector: "app-template-export-file",
  templateUrl: "./edit-template-export-file.component.html",
  styleUrls: [
    "../../file/edit-file/edit-file.component.scss",
    "./edit-template-export-file.component.scss",
  ],
  imports: EditFileComponent_IMPORTS,
})
export class EditTemplateExportFileComponent
  extends EditFileComponent
  implements OnInit
{
  // Use the TemplateExportApiService to also upload files to the PDF Generator API
  override fileService = inject(TemplateExportApiService);
  private readonly templateExportService = inject(TemplateExportService);

  exportServerEnabled: boolean = false;

  override ngOnInit(): void {
    super.ngOnInit();
    // Check if export server is enabled
    this.templateExportService
      .isExportServerEnabled()
      .then((enabled) => (this.exportServerEnabled = enabled))
      .catch(() => (this.exportServerEnabled = false));
  }
}
