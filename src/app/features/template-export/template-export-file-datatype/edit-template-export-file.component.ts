import { Component, inject, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditFileComponent } from "../../file/edit-file/edit-file.component";
import { TemplateExportApiService } from "#src/app/features/template-export/template-export-api/template-export-api.service";
import { TemplateExportService } from "../template-export-service/template-export.service";
import { EditComponent } from "../../../core/entity/default-datatype/edit-component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FileService } from "../../file/file.service";
import { FeatureLoadingComponent } from "#src/app/core/common-components/feature-disabled-info/feature-loading.component";

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
  imports: [
    EditFileComponent,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FeatureLoadingComponent,
  ],
  providers: [{ provide: FileService, useClass: TemplateExportApiService }],
})
export class EditTemplateExportFileComponent
  extends EditComponent<string>
  implements OnInit
{
  private readonly templateExportService = inject(TemplateExportService);

  exportServerEnabled: boolean;

  override ngOnInit(): void {
    super.ngOnInit();
    // Check if export server is enabled
    this.templateExportService
      .isExportServerEnabled()
      .then((enabled) => (this.exportServerEnabled = enabled))
      .catch(() => (this.exportServerEnabled = false));
  }
}
