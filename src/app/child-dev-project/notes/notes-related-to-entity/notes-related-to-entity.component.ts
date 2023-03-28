import { Component, Input, OnInit } from "@angular/core";
import { Note } from "../model/note";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { ChildrenService } from "../../children/children.service";
import moment from "moment";
import { SessionService } from "../../../core/session/session-service/session.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../core/entity/model/entity";
import {
  ColumnConfig,
  DataFilter,
} from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterService } from "../../../core/filter/filter.service";
import { Child } from "../../children/model/child";
import { School } from "../../schools/model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

/**
 * The component that is responsible for listing the Notes that are related to a certain entity.
 */
@DynamicComponent("NotesRelatedToEntity")
@DynamicComponent("NotesOfChild") // for backward compatibility
@Component({
  selector: "app-notes-related-to-entity",
  templateUrl: "./notes-related-to-entity.component.html",
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class NotesRelatedToEntityComponent implements OnInit {
  @Input() entity: Entity;
  records: Array<Note> = [];

  @Input() columns: ColumnConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "subject", visibleFrom: "xs" },
    { id: "text", visibleFrom: "md" },
    { id: "authors", visibleFrom: "md" },
    { id: "warningLevel", visibleFrom: "md" },
  ];
  @Input() filter: DataFilter<Note> = {};

  /**
   * returns the color for a note; passed to the entity subrecord component
   * @param note note to get color for
   */
  getColor = (note: Note) => note?.getColor();
  newRecordFactory: () => Note;

  constructor(
    private childrenService: ChildrenService,
    private sessionService: SessionService,
    private formDialog: FormDialogService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    if (this.entity.getType() === Child.ENTITY_TYPE) {
      // When displaying notes for a child, use attendance color highlighting
      this.getColor = (note: Note) => note?.getColorForId(this.entity.getId());
    }
    this.newRecordFactory = this.generateNewRecordFactory();
    this.initNotesOfEntity();
  }

  private initNotesOfEntity() {
    this.childrenService
      .getNotesRelatedTo(this.entity.getId(true))
      .then((notes: Note[]) => {
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
    const user = this.sessionService.getCurrentUser().name;

    return () => {
      const newNote = new Note(Date.now().toString());
      newNote.date = new Date();

      //TODO: generalize this code - possibly by only using relatedEntities to link other records here? see #1501
      if (this.entity.getType() === Child.ENTITY_TYPE) {
        newNote.addChild(this.entity as Child);
      } else if (this.entity.getType() === School.ENTITY_TYPE) {
        newNote.addSchool(this.entity as School);
      } else if (this.entity.getType() === ChildSchoolRelation.ENTITY_TYPE) {
        newNote.addChild((this.entity as ChildSchoolRelation).childId);
        newNote.addSchool((this.entity as ChildSchoolRelation).schoolId);
        newNote.relatedEntities.push(this.entity.getId(true));
      } else {
        newNote.relatedEntities.push(this.entity.getId(true));
      }

      if (!newNote.authors.includes(user)) {
        // TODO: should we keep authors completely separate of also add them into the relatedEntities as well?
        newNote.authors.push(user);
      }
      this.filterService.alignEntityWithFilter(newNote, this.filter);

      return newNote;
    };
  }

  showNoteDetails(note: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, note);
  }
}
