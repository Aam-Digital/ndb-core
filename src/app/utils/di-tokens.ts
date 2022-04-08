import { InjectionToken } from "@angular/core";

/**
 * Use this instead of directly referencing the window object for better testability
 */
export const WINDOW_TOKEN = new InjectionToken<Window>("Window object");
