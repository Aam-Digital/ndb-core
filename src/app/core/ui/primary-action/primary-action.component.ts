import { Component } from "@angular/core";
import { Note } from "../../../child-dev-project/notes/model/note";
import { SessionService } from "../../session/session-service/session.service";
import { NoteDetailsComponent } from "../../../child-dev-project/notes/note-details/note-details.component";
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
  standalone: true,
})
export class PrimaryActionComponent {
  noteConstructor = Note;

  constructor(
    private sessionService: SessionService,
    private formDialog: FormDialogService
  ) {}

  /**
   * The primary action to be triggered when the user clicks the hovering button.
   */
  primaryAction() {
    this.formDialog.openSimpleForm(
      this.createNewNote(),
      [],
      NoteDetailsComponent
    );
  }

  private createNewNote() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.authors = [this.sessionService.getCurrentUser().name];
    return newNote;
  }
}
