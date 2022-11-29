import { FilterConfig } from "../../../core/entity-components/entity-list/EntityListConfig";

/**
 * Config to be defined to set up a MatchingEntitiesComponent.
 */
export interface MatchingEntitiesConfig {
  /**
   * mapped columns to be compared side-by-side between the two entities to match.
   *
   * e.g. [["name", "name"], ["motherTongue", "language"]]
   */
  columns: string[][];

  /** whether a map should be displayed in addition to a comparison table */
  showMap?: boolean;

  /** overwrite the button label to describe the matching action */
  matchActionLabel?: string;

  /** details of what is created when matching two entities */
  onMatch: NewMatchAction;

  /**
   * entity type on the left side of matching, used to load a list of available entities for manual selection
   */
  leftEntityType?: string;

  leftFilters?: FilterConfig[];

  /**
   * entity type on the right side of matching, used to load a list of available entities for manual selection
   */
  rightEntityType?: string;

  rightFilters?: FilterConfig[];
}

export interface NewMatchAction {
  /** the entity type to be created on matching to represent the new match */
  newEntityType: string;

  /** name of the property on newEntityType that should take the id of the left matching entity */
  newEntityMatchPropertyLeft: string;

  /** name of the property on newEntityType that should take the id of the right matching entity */
  newEntityMatchPropertyRight: string;
}
