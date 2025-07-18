import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Note } from "../../../child-dev-project/notes/model/note";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * The "Primary Action" is always displayed hovering over the rest of the app as a quick action for the user.
 *
 * This is a UX concept also used in many Android apps.
 * see {@link https://material.io/components/buttons-floating-action-button/}
 */
@Component({
  selector: "app-primary-action",
  templateUrl: "./primary-action.component.html",
  styleUrls: ["./primary-action.component.scss"],
  imports: [
    MatButtonModule,
    Angulartics2Module,
    DisableEntityOperationDirective,
    FontAwesomeModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryActionComponent {
  private formDialog = inject(FormDialogService);

  noteConstructor = Note;

  /**
   * The primary action to be triggered when the user clicks the hovering button.
   */
  primaryAction() {
    this.formDialog.openView(this.createNewNote(), "NoteDetails");
  }

  private createNewNote() {
    return new Note();
  }
}
