import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Note } from "../model/note";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { DatePipe } from "@angular/common";
import { ChildrenService } from "../../children/children.service";
import moment from "moment";
import { SessionService } from "../../../core/session/session-service/session.service";
import { ColumnDescription } from "../../../core/entity-subrecord/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-subrecord/entity-subrecord/column-description-input-type.enum";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";

/**
 * The component that is responsible for listing the Notes that are related to a certain entity
 */
@UntilDestroy()
@Component({
  selector: "app-notes-of-child",
  templateUrl: "./notes-of-child.component.html",
  styleUrls: ["./notes-of-child.component.scss"],
})
export class NotesOfChildComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.initNotesOfChild();
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.child = config.child;
    this.initNotesOfChild();
  }

  private initNotesOfChild() {
    this.childrenService
      .getNotesOfChild(this.child.getId())
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
    const childId = this.child.getId();

    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();
      newNote.addChild(childId);
      newNote.author = user;

      return newNote;
    };
  }

  /**
   * returns the color for a note; passed to the entity subrecored component
   * @param note note to get color for
   */
  getColor = (note: Note) => note?.getColorForId(this.child.getId());
}
