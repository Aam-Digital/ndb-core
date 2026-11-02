import type * as Sentry from "@sentry/angular";
import { processSentryEvent } from "./sentry-event-processing";
import { resetReportedEvents } from "./report-once";
import { ConnectivityError } from "./error-classification";
import { DatabaseException } from "../database/pouchdb/database-exception";

/** Fixtures for the specs of the remote monitoring (Sentry) processing. */

export type Frame = { function?: string; filename?: string };

/** The event Sentry builds for an error: its `cause` chain innermost-first. */
export function eventFor(
  error: Error,
  options: { frames?: Frame[]; unhandled?: boolean } = {},
): Sentry.ErrorEvent {
  const chain: Error[] = [];
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    chain.unshift(e);
  }
  const stacktrace = options.frames ? { frames: options.frames } : undefined;
  const mechanism = { type: "generic", handled: !options.unhandled };
  return {
    exception: {
      values: chain.map((e, i) => ({
        type: e.name,
        value: e.message,
        stacktrace,
        mechanism: i === chain.length - 1 ? mechanism : undefined,
      })),
    },
  } as Sentry.ErrorEvent;
}

export function process(
  error: Error,
  options?: { frames?: Frame[]; unhandled?: boolean },
) {
  return processSentryEvent(eventFor(error, options), {
    originalException: error,
  });
}

export const withStack = { frames: [{ filename: "app.ts" }] };

/** How Sentry titles an event: by its thrown error. */
export function title(event: Sentry.ErrorEvent): string {
  const values = event.exception.values;
  const thrown = values[values.length - 1];
  return `${thrown.type}: ${thrown.value}`;
}

/** What the remote database throws (wrapped by PouchDatabase) for a request without response. */
export const failedFetch = () =>
  new DatabaseException(
    new ConnectivityError("Failed to fetch from DB", {
      cause: new TypeError("Failed to fetch"),
    }),
  );

/** PouchDB's error once the IndexedDB of the device is broken (AAM-DIGITAL-7CQ). */
export const brokenIndexedDb = () =>
  Object.assign(new Error("unknown"), {
    name: "indexed_db_went_bad",
    status: 500,
    reason:
      "The requested version (5) is less than the existing version (21793192942062).",
  });

/** A raw browser error, e.g. IndexedDB closed underneath PouchDB (AAM-DIGITAL-5WD). */
export const browserError = (name: string, message: string) =>
  Object.assign(new Error(message), { name });

/** Start each test with a new page load, online. */
export function setUpPageLoad() {
  beforeEach(() => {
    resetReportedEvents();
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => vi.unstubAllGlobals());
}
