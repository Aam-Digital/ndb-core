import { Note } from "../model/note";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { Entity } from "../../../core/entity/model/entity";
import { asArray } from "app/utils/asArray";

/**
 * Link a new note's source entity in the legacy Note fields, if the system still has them configured.
 *
 * This only applies to a ChildSchoolRelation, whose child and school used to be linked
 * in `children` / `schools` rather than in the generic `relatedEntities`.
 * The `children` / `schools` fields are now only defined in the config of systems that still
 * rely on them (see the `oneoff-20261008-note-legacy-child-school-fields` CLI migration).
 * Systems without those fields link both through `relatedEntities` (if permitted there).
 *
 * @param newNote the note being created, modified in place
 * @param entity the entity the new note is created from
 */
export function linkLegacyNoteFields(newNote: Note, entity: Entity) {
  if (entity?.getType() !== ChildSchoolRelation.ENTITY_TYPE) {
    return;
  }

  const relation = entity as ChildSchoolRelation;
  linkInLegacyField(newNote, "children", relation.childId);
  linkInLegacyField(newNote, "schools", relation.schoolId);
}

function linkInLegacyField(newNote: Note, field: string, ids: unknown) {
  if (!Note.schema.has(field)) {
    return;
  }

  for (const id of asArray(ids)) {
    if (id) {
      newNote[field] ??= [];
      newNote[field].push(id);
    }
  }
}
