/**
 * Definition of an additional generic import action, e.g. linking imported records to an existing group entity.
 */
export type AdditionalImportAction =
  | AdditonalDirectLinkAction
  | AdditionalIndirectLinkAction;

export interface AdditonalDirectLinkAction {
  mode: "direct";

  /**
   * EntityType of the source entity
   * (i.e. the records being imported for which this can be an additional action, linking these source entities to the target entity)
   */
  sourceType: string;

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

export interface AdditionalIndirectLinkAction {
  mode: "indirect";

  /**
   * EntityType of the source entity
   * (i.e. the records being imported for which this can be an additional action, linking these source entities to the target entity)
   */
  sourceType: string;

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
