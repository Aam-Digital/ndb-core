/**
 * Object specifying one dashboard widget
 * as stored in the config database
 */
export interface DashboardWidgetConfig {
  component: string;
  config?: any;
}
