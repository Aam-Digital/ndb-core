import { FilterConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import {
  ColumnConfig,
  DataFilter,
} from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";

/**
 * Config to be defined to set up a MatchingEntitiesComponent.
 */
export interface MatchingEntitiesConfig {
  /**
   * mapped columns to be compared side-by-side between the two entities to match.
   *
   * e.g. [["name", "name"], ["motherTongue", "language"]]
   */
  columns?: [string, string][];

  /**
   * Mapped properties which should be displayed in a map (of left and right entity).
   * The properties need to have the format `{ lat: number, lon: number}`.
   *
   * e.g. `["address", "location"]
   */
  showMap?: [string, string];

  /** overwrite the button label to describe the matching action */
  matchActionLabel?: string;

  /** details of what is created when matching two entities */
  onMatch?: NewMatchAction;

  /** details of entities on this side of the matching view */
  leftSide?: MatchingSideConfig;

  /** details of entities on this side of the matching view */
  rightSide?: MatchingSideConfig;
}

export interface MatchingSideConfig {
  /**
   * entity type of matching, used to load a list of available entities for manual selection
   */
  entityType?: EntityConstructor | string;

  /** fixed pre-filters applied to remove some entities from the list of available entities */
  prefilter?: DataFilter<Entity>;

  /** UI filter elements displayed for users to filter available entities */
  availableFilters?: FilterConfig[];

  /** columns of the available entities table. Usually inferred from matching columns of the component */
  columns?: ColumnConfig[];
}

export interface NewMatchAction {
  /** the entity type to be created on matching to represent the new match */
  newEntityType: string;

  /** name of the property on newEntityType that should take the id of the left matching entity */
  newEntityMatchPropertyLeft: string;

  /** name of the property on newEntityType that should take the id of the right matching entity */
  newEntityMatchPropertyRight: string;

  /**
   * columns to display in a popup to review, edit and confirm during creation of a match.
   * If undefined, match is created immediately without a popup form.
   */
  columnsToReview?: ColumnConfig[];
}
