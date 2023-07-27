import { ColumnMapping } from "../column-mapping";

export abstract class AbstractValueMappingComponent {
  /**
   * Output a label indicating whether the given column mapping needs user configuration for the "additional" config
   * or has a valid, complete "additional" config.
   * returns "undefined" if no user action is required.
   * @param col
   */
  static getIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    return undefined;
  }
}
