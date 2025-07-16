// eslint-disable-next-line no-restricted-imports
import { Page, test as base } from "@playwright/test";
// eslint-disable-next-line no-restricted-imports
import {
  argosScreenshot as argosScreenshotBase,
  ArgosScreenshotOptions,
} from "@argos-ci/playwright";
import { faker } from "#src/app/core/demo-data/faker.js";
import type { Entity } from "#src/app/core/entity/model/entity.js";
import { EntitySchemaTransformer } from "#src/app/core/entity/schema/entity-schema.service.js";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { StringDatatype } from "#src/app/core/basic-datatypes/string/string.datatype";
import { DateWithAgeDatatype } from "#src/app/core/basic-datatypes/date-with-age/date-with-age.datatype";
import { DateOnlyDatatype } from "#src/app/core/basic-datatypes/date-only/date-only.datatype";
import { LongTextDatatype } from "#src/app/core/basic-datatypes/string/long-text.datatype";

// eslint-disable-next-line no-restricted-imports
export { expect } from "@playwright/test";

/** The mocked "now" date to which e2e tests are fixed. */
export const E2E_REF_DATE = "2025-01-23";

faker.setDefaultRefDate(E2E_REF_DATE);

export const test = base.extend<{ forEachTest: void }>({
  forEachTest: [
    async ({ page }, use) => {
      await page.clock.install();
      await page.clock.setFixedTime(E2E_REF_DATE);
      await page.addInitScript((E2E_REF_DATE) => {
        // @ts-expect-error Because we install a mock clock, `Data.name` is
        // `ClockDate` and not `Date`. This would break the Entity Schema
        // service.
        Date.DATA_TYPE = "date";
        globalThis.NDB_E2E_REF_DATE = new Date(E2E_REF_DATE);
      }, E2E_REF_DATE);

      await use();
    },
    { auto: true },
  ],
});

export async function argosScreenshot(
  page: Page,
  name: string,
  options?: ArgosScreenshotOptions,
): Promise<void> {
  if (process.env.CI || process.env.SCREENSHOT) {
    return argosScreenshotBase(page, name, {
      fullPage: true,
      ...(options || {}),
    });
  }
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

  await page.goto("/?useCase=education");

  await page.getByText("Start Exploring").click({ timeout: 10_000 });
}

/**
 * Take a collection of entities and serialize them using an
 * `EntitySchemaService`.
 *
 * This implementation is not fully compatible with serialization in the app.
 */
function serializeEntities(entities: Entity[]): unknown[] {
  const entitySchemaService = new EntitySchemaTransformer([
    new DefaultDatatype(),
    new StringDatatype(),
    new DateWithAgeDatatype(),
    new DateOnlyDatatype(),
    new LongTextDatatype(),

    // the following datatypes have dependencies through Angular DI - need workarounds in case they are needed for test data
    //new ConfigurableEnumDatatype(null),
    //new LocationDatatype(null),
    //new EntityDatatype(null, null, null),
    //new EventAttendanceMapDatatype(entitySchemaService),
  ]);

  return entities.map(
    (e) => entitySchemaService.transformEntityToDatabaseFormat(e) as unknown,
  );
}
