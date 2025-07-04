/**
 * Configuration for related entity components like RelatedEntitiesComponent or RelatedEntitiesWithSummaryComponent.
 * This interface allows dynamic assignment of component behavior based on the entity type, including which
 * component to use, what property relates the entity, and custom loader methods.
 */
export interface RelatedEntitiesComponentConfig {
  /**
   * The string identifier of the related entity type (e.g., "Aser", "HealthCheck").
   */
  entityType: string;

  /**
   * (Optional)The name of the component to be rendered (e.g., "RelatedEntities", "RelatedEntitiesWithSummary").
   */
  component?: string;

  /**
   * (Optional) The property on the related entity that links it to the main entity.
   */
  property?: string | string[];

  /**
   * (Optional) A custom loader method to fetch related entities.
   */
  loaderMethod?: string;

  /**
   * If set to `true`, the component will assume that there can be only one active related entity at a time
   * (e.g., only one currently attended school per child).
   */
  single?: boolean;

  /**
   * Whether inactive/archived records should be shown.
   */
  showInactive?: boolean;
}
