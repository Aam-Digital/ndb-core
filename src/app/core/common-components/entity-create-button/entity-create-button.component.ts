import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { Angulartics2OnModule } from "angulartics2";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-entity-create-button",
  standalone: true,
  imports: [
    CommonModule,
    DisableEntityOperationDirective,
    FaIconComponent,
    MatButtonModule,
    MatTableModule,
    Angulartics2OnModule,
    MatTooltipModule,
  ],
  templateUrl: "./entity-create-button.component.html",
  styleUrl: "./entity-create-button.component.scss",
})
export class EntityCreateButtonComponent<T extends Entity = Entity> {
  @Input() entityType: EntityConstructor<T>;

  /**
   * Optional factory method to create a new entity instance with some default values.
   * If not provided, the simple entityType constructor is used.
   */
  @Input() newRecordFactory?: () => T;

  /**
   * Emits a new entity instance when the user clicks the button.
   */
  @Output() entityCreate = new EventEmitter<T>();

  /**
   * Whether only an icon button without text should be displayed.
   * Default is false
   */
  @Input() iconOnly: boolean = false;

  /**
   * Create a new entity.
   * The entity is only written to the database when the user saves this record which is newly added in edit mode.
   */
  create() {
    const newRecord = this.newRecordFactory
      ? this.newRecordFactory()
      : new this.entityType();
    this.entityCreate.emit(newRecord);
  }
}
