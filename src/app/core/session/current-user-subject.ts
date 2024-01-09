import { BehaviorSubject } from "rxjs";
import { Entity } from "../entity/model/entity";
import { Injectable } from "@angular/core";

/**
 * The Entity linked to the currently logged-in user, which can be used to pre-fill forms or customize workflows.
 * This might be undefined even when logged in. E.g. when using an administrative support account.
 */
@Injectable()
export class CurrentUserSubject extends BehaviorSubject<Entity> {
  constructor() {
    super(undefined);
  }
}
