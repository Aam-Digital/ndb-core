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
   * When setting this entity, this button will automatically be disabled
   * when the user does not have permission to edit the entity.
   * @param entity
   */
  @Input() set managingEntity(entity: Entity) {
    if (!this.canEdit(entity.getConstructor())) {
      this.disabled = true;
    }
  }

  @Output() onSave = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  @Input() editing: boolean = false;
  @Output() editingChange = new EventEmitter<boolean>();

  /**
   * Whether or not this button should be disabled
   */
  @Input() disabled: boolean = false;

  constructor(private entityPermissionService: EntityPermissionsService) {}

  canEdit(entity: typeof Entity): boolean {
    return this.entityPermissionService.userIsPermitted(
      entity,
      OperationType.UPDATE
    );
  }

  save() {
    this.onSave.emit();
    this.setEditing(false);
  }

  cancel() {
    this.onCancel.emit();
    this.setEditing(false);
  }

  private setEditing(editing: boolean) {
    this.editing = editing;
    this.editingChange.emit(editing);
  }

  toggleEdit() {
    this.editing = !this.editing;
    this.editingChange.emit(this.editing);
  }
}
