import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
} from "@angular/core";
import { Note } from "../../model/note";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { MatTableModule } from "@angular/material/table";
import { NgStyle } from "@angular/common";
import { CustomDatePipe } from "../../../../core/basic-datatypes/date/custom-date.pipe";

@DynamicComponent("ImportantNotesDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-important-notes-dashboard",
  templateUrl: "./important-notes-dashboard.component.html",
  styleUrls: ["./important-notes-dashboard.component.scss"],
  imports: [
    DashboardListWidgetComponent,
    MatTableModule,
    CustomDatePipe,
    NgStyle,
  ],
})
export class ImportantNotesDashboardComponent {
  private formDialog = inject(FormDialogService);

  static getRequiredEntities() {
    return Note.ENTITY_TYPE;
  }

  warningLevels = input<string[]>([]);
  dataMapper: (data: Note[]) => Note[] = (data) =>
    data
      .filter((note) => note.warningLevel && this.noteIsRelevant(note))
      .sort((a, b) => b.warningLevel._ordinal - a.warningLevel._ordinal);

  subtitle = input<string>(
    $localize`:dashboard widget subtitle:Notes needing follow-up`,
  );
  explanation = input<string>(
    $localize`:dashboard widget explanation:Notes require immediate attention or follow-up actions`,
  );

  private noteIsRelevant(note: Note): boolean {
    return this.warningLevels().includes(note.warningLevel.id);
  }

  openNote(note: Note) {
    this.formDialog.openView(note);
  }
}
