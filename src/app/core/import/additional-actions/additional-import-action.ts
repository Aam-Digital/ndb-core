/**
 * Definition of an additional generic import action, e.g. linking imported records to an existing group entity.
 */
export type AdditionalImportAction =
  | AdditonalDirectLinkAction
  | AdditionalIndirectLinkAction;

interface AdditionalImportBaseAction {
  mode: "direct" | "indirect";

  /**
   * EntityType of the source entity
   * (i.e. the records being imported for which this can be an additional action, linking these source entities to the target entity)
   */
  sourceType: string;

  targetType?: string;
  targetId?: string;

  /**
   * Hide this action by default and only show in advanced UIs.
   */
  expertOnly?: boolean;
}

/**
 * Details of an import action that is executed in addition to creating the primary imported entities,
 * linking imported data directly to another existing entity (by updating that entity).
 */
export interface AdditonalDirectLinkAction extends AdditionalImportBaseAction {
  mode: "direct";

  /**
   * EntityType of the target entity (into which the entities should be linked)
   */
  targetType: string;

  /**
   * Attribute of the target entity to which the linked entities should be added
   */
  targetProperty: string;

  /**
   * ID of the target entity (into which the entities should be linked)
   */
  targetId?: string;
}

/**
 * Details of an import action that is executed in addition to creating the primary imported entities,
 * linking imported data indirectly to another existing entity (by creating new "relationship" entities).
 */
export interface AdditionalIndirectLinkAction extends AdditionalImportBaseAction {
  mode: "indirect";

  /**
   * ID of the target entity (to which the entities should be linked via the relationship entity)
   */
  targetId?: string;

  /**
   * EntityType of the relationship entity (used to reference both the imported and the target, e.g. "ChildSchoolRelation")
   */
  relationshipEntityType: string;

  /**
   * Attribute of the relationship entity that references the imported entity
   */
  relationshipProperty: string;

  /**
   * Attribute of the relationship entity that references the target entity
   */
  relationshipTargetProperty: string;

  /**
   * EntityType of the target entity (to which the entities should be linked)
   */
  targetType: string;
}
