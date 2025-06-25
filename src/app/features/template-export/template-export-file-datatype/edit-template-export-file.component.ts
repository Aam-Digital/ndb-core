import { Component, inject } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import {
  EditFileComponent,
  EditFileComponent_IMPORTS,
} from "../../file/edit-file/edit-file.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { TemplateExportApiService } from "../template-export-api/template-export-api.service";

/**
 * An edit component that allows to manage template files stored in the PDF Generator API.
 */
@DynamicComponent("EditTemplateExportFile")
@Component({
  selector: "app-template-export-file",
  templateUrl: "../../file/edit-file/edit-file.component.html",
  styleUrls: ["../../file/edit-file/edit-file.component.scss"],
  imports: EditFileComponent_IMPORTS,
})
export class EditTemplateExportFileComponent extends EditFileComponent {
  constructor() {
    inject(TemplateExportApiService);
    inject(AlertService);
    inject(EntityMapperService);
    inject<Navigator>(NAVIGATOR_TOKEN);

    super();
  }
}
