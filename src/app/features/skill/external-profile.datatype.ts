import { StringDatatype } from "../../core/basic-datatypes/string/string.datatype";
import { Injectable } from "@angular/core";

/**
 * Datatype for linking (and storing a selected link) to an external profile
 * (also see SkillApiService).
 *
 * Usage in config (see ExternalProfileLinkConfig):
 * ```json
 * {
 *   "name": "myExternalProfile",
 *   "schema": {
 *     "dataType": "external-profile-link",
 *     "label": "Related external profile",
 *     "additional": {
 *       "searchFields": {
 *         "fullName": ["firstname", "lastname"],
 *         "email": ["email"],
 *       },
 *       "applyData": [
 *         { from: "email", to: "emailAddedFromExternal" },
 *       ],
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class ExternalProfileDatatype extends StringDatatype {
  static override dataType = "external-profile";

  // do not define human-readable label to hide this datatype from the admin users (because required config does not have a UI currently)
  // static override label: string = $localize`:datatype-label:external profile integration`;

  override editComponent = "EditExternalProfileLink";
}
