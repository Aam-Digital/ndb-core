import { Injectable } from '@angular/core';

/**
 * Allows decentralized registration of any available dashboard widget
 * including their details like settings component, etc.
 * 
 * 
 * Implementation steps:
  - [x] create new service for dashboard-widget-registry
  - define an interface of widget details
  - add `register` method to the service
  - [x] replace the switch statement in admin-dashboard.component with a call to the service
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardWidgetRegistryService {
  
  private readonly dashboardWidgets: Record<string, string> = {};

  /**
   * Register a new widget and its details
   * @param widgetName The name of the widget
   * @param settingsComponent The settings component associated with the widget
   */
  register(widgetName: string, settingsComponent: string) {
    this.dashboardWidgets[widgetName] = settingsComponent;
  }

  /**
   * Get the settings component for a specific widget
   * @param widgetName The widget component name to identify the widget
   * @returns The string component ID of the settings (Admin UI) component of that widget
   */
  getSettingsComponentForWidget(widgetName: string): string {
    return this.dashboardWidgets[widgetName];
  }
}
