import { inject, Injectable } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";

/**
 * Additional context data (beyond the record itself) available in template placeholders.
 *
 * This is sent to the API as carbone's `complement` and can be used in templates
 * with the `{c.…}` prefix (e.g. `{c.user.name}`),
 * clearly separated from the record data available under `{d.…}`.
 */
export interface TemplateExportComplement {
  /**
   * The entity linked to the currently logged-in user (if any).
   */
  user?: Entity;
}

/**
 * Assemble the context data that is available in template placeholders
 * in addition to the record(s) a file is generated for.
 */
@Injectable({
  providedIn: "root",
})
export class TemplateExportContextService {
  private readonly currentUser = inject(CurrentUserSubject);

  /**
   * Build the context object to be sent alongside the record data.
   * @return the context or `undefined` if no context data is available at all
   */
  getComplement(): TemplateExportComplement | undefined {
    // CurrentUserSubject is `undefined` if not logged in and `null` if no entity is linked to the account
    const user = this.currentUser.value;

    return user ? { user } : undefined;
  }
}
