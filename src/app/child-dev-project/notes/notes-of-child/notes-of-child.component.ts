import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { Note } from "../model/note";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { DatePipe } from "@angular/common";
import { ChildrenService } from "../../children/children.service";
import moment from "moment";
import { SessionService } from "../../../core/session/session-service/session.service";
import { ColumnDescription } from "../../../core/entity-subrecord/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-subrecord/entity-subrecord/column-description-input-type.enum";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

/**
 * The component that is responsible for listing the Notes that are related to a certain child
 */
@UntilDestroy()
@Component({
  selector: "app-notes-of-child",
  templateUrl: "./notes-of-child.component.html",
  styleUrls: ["./notes-of-child.component.scss"],
})
export class NotesOfChildComponent implements OnInit, OnChanges {
  @Input() childId: string;
  records: Array<Note> = [];
  detailsComponent = NoteDetailsComponent;

  columns: Array<ColumnDescription> = [
    new ColumnDescription(
      "date",
      "Date",
      ColumnDescriptionInputType.DATE,
      null,
      (v: Date) => this.datePipe.transform(v, "yyyy-MM-dd"),
      "xs"
    ),
    new ColumnDescription(
      "subject",
      "Topic",
      ColumnDescriptionInputType.TEXT,
      null,
      undefined,
      "xs"
    ),
    new ColumnDescription(
      "text",
      "Notes",
      ColumnDescriptionInputType.TEXTAREA,
      null,
      undefined,
      "md"
    ),
    new ColumnDescription(
      "author",
      "SW",
      ColumnDescriptionInputType.TEXT,
      null,
      undefined,
      "md"
    ),
    new ColumnDescription(
      "warningLevel",
      "",
      ColumnDescriptionInputType.SELECT,
      [
        { value: "OK", label: "Solved" },
        { value: "WARNING", label: "Needs Follow-Up" },
        { value: "URGENT", label: "Urgent Follow-Up" },
      ],
      () => "",
      "md"
    ),
  ];

  constructor(
    private childrenService: ChildrenService,
    private sessionService: SessionService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.initNotesOfChild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("childId")) {
      this.initNotesOfChild();
    }
  }

  private initNotesOfChild() {
    if (!this.childId || this.childId === "") {
      return;
    }

    this.childrenService
      .getNotesOfChild(this.childId)
      .pipe(untilDestroyed(this))
      .subscribe((notes: Note[]) => {
        notes.sort((a, b) => {
          if (!a.date && b.date) {
            // note without date should be first
            return -1;
          }
          return moment(b.date).valueOf() - moment(a.date).valueOf();
        });
        this.records = notes;
      });
  }

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const user = this.sessionService.getCurrentUser()
      ? this.sessionService.getCurrentUser().name
      : "";
    const childId = this.childId;

    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();
      newNote.addChild(childId);
      newNote.author = user;

      return newNote;
    };
  }

  /**
   * returns the color for a record.
   * If this entity id is undefined, this will return the default color. Otherwise it will attempt
   * to get a specific color for this specific entity id
   * @param note The record to check for. The record must be an entity that has a <code>getColor()</code>-Method specified.
   * If this entityId is set, a <code>getColorForId()</code>-Method must be specified, that accepts this id.
   */
  getColor(note) {
    return note?.getColor();
  }
}
