import { Injectable } from '@angular/core';
import { WidgetOption } from '../admin/admin-entity-details/widget-component-select/widget-component-select.component';

/**
 * Allows decentralized registration of any available dashboard widget
 * including their details like settings component, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardWidgetRegistryService {
  private readonly dashboardWidgets: DashboardWidgetDefinition[] = [];

  /**
   * Register a new widget and its details
   * @param widgetName The name of the widget
   * @param settingsComponent The settings component associated with the widget
   */
  register(widgetDefinition: DashboardWidgetDefinition) {
    this.dashboardWidgets.push(widgetDefinition);
  }

  /**
   * Get the settings component for a specific widget
   * @param widgetName The widget component name to identify the widget
   * @returns The string component ID of the settings (Admin UI) component of that widget
   */
  getSettingsComponentForWidget(widgetName: string): string {
    const widget = this.dashboardWidgets.find(w => w.component === widgetName);
    return widget ? widget.settingsComponent : '';
  }

  /**
   * Return all registered widgets as "widget options" for an admin user to select.
   */
  getAvailableWidgets(): WidgetOption[] {
    return this.dashboardWidgets.map(widget => ({
      label: widget.label,
      value: {
        component: widget.component,
        config: widget.defaultConfig,
      }
    }));
  }
}


export interface DashboardWidgetDefinition {
  /**
   * Component ID for the widget to be displayed.
   */
  component: string;

  /**
   * Human-readable label/name of the widget, e.g. for admin UI.
   */
  label: string;

  /**
   * Component ID for the settings (Admin UI) component of that widget.
   */
  settingsComponent: string;

  /**
   * Some default configuration settings for the widget, when a 
   */
  defaultConfig: any;
}