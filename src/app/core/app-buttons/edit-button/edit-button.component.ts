import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Entity } from "../../entity/entity";
import {
  EntityPermissionsService,
  OperationType,
} from "../../permissions/entity-permissions.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";

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
    if (
      !this.entityPermissionService.userIsPermitted(
        entity.getConstructor(),
        OperationType.UPDATE
      )
    ) {
      this.disabled = true;
    }
  }
  /**
   * Emits, whenever the user clicks on the button
   */
  @Output() toggleEditing = new EventEmitter<void>();

  @Input() saveDisabled: boolean = false;

  @Input() onSave: () => void = this.defaultSave;
  @Input() onCancel: () => void = this.defaultCancel;

  @Input() editing: boolean = false;
  @Output() editingChanged = new EventEmitter<boolean>();

  /**
   * Whether or not this button should be disabled
   */
  @Input() disabled: boolean = false;

  constructor(
    private entityPermissionService: EntityPermissionsService,
    private entityMapperService: EntityMapperService
  ) {}

  canEdit(entity: typeof Entity): boolean {
    return this.entityPermissionService.userIsPermitted(
      entity,
      OperationType.UPDATE
    );
  }

  private defaultCancel() {
    this.editing = false;
  }

  private async defaultSave() {
    await this.entityMapperService.save(this.managingEntity);
  }

  toggleEdit() {
    this.editing = !this.editing;
    this.editingChanged.emit(this.editing);
  }
}
