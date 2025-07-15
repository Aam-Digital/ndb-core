import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import {
  EditFileComponent,
  EditFileComponent_IMPORTS,
} from "../../file/edit-file/edit-file.component";

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
export class EditTemplateExportFileComponent extends EditFileComponent {}
