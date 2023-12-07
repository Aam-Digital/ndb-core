import { Pipe, PipeTransform } from "@angular/core";
import { EntityAction, EntitySubject } from "../permission-types";
import { EntityAbility } from "../ability/entity-ability";

/**
 * Checks whether the current user has permissions to perform the given action.
 *
 * Can be used in an *ngIf directive, for example.
 */
@Pipe({
  name: "hasPermission",
  standalone: true,
})
export class HasPermissionPipe implements PipeTransform {
  constructor(private ability: EntityAbility) {}

  transform(value: {
    operation: EntityAction;
    entity: EntitySubject;
  }): boolean {
    if (!value || !value.operation || !value.entity) {
      return false;
    }

    return this.ability.can(value.operation, value.entity);
  }
}
