import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { Angulartics2OnModule } from "angulartics2";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-create-button",
  imports: [
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
  entityType = input<EntityConstructor<T>>();

  /** Optional factory method to create a new entity instance with some default values. */
  newRecordFactory = input<() => T>();

  /** Emits a new entity instance when the user clicks the button. */
  entityCreate = output<T>();

  /** Whether only an icon button without text should be displayed. */
  iconOnly = input<boolean>(false);

  create() {
    const entityType = this.entityType();
    if (!entityType) {
      return;
    }

    const factory = this.newRecordFactory();
    const newRecord = factory ? factory() : new entityType();
    this.entityCreate.emit(newRecord);
  }
}
