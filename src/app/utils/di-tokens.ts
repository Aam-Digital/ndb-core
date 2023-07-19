import { InjectionToken } from "@angular/core";

/**
 * Use this instead of directly referencing the window object for better testability
 */
export const WINDOW_TOKEN = new InjectionToken<Window>("Window object");
// Following this post to allow testing of the location object: https://itnext.io/testing-browser-window-location-in-angular-application-e4e8388508ff
export const LOCATION_TOKEN = new InjectionToken<Location>(
  "Window location object"
);
