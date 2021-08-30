import { Component } from "@angular/core";
import { Note } from "../../../child-dev-project/notes/model/note";
import { SessionService } from "../../session/session-service/session.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { OperationType } from "../../permissions/entity-permissions.service";
import { QuickActionService } from "./quick-action.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

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
})
@UntilDestroy()
export class PrimaryActionComponent {
  noteConstructor = Note;
  operationType = OperationType;

  primaryAction: () => void;
  icon: string;

  constructor(
    private sessionService: SessionService,
    private formDialog: FormDialogService,
    private quickActionService: QuickActionService
  ) {
    this.quickActionService
      .onChange()
      .pipe(untilDestroyed(this))
      .subscribe((qa) => {
        this.primaryAction = qa.action;
        this.icon = qa.icon;
      });
  }

  /**
   * The primary action to be triggered when the user clicks the hovering button.
   *
  primaryAction() {
    this.formDialog.openDialog(NoteDetailsComponent, this.createNewNote());
  }
   */

  private createNewNote() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.authors = [this.sessionService.getCurrentUser().name];
    return newNote;
  }
}
