import { Component, Input, OnInit } from "@angular/core";
import { Note } from "../model/note";
import { NoteDetailsComponent } from "../note-details/note-details.component";
import { ChildrenService } from "../../children/children.service";
import moment from "moment";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../core/entity/model/entity";
import {
  ColumnConfig,
  DataFilter,
} from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterService } from "../../../core/filter/filter.service";
import { Child } from "../../children/model/child";
import { School } from "../../schools/model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { EntitySubrecordComponent } from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { EntityArrayDatatype } from "../../../core/basic-datatypes/entity-array/entity-array.datatype";
import { asArray } from "../../../utils/utils";

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
  isLoading: boolean;

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
    private formDialog: FormDialogService,
    private filterService: FilterService,
  ) {}

  ngOnInit(): void {
    if (this.entity.getType() === Child.ENTITY_TYPE) {
      // When displaying notes for a child, use attendance color highlighting
      this.getColor = (note: Note) => note?.getColorForId(this.entity.getId());
    }
    this.newRecordFactory = this.generateNewRecordFactory();
    this.initNotesOfEntity();
  }

  private async initNotesOfEntity() {
    this.isLoading = true;

    this.records = await this.childrenService
      .getNotesRelatedTo(this.entity.getId())
      .then((notes: Note[]) => {
        notes.sort((a, b) => {
          if (!a.date && b.date) {
            // note without date should be first
            return -1;
          }
          return moment(b.date).valueOf() - moment(a.date).valueOf();
        });
        return notes;
      });

    this.isLoading = false;
  }

  generateNewRecordFactory() {
    return () => {
      const newNote = new Note(Date.now().toString());

      //TODO: generalize this code - possibly by only using relatedEntities to link other records here? see #1501
      if (this.entity.getType() === Child.ENTITY_TYPE) {
        newNote.addChild(this.entity as Child);
      } else if (this.entity.getType() === School.ENTITY_TYPE) {
        newNote.addSchool(this.entity as School);
      } else if (this.entity.getType() === ChildSchoolRelation.ENTITY_TYPE) {
        newNote.addChild((this.entity as ChildSchoolRelation).childId);
        newNote.addSchool((this.entity as ChildSchoolRelation).schoolId);
      }

      newNote.relatedEntities.push(this.entity.getId());
      this.getIndirectlyRelatedEntityIds(this.entity).forEach((e) =>
        newNote.relatedEntities.push(e),
      );

      this.filterService.alignEntityWithFilter(newNote, this.filter);

      return newNote;
    };
  }

  /**
   * Get entities referenced in the given entity that match the entity types allowed for Note.relatedEntities schema
   * and return their ids (including prefix).
   * @param entity
   * @private
   */
  private getIndirectlyRelatedEntityIds(entity: Entity): string[] {
    let relatedIds = [];
    let permittedRelatedTypes = asArray(
      Note.schema.get("relatedEntities").additional,
    );

    for (const [property, schema] of entity.getSchema().entries()) {
      if (!entity[property]) {
        // empty - skip
        continue;
      }

      if (
        schema.dataType !== EntityDatatype.dataType &&
        schema.dataType !== EntityArrayDatatype.dataType
      ) {
        // not referencing other entities
        continue;
      }

      for (const referencedId of asArray(entity[property])) {
        const referencedType = Entity.extractTypeFromId(referencedId);

        if (permittedRelatedTypes.includes(referencedType)) {
          // entity can have references of multiple entity types of which only some are allowed to be linked to Notes
          relatedIds.push(
            Entity.createPrefixedId(referencedType, referencedId),
          );
        }
      }
    }

    return relatedIds;
  }

  showNoteDetails(note: Note) {
    this.formDialog.openFormPopup(note, [], NoteDetailsComponent);
  }
}
