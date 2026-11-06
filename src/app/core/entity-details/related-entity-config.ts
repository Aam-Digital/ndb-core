import { DataSourceConfig } from "#src/app/core/common-components/entities-table/data-source/data-source-registry";
import { ColumnConfig } from "../common-components/entity-form/FormConfig";

/**
 * Configuration for related entity components like RelatedEntitiesComponent or RelatedEntitiesWithSummaryComponent.
 * This interface allows dynamic assignment of component behavior based on the entity type, including which
 * component to use, what property relates the entity, and custom loader methods.
 */
export interface RelatedEntitiesComponentConfig {
  /**
   * The string identifier of the related entity type (e.g., "Aser", "HealthCheck").
   */
  entityType?: string;

  /**
   * Select what kind of data source is used for the table:
   * the name of a data source in the `DataSourceRegistry`
   * ("in-memory", "paginated" or one registered by a feature module),
   * or such a name with options for the data source: `{ "name": "...", "config": { ... } }`.
   * (optional) default is "paginated" in online-only session and "in-memory" otherwise,
   * see `resolveDataSource` in `data-source-resolver.ts`
   */
  dataSource?: string | DataSourceConfig;

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

  /**
   * Columns to be displayed in the table and popup form.
   */
  columns: ColumnConfig[];
}
