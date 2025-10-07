import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { EditComponent } from "#src/app/core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { Entity } from "#src/app/core/entity/model/entity";
import { TemplateExportApiService } from "#src/app/features/template-export/template-export-api/template-export-api.service";
import { Component, inject, Input, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FeatureDisabledInfoComponent } from "../../../core/common-components/feature-disabled-info/feature-disabled-info.component";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditFileComponent } from "../../file/edit-file/edit-file.component";
import { FileService } from "../../file/file.service";
import { TemplateExportService } from "../template-export-service/template-export.service";

/**
 * An edit component that allows to manage template files stored in the PDF Generator API.
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
    ReactiveFormsModule,
    FeatureDisabledInfoComponent,
  ],
  providers: [
    { provide: FileService, useClass: TemplateExportApiService },
    {
      provide: MatFormFieldControl,
      useExisting: EditTemplateExportFileComponent,
    },
  ],
})
export class EditTemplateExportFileComponent
  extends CustomFormControlDirective<string>
  implements OnInit, EditComponent
{
  private readonly templateExportService = inject(TemplateExportService);

  @Input() entity: Entity;
  @Input() formFieldConfig: FormFieldConfig;

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }

  exportServerEnabled: boolean;

  ngOnInit(): void {
    // Check if export server is enabled
    this.templateExportService
      .isExportServerEnabled()
      .then((enabled) => (this.exportServerEnabled = enabled))
      .catch(() => (this.exportServerEnabled = false));
  }
}
