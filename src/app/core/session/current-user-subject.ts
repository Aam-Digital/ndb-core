import { BehaviorSubject } from "rxjs";
import { Entity } from "../entity/model/entity";
import { Injectable } from "@angular/core";

/**
 * The Entity linked to the currently logged-in user, which can be used to pre-fill forms or customize workflows.
 *
 * This value is
 * - an entity object from the database, if the user account is linked to a valid entity (via the "exact_username" attribute)
 * - `undefined even not logged in (e.g. when using a public form as an anonymous visitor)
 * - `null` when no entity is linked to the current user or the linked entityId is invalid (doc not found in database)
 *
 * This distinction between "undefined" and "null" helps navigate some special cases, e.g. in the AbilityService.
 */
@Injectable()
export class CurrentUserSubject extends BehaviorSubject<Entity> {
  constructor() {
    super(undefined);
  }
}
