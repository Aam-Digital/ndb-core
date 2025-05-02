/**
 * Describes the default value behaviour of this field,
 * i.e. that this field should automatically be filled with a value when creating a new entity
 */
export interface DefaultValueConfig {
  /**
   * What kind of logic is used to generate the default value:
   *
   *  mode: inherited
   *  use the value from linked entity field
   *
   *  mode: static
   *  use a static default value
   *
   *  mode: dynamic
   *  use a placeholder value, see PLACEHOLDERS enum for available options
   */
  mode: DefaultValueMode;

  /** used as default value in "static" and "dynamic" mode */
  value?: any;

  /** local field holding the reference to an Entity (for inherited only) */
  localAttribute?: string;

  /** field on the referenced Entity (identified by the id value in `localAttribute`), which is used as default value (for inherited only) */
  field?: string;

  /**
   * automation rules that trigger updates in related entities when this field changes.
   */
  automatedConfigRule?: AutomatedConfigRule;
}

export type DefaultValueMode =
  | "inherited-from-referenced-entity"
  | "static"
  | "dynamic"
  | "updated-from-referencing-entity";

/**
 * Special default value rule to continuously updates the value based a field of another related entity.
 */
export interface AutomatedConfigRule {
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
