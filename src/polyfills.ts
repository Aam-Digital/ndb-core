/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/docs/ts/latest/guide/browser-support.html
 */
/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import "zone.js"; // Included with Angular CLI.
/***************************************************************************************************
 * APPLICATION IMPORTS
 */
import "@angular/localize/init";
/**
 * Date, currency, decimal and percent pipes.
 * Needed for: All but Chrome, Firefox, Edge, IE11 and Safari 10
 */
// import 'intl';  // Run `npm install --save intl`.
/**
 * Need to import at least one locale-data with intl.
 */
// import 'intl/locale-data/jsonp/en';
// Import hammer.js to enable gestures
// on mobile devices
import "hammerjs";
import * as buffer from "buffer";
import * as process from "process";

// WARNING: workaround to allow PouchDB with Angular v6: https://github.com/pouchdb/pouchdb/issues/7263
(window as any).global = window;
(window as any).Buffer = buffer.Buffer;
(window as any).process = process;
