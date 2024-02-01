/**
 * Abstract class for dashboard widgets
 */
export abstract class DashboardWidget {
  /**
   * Implement this if the dashboard depends on the user having access to a certain entity.
   * If an array of strings is returned, the dashboard is shown if the user has access to at least one of them.
   *
   * @param config same of the normal config that will later be passed to the inputs
   * @return ENTITY_TYPE which a user needs to have
   */
  static getRequiredEntities(config: any): string | string[] {
    return;
  }
}
