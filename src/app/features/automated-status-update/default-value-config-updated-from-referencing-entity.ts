/**
 * Special default value rule to continuously updates the value based a field of another related entity.
 */
export interface DefaultValueConfigUpdatedFromReferencingEntity {
  /**
   * entitytype of the related entity that triggers the update
   */
  relatedEntityType: string;

  /**
   * field ID of the relatedEntity that holds the reference to this field's entity.
   *
   * e.g. if a child's field should be updated based on a school's value then
   * this is the field on the school entity of type "entity", holding the child's entity for the relevant relation
   */
  relatedReferenceField: string;

  /**
   * field ID of the relatedEntity which triggers updates of this value
   */
  relatedTriggerField: string;

  /**
   * Key-Value map defining "when-then" rules to update the value, where
   * keys are values of the relatedEntity's relatedTriggerField and
   * mapped values are the new values of this field that get updated automatically
   */
  automatedMapping: { [key: string]: string };
}
