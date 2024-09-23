import { Injectable } from "@angular/core";
import { StringDatatype } from "../../../core/basic-datatypes/string/string.datatype";

/**
 * Datatype for managing template files of the PDF Generator API.
 *
 * Only a string templateId of the API is stored on the entity itself.
 */
@Injectable()
export class TemplateExportFileDatatype extends StringDatatype {
  static override dataType = "template-export-file";
  static override label: string = undefined; // only used internally, not offered to users in Admin UI

  override viewComponent = "ViewFile";
  override editComponent = "EditTemplateExportFile";
}
