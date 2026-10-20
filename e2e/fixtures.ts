// provides the global $localize function for the app code imported below;
// in the browser build this comes from the polyfills bundle instead
import "@angular/localize/init";
// eslint-disable-next-line no-restricted-imports
import { Download, expect, Page, test as base } from "@playwright/test";
// eslint-disable-next-line no-restricted-imports
import {
  argosScreenshot as argosScreenshotBase,
  ArgosScreenshotOptions,
} from "@argos-ci/playwright";
import { Injector } from "@angular/core";
import { AttendanceDatatype } from "#src/app/features/attendance/model/attendance.datatype.js";
import { ConfigurableEnumDatatype } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype.js";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service.js";
import { DateDatatype } from "#src/app/core/basic-datatypes/date/date.datatype.js";
import { DateOnlyDatatype } from "#src/app/core/basic-datatypes/date-only/date-only.datatype.js";
import { DateWithAgeDatatype } from "#src/app/core/basic-datatypes/date-with-age/date-with-age.datatype.js";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype.js";
import { LongTextDatatype } from "#src/app/core/basic-datatypes/string/long-text.datatype.js";
import { NumberDatatype } from "#src/app/core/basic-datatypes/number/number.datatype.js";
import { StringDatatype } from "#src/app/core/basic-datatypes/string/string.datatype.js";
import defaultJsonConfig from "#src/assets/base-configs/all-features/Config_CONFIG_ENTITY.json";
import { faker } from "#src/app/core/demo-data/faker.js";
import {
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator.js";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype.js";
import { EntityConfigService } from "#src/app/core/entity/entity-config.service.js";
import { EntityConfigReadyService } from "#src/app/core/entity/entity-config-ready.service.js";
import type { Entity } from "#src/app/core/entity/model/entity.js";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service.js";
import { LocationDatatype } from "#src/app/features/location/location.datatype.js";
import { type EntityConfig } from "#src/app/core/entity/entity-config.js";
import { GeoService } from "#src/app/features/location/geo.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "#src/app/core/entity/entity-actions/entity-actions.service";
import { ConfigService } from "#src/app/core/config/config.service";
import { EventAttendanceMapDatatype } from "#src/app/features/attendance/deprecated/event-attendance-map.datatype";

export { expect };
export type { Page };

/** The mocked "now" date to which e2e tests are fixed. */
export const E2E_REF_DATE = "2025-01-23";

faker.setDefaultRefDate(E2E_REF_DATE);

/**
 * Console errors that are expected in every e2e run and therefore don't fail a test.
 *
 * Keep this list short and document the reason for each entry.
 * To allow errors that a single test triggers deliberately, use the `allowedConsoleErrors` option instead.
 */
const KNOWN_CONSOLE_ERRORS: RegExp[] = [
  // The app first requests the translations of its own version, which don't
  // exist for the e2e build (version 0.0.0), and then falls back to the latest.
  /^Failed to load resource: .*404.*\/locale\/0\.0\.0\/messages\.\w+\.json/,
];

/** Options that tests can override with `test.use({ ... })`. */
export interface E2eOptions {
  /**
   * Patterns of console errors (and uncaught page errors) that the tests of this file or `describe` block
   * expect, e.g. because they deliberately trigger an error. Any other error fails the test.
   */
  allowedConsoleErrors: RegExp[];
}

export const test = base.extend<{ forEachTest: void } & E2eOptions>({
  allowedConsoleErrors: [[], { option: true }],

  forEachTest: [
    async ({ page, baseURL, allowedConsoleErrors }, use) => {
      await page.clock.install();
      await page.clock.setFixedTime(E2E_REF_DATE);
      // The mock clock replaces `Date` with a function that always returns a
      // native `Date` object. Constructing a subclass (e.g. `DateWithAge`)
      // would therefore not create an instance of the subclass, unlike in a
      // real browser, and cause endless update loops in the app.
      // (A string, because the transpiled function would reference helpers
      // that don't exist in the browser.)
      await page.addInitScript({
        content: `globalThis.Date = new Proxy(Date, {
          construct(target, args, newTarget) {
            const date = Reflect.construct(target, args, newTarget);
            return Object.setPrototypeOf(date, newTarget.prototype);
          },
        });`,
      });
      await page.addInitScript((E2E_REF_DATE) => {
        // @ts-expect-error Because we install a mock clock, `Data.name` is
        // `ClockDate` and not `Date`. This would break the Entity Schema
        // service.
        Date.DATA_TYPE = "date";
        globalThis.NDB_E2E_REF_DATE = new Date(E2E_REF_DATE);
      }, E2E_REF_DATE);

      await stubExternalImages(page, baseURL);
      const consoleErrors = collectConsoleErrors(page);

      await use();

      const allowed = [...KNOWN_CONSOLE_ERRORS, ...allowedConsoleErrors];
      const unexpectedErrors = consoleErrors.filter(
        (error) => !allowed.some((pattern) => pattern.test(error)),
      );
      expect(
        unexpectedErrors,
        "The app logged unexpected errors to the browser console. " +
          "Fix them or, if the test triggers them deliberately, " +
          "allow them with `test.use({ allowedConsoleErrors: [...] })`.",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Record all `console.error` messages and uncaught exceptions of the page.
 */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const { url, lineNumber } = message.location();
      errors.push(`${message.text()} (at ${url}:${lineNumber})`);
    }
  });
  page.on("pageerror", (error) => errors.push(error.stack ?? String(error)));
  return errors;
}

/** A transparent 1x1 PNG image. */
const EMPTY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/**
 * Serve an empty image for images from external hosts (e.g. map tiles),
 * so that the tests neither depend on these servers being reachable
 * nor fail on "Failed to load resource" console errors.
 *
 * Other external requests (e.g. translations) are needed by the app and still go through.
 * Routes that a test registers itself take precedence over this one.
 */
async function stubExternalImages(page: Page, baseURL: string | undefined) {
  const appOrigin = new URL(baseURL ?? "http://localhost:4200").origin;
  await page.route(
    (url) => url.origin !== appOrigin,
    (route) =>
      route.request().resourceType() === "image"
        ? route.fulfill({ contentType: "image/png", body: EMPTY_PNG })
        : route.fallback(),
  );
}

const ARGOS_BASE_CSS =
  // Hide Material tooltips, which can appear from prior hover interactions and cause flaky screenshots
  ".mat-mdc-tooltip { display: none !important; }";

export async function argosScreenshot(
  page: Page,
  name: string,
  options?: ArgosScreenshotOptions,
): Promise<void> {
  if (process.env.CI || process.env.SCREENSHOT) {
    const { argosCSS, ...restOptions } = options || {};
    await resetMainContentScroll(page);
    await argosScreenshotBase(page, name, {
      fullPage: true,
      argosCSS: argosCSS ? `${ARGOS_BASE_CSS}\n${argosCSS}` : ARGOS_BASE_CSS,
      ...restOptions,
    });
  }
}

/**
 * Pin the main content area to the top before capturing a screenshot.
 *
 * The app scrolls inside `mat-sidenav-content` rather than the window, so the
 * document itself never overflows and a `fullPage` screenshot effectively
 * captures just the viewport. Neither Playwright's `fullPage` nor Argos reset
 * the scroll offset of such an inner container. Actions like `fill()` call
 * `scrollIntoViewIfNeeded()`, which can leave the container scrolled by a few
 * pixels whenever the content is just slightly taller than the viewport. That
 * stray, timing-dependent offset shifts the whole content pane and produces
 * flaky screenshot diffs (notably the `site-settings-edited` screenshot).
 *
 * Skip resetting while an interactive overlay is open: dialogs, selects and
 * menus create a `.cdk-overlay-backdrop`, and some screenshots intentionally
 * scroll within a dialog (e.g. `i18n-de_init`) or show an open panel. Tooltips
 * do not create a backdrop, so lingering tooltips don't block the reset.
 */
async function resetMainContentScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.querySelector(".cdk-overlay-backdrop")) return;
    document
      .querySelectorAll(".mat-drawer-content")
      .forEach((el) => ((el as HTMLElement).scrollTop = 0));
    window.scrollTo(0, 0);
  });
}

/**
 * Select one option of a filter dropdown above an entity list.
 *
 * The filters are multi-select autocompletes, so their panel stays open after
 * picking an option — it has to be dismissed by clicking a neutral element
 * before the next filter can be used.
 */
export async function selectFilterOption(
  page: Page,
  filterLabel: string,
  optionLabel: string,
): Promise<void> {
  const field = page.locator("mat-form-field").filter({ hasText: filterLabel });

  // The field holds a display input and a search input, swapping which of the
  // two is hidden depending on whether the dropdown is open.
  await field.locator("input:visible").first().click();
  await page.getByRole("option", { name: optionLabel }).click();

  // The option click already commits the value to the form control, so closing
  // the panel does not revert the selection. Blurring afterwards returns the
  // field to display mode, so it can be used again for the next selection.
  await page.keyboard.press("Escape");
  await field.locator("input:visible").first().blur();
}

/**
 * Read a downloaded CSV and return its data rows, without the header line.
 *
 * Kept deliberately simple: it splits on newlines, so it does not support
 * values that contain line breaks.
 */
export async function readCsvRows(download: Download): Promise<string[]> {
  const stream = await download.createReadStream();
  // decoding in the stream keeps multi-byte characters intact across chunks
  stream.setEncoding("utf-8");

  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as string);
  }

  return chunks
    .join("")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(1);
}

/**
 * Wait for all dashboard widgets to finish loading by ensuring no loading indicators are visible.
 * This should be called before taking screenshots of the dashboard to avoid capturing loading states.
 */
export async function waitForDashboardWidgetsToLoad(page: Page): Promise<void> {
  // Wait for all "Loading..." text and spinners to disappear
  await page.waitForFunction(
    () => {
      // Check for "Loading..." text
      const loadingTexts = Array.from(
        document.querySelectorAll(".widget-content .headline"),
      );
      const hasLoadingText = loadingTexts.some((el) =>
        el.textContent?.includes("Loading..."),
      );

      // Check for spinners
      const spinners = document.querySelectorAll(
        ".widget-title mat-spinner, .widget-header mat-spinner",
      );

      return !hasLoadingText && spinners.length === 0;
    },
    { timeout: 10_000 },
  );
}

/**
 * Load the app into `page` and send `entities` to the app to be loaded into the
 * database.
 *
 * If `entities` is undefined, the default demo data is used.
 */
export async function loadApp(page: Page, entities?: Entity[]) {
  if (entities) {
    await page.addInitScript((data) => {
      window["e2eDemoData"] = data;
    }, serializeEntities(entities));
  }

  await page.goto("/?useCase=all-features");

  await page.getByText("Start Exploring").click({ timeout: 10_000 });
}

/**
 * Take a collection of entities and serialize them using an
 * `EntitySchemaService`.
 *
 * This implementation is not fully compatible with serialization in the app.
 */
function serializeEntities(entities: Entity[]): unknown[] {
  const injector = Injector.create({
    providers: [
      { provide: ConfigurableEnumService, useValue: undefined },
      { provide: GeoService, useValue: undefined },
      { provide: EntityMapperService, useValue: undefined },
      { provide: EntityActionsService, useValue: undefined },
      { provide: ConfigService, useValue: undefined },
      { provide: EntitySchemaService, useClass: EntitySchemaService },
      { provide: EntityConfigReadyService, useClass: EntityConfigReadyService },
      { provide: EntityConfigService, useClass: EntityConfigService },
      { provide: EntityRegistry, useValue: entityRegistry },
      { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
      { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
      { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
      { provide: DefaultDatatype, useClass: DateWithAgeDatatype, multi: true },
      { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
      { provide: DefaultDatatype, useClass: LongTextDatatype, multi: true },
      { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
      {
        provide: DefaultDatatype,
        useClass: ConfigurableEnumDatatype,
        multi: true,
      },
      { provide: DefaultDatatype, useClass: LocationDatatype, multi: true },
      { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
      {
        provide: DefaultDatatype,
        useClass: EventAttendanceMapDatatype,
        multi: true,
      },
      { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
    ],
  });

  const entitySchemaService = injector.get(EntitySchemaService);
  const entityConfigService = injector.get(EntityConfigService);

  entityConfigService.setupEntities(
    Object.entries(defaultJsonConfig.data).flatMap(([id, config]) => {
      if (id.startsWith("entity:")) {
        return [[id.substring("entity:".length), config as EntityConfig]];
      } else {
        return [];
      }
    }),
  );
  return entities.map(
    (e) => entitySchemaService.transformEntityToDatabaseFormat(e) as unknown,
  );
}
