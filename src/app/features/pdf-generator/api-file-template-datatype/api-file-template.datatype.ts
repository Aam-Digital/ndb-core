import { Injectable } from "@angular/core";
import { StringDatatype } from "../../../core/basic-datatypes/string/string.datatype";

/**
 * Datatype for managing template files of the PDF Generator API.
 *
 * Only a string templateId of the API is stored on the entity itself.
 */
@Injectable()
export class ApiFileTemplateDatatype extends StringDatatype {
  static override dataType = "api-file-template";
  static override label: string = undefined; // only used internally, not offered to users in Admin UI

  override viewComponent = "ViewFile";
  override editComponent = "EditApiFileTemplate";
}
