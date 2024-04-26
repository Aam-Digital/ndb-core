import { Component } from "@angular/core";
import { Note } from "../model/note";
import { ChildrenService } from "../../children/children.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { FilterService } from "../../../core/filter/filter.service";
import { Child } from "../../children/model/child";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { asArray } from "../../../utils/utils";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";

/**
 * The component that is responsible for listing the Notes that are related to a certain entity.
 */
@DynamicComponent("NotesRelatedToEntity")
@DynamicComponent("NotesOfChild") // for backward compatibility
@Component({
  selector: "app-notes-related-to-entity",
  templateUrl: "./notes-related-to-entity.component.html",
  imports: [EntitiesTableComponent],
  standalone: true,
})
export class NotesRelatedToEntityComponent extends RelatedEntitiesComponent<Note> {
  override entityCtr = Note;
  override _columns: FormFieldConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "subject", visibleFrom: "xs" },
    { id: "text", visibleFrom: "md" },
    { id: "authors", visibleFrom: "md" },
    { id: "warningLevel", visibleFrom: "md" },
  ];

  /**
   * returns the color for a note; passed to the entity subrecord component
   * @param note note to get color for
   */
  getColor = (note: Note) => note?.getColor();
  newRecordFactory = this.createNewRecordFactory();

  constructor(
    private childrenService: ChildrenService,
    private formDialog: FormDialogService,
    entityMapper: EntityMapperService,
    entities: EntityRegistry,
    screenWidthObserver: ScreenWidthObserver,
    filterService: FilterService,
  ) {
    super(entityMapper, entities, screenWidthObserver, filterService);
  }

  override ngOnInit() {
    if (this.entity.getType() === Child.ENTITY_TYPE) {
      // When displaying notes for a child, use attendance color highlighting
      this.getColor = (note: Note) => note?.getColorForId(this.entity.getId());
    }
    return super.ngOnInit();
  }

  override getData() {
    return this.childrenService.getNotesRelatedTo(this.entity.getId());
  }

  override createNewRecordFactory() {
    return () => {
      const newNote = super.createNewRecordFactory()();
      //TODO: generalize this code - possibly by only using relatedEntities to link other records here? see #1501
      if (this.entity.getType() === ChildSchoolRelation.ENTITY_TYPE) {
        newNote.addChild((this.entity as ChildSchoolRelation).childId);
        newNote.addSchool((this.entity as ChildSchoolRelation).schoolId);
      }

      newNote.relatedEntities.push(this.entity.getId());
      this.getIndirectlyRelatedEntityIds(this.entity).forEach((e) =>
        newNote.relatedEntities.push(e),
      );

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
        schema.innerDataType !== EntityDatatype.dataType
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
    this.formDialog.openView(note, "NoteDetails");
  }
}
