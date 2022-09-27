import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { Note } from "../../model/note";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { NoteDetailsComponent } from "../../note-details/note-details.component";
import { applyUpdate } from "../../../../core/entity/model/entity-update";
import { concat, Observable } from "rxjs";
import { first, map } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@DynamicComponent("ImportantNotesComponent")
@UntilDestroy()
@Component({
  selector: "app-important-notes",
  templateUrl: "./important-notes.component.html",
  styleUrls: ["./important-notes.component.scss"],
})
export class ImportantNotesComponent
  implements OnInit, OnInitDynamicComponent, AfterViewInit
{
  private relevantWarningLevels: string[] = [];

  private notes: Observable<Note[]>;
  public loading: boolean = true;

  public notesDataSource = new MatTableDataSource<Note>();

  @ViewChild("paginator") private paginator: MatPaginator;

  constructor(
    private entityMapperService: EntityMapperService,
    private formDialog: FormDialogService
  ) {}

  ngOnInit(): void {
    // This feed always contains the latest notes plus the initial notes
    this.notes = concat(
      this.entityMapperService.loadType(Note),
      this.entityMapperService
        .receiveUpdates(Note)
        .pipe(map((next) => applyUpdate(this.notesDataSource.data, next)))
    );
    // set loading to `false` when the first chunk of notes (the initial notes) have arrived
    this.notes.pipe(first()).subscribe(() => (this.loading = false));
    this.notes.pipe(untilDestroyed(this)).subscribe((next) => {
      this.notesDataSource.data = next
        .filter((note) => note.warningLevel && this.noteIsRelevant(note))
        .sort((a, b) => b.warningLevel._ordinal - a.warningLevel._ordinal);
    });
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

  openNote(note: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, note);
  }
}
