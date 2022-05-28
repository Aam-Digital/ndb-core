import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { Note } from "../../model/note";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { NoteDetailsComponent } from "../../note-details/note-details.component";

@DynamicComponent("ImportantNotesComponent")
@Component({
  selector: "app-important-notes",
  templateUrl: "./important-notes.component.html",
  styleUrls: ["./important-notes.component.scss"],
})
export class ImportantNotesComponent
  implements OnInit, OnInitDynamicComponent, AfterViewInit {
  private relevantWarningLevels;
  public relevantNotes: Promise<Note[]>;
  public relevantNotesCount: Promise<number>;

  public notesDataSource = new MatTableDataSource<Note>();

  @ViewChild("paginator") private paginator: MatPaginator;

  constructor(
    private entityMapperService: EntityMapperService,
    private formDialog: FormDialogService
  ) {}

  ngOnInit(): void {
    this.relevantNotes = this.entityMapperService
      .loadType(Note)
      .then((notes) => notes.filter((note) => this.noteIsRelevant(note)))
      .then((notes) => (this.notesDataSource.data = notes));
    this.relevantNotesCount = this.relevantNotes.then((notes) => notes.length);
  }

  onInitFromDynamicConfig(config: any) {
    this.relevantWarningLevels = config.warningLevels;
  }

  ngAfterViewInit() {
    this.notesDataSource.paginator = this.paginator;
  }

  private noteIsRelevant(note: Note): boolean {
    return this.relevantWarningLevels.includes(note.warningLevel.id);
  }

  goToNote(note: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, note);
  }
}
