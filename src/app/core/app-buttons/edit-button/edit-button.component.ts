import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Entity } from "../../entity/entity";
import {
  EntityPermissionsService,
  OperationType,
} from "../../permissions/entity-permissions.service";

/**
 * A button that has two states; editing or not editing.
 * Can additionally be disabled based on the entity a user is
 * currently editing. To enable this behavior, set the `managingEntity`
 * input
 */
@Component({
  selector: "app-edit-button",
  templateUrl: "./edit-button.component.html",
  styleUrls: ["./edit-button.component.scss"],
})
export class EditButtonComponent {
  /**
   * Emits, whenever the user clicks on the button
   */
  @Output() toggleEditing = new EventEmitter<void>();

  /**
   * Whether or not this button should be disabled
   */
  @Input() disabled: boolean = false;

  /**
   * When setting this entity, this button will automatically be disabled
   * when the user does not have permission to edit the entity.
   * @param entity
   */
  @Input() set managingEntity(entity: typeof Entity) {
    if (
      !this.entityPermissionService.userIsPermitted(
        entity,
        OperationType.UPDATE
      )
    ) {
      this.disabled = true;
    }
  }

  constructor(private entityPermissionService: EntityPermissionsService) {}

  toggleEdit() {
    this.toggleEditing.emit();
  }
}
