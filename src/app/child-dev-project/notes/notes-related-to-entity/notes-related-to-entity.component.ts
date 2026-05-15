import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Note } from "../model/note";
import { ChildrenService } from "../../children/children.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { asArray } from "app/utils/asArray";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponent } from "../../../core/entity-details/related-entities/related-entities.component";
import { CustomFormLinkButtonComponent } from "app/features/public-form/custom-form-link-button/custom-form-link-button.component";
import { RELATED_ENTITIES_DEFAULT_CONFIGS } from "app/utils/related-entities-default-config";

/**
 * The component that is responsible for listing the Notes that are related to a certain entity.
 */
@DynamicComponent("NotesRelatedToEntity")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-notes-related-to-entity",
  templateUrl: "./notes-related-to-entity.component.html",
  imports: [EntitiesTableComponent, CustomFormLinkButtonComponent],
})
export class NotesRelatedToEntityComponent
  extends RelatedEntitiesComponent<Note>
{
  private childrenService = inject(ChildrenService);
  private formDialog = inject(FormDialogService);

  override entityCtr = Note;
  override _columns: FormFieldConfig[] =
    RELATED_ENTITIES_DEFAULT_CONFIGS["NotesRelatedToEntity"].columns;

  readonly getColor = computed(() => {
    if (this.entity()?.getType() === "Child") {
      return (note: Note) => note?.getColorForId(this.entity()?.getId());
    }
    return (note: Note) => note?.getColor();
  });
  newRecordFactory = this.createNewRecordFactory();

  override getData() {
    const entityId = this.entity()?.getId();
    if (!entityId) {
      return Promise.resolve([]);
    }
    return this.childrenService.getNotesRelatedTo(entityId);
  }

  override createNewRecordFactory() {
    return () => {
      const newNote = super.createNewRecordFactory()();

      const entity = this.entity();
      if (!entity) {
        return newNote;
      }
      if (entity.getType() === ChildSchoolRelation.ENTITY_TYPE) {
        this.specialLinkingForChildSchoolRelation(newNote);
      }

      for (const e of [
        entity.getId(),
        ...this.getIndirectlyRelatedEntityIds(entity),
      ]) {
        if (!this.isAlreadyLinked(newNote, e)) {
          newNote.relatedEntities.push(e);
        }
      }

      return newNote;
    };
  }

  private specialLinkingForChildSchoolRelation(newNote: Note) {
    //TODO: generalize this code - possibly by only using relatedEntities to link other records here? see #1501
    for (const childId of asArray(
      (this.entity() as ChildSchoolRelation).childId,
    )) {
      if (childId) {
        newNote.children.push(childId);
      }
    }

    for (const schooldId of asArray(
      (this.entity() as ChildSchoolRelation).schoolId,
    )) {
      if (schooldId) {
        newNote.schools.push(schooldId);
      }
    }
  }

  /**
   * check if an entityId is already referenced in any array properties of the given note
   */
  private isAlreadyLinked(newNote: any, id: string): boolean {
    for (const key in newNote) {
      if (asArray(newNote[key]).includes(id)) {
        return true;
      }
    }
    return false;
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

      if (schema.dataType !== EntityDatatype.dataType) {
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
    this.formDialog.openView(note);
  }
}
