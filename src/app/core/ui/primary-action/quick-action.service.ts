import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { SessionService } from "../../session/session-service/session.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { Note } from "../../../child-dev-project/notes/model/note";
import { NoteDetailsComponent } from "../../../child-dev-project/notes/note-details/note-details.component";

export interface IQuickAction {
  action: () => void;

  icon: string;
}

@Injectable({
  providedIn: "root",
})
export class QuickActionService {
  private changeSubject: BehaviorSubject<IQuickAction>;
  private readonly defaultQuickAction: IQuickAction;

  constructor(
    private sessionService: SessionService,
    private formDialog: FormDialogService
  ) {
    this.defaultQuickAction = {
      action: () =>
        this.formDialog.openDialog(NoteDetailsComponent, this.createNewNote()),
      icon: "fa-file-text-o",
    };
    this.changeSubject = new BehaviorSubject(this.defaultQuickAction);
  }

  private createNewNote() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.authors = [this.sessionService.getCurrentUser().getId()];
    return newNote;
  }

  onChange(): Observable<IQuickAction> {
    return this.changeSubject.asObservable();
  }

  setQuickAction(quickAction: IQuickAction) {
    this.changeSubject.next(quickAction);
  }

  resetQuickAction() {
    this.setQuickAction(this.defaultQuickAction);
  }
}
