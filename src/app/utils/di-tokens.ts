// Following this post to allow testing of the location object: https://itnext.io/testing-browser-window-location-in-angular-application-e4e8388508ff
import { InjectionToken } from "@angular/core";

export const LOCATION_TOKEN = new InjectionToken<Location>(
  "Window location object"
);
