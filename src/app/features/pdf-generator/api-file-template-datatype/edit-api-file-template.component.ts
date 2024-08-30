import { Component, Inject } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import {
  EditFileComponent,
  EditFileComponent_IMPORTS,
} from "../../file/edit-file/edit-file.component";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { PdfGeneratorApiService } from "../pdf-generator-api/pdf-generator-api.service";

/**
 * An edit component that allows to manage template files stored in the PDF Generator API.
 */
@DynamicComponent("EditApiFileTemplate")
@Component({
  selector: "app-edit-api-file-template",
  templateUrl: "../../file/edit-file/edit-file.component.html",
  styleUrls: ["../../file/edit-file/edit-file.component.scss"],
  imports: EditFileComponent_IMPORTS,
  standalone: true,
})
export class EditApiFileTemplateComponent extends EditFileComponent {
  constructor(
    pdfGeneratorApiService: PdfGeneratorApiService,
    alertService: AlertService,
    entityMapper: EntityMapperService,
    @Inject(NAVIGATOR_TOKEN) navigator: Navigator,
  ) {
    super(pdfGeneratorApiService, alertService, entityMapper, navigator);
  }
}
