import { Component } from "@angular/core";
import { Note } from "../../model/note";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { NoteDetailsComponent } from "../../note-details/note-details.component";
import { OperatorFunction } from "rxjs";
import { map } from "rxjs/operators";
import { UntilDestroy } from "@ngneat/until-destroy";

@DynamicComponent("ImportantNotesDashboard")
@DynamicComponent("ImportantNotesComponent") // TODO remove after all existing instances are updated
@UntilDestroy()
@Component({
  selector: "app-important-notes-dashboard",
  templateUrl: "./important-notes-dashboard.component.html",
  styleUrls: ["./important-notes-dashboard.component.scss"],
})
export class ImportantNotesDashboardComponent
  implements OnInitDynamicComponent
{
  private relevantWarningLevels: string[] = [];
  dataMapper: (data: Note[]) => Note[] = (data) =>
    data
      .filter((note) => note.warningLevel && this.noteIsRelevant(note))
      .sort((a, b) => b.warningLevel._ordinal - a.warningLevel._ordinal);

  constructor(private formDialog: FormDialogService) {}

  onInitFromDynamicConfig(config: any) {
    this.relevantWarningLevels = config.warningLevels;
  }

  private noteIsRelevant(note: Note): boolean {
    return this.relevantWarningLevels.includes(note.warningLevel.id);
  }

  openNote(note: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, note);
  }
}
