import { EventEmitter, Injectable } from "@angular/core";

/**
 * Simply service to centralize updates between various admin components in the form builder.
 */
@Injectable({
  providedIn: "root",
})
export class AdminEntityService {
  public entitySchemaUpdated = new EventEmitter<void>();
}
