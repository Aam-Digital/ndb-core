// eslint-disable-next-line no-restricted-imports
import { Page, test as base } from "@playwright/test";
// eslint-disable-next-line no-restricted-imports
import {
  argosScreenshot as argosScreenshotBase,
  ArgosScreenshotOptions,
} from "@argos-ci/playwright";
import { Injector, runInInjectionContext } from "@angular/core";
import { EventAttendanceMapDatatype } from "#src/app/child-dev-project/attendance/model/event-attendance.datatype.js";
import { ConfigurableEnumDatatype } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype.js";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service.js";
import { DateOnlyDatatype } from "#src/app/core/basic-datatypes/date-only/date-only.datatype.js";
import { DateWithAgeDatatype } from "#src/app/core/basic-datatypes/date-with-age/date-with-age.datatype.js";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype.js";
import { LongTextDatatype } from "#src/app/core/basic-datatypes/string/long-text.datatype.js";
import { StringDatatype } from "#src/app/core/basic-datatypes/string/string.datatype.js";
import defaultJsonConfig from "#src/assets/base-configs/education/Config_CONFIG_ENTITY.json";
import { faker } from "#src/app/core/demo-data/faker.js";
import {
  EntityRegistry,
  entityRegistry,
} from "#src/app/core/entity/database-entity.decorator.js";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype.js";
import { EntityConfigService } from "#src/app/core/entity/entity-config.service.js";
import type { Entity } from "#src/app/core/entity/model/entity.js";
import {
  EntitySchemaService,
  EntitySchemaTransformer,
} from "#src/app/core/entity/schema/entity-schema.service.js";
import { LocationDatatype } from "#src/app/features/location/location.datatype.js";
import { type EntityConfig } from "#src/app/core/entity/entity-config.js";
import { GeoService } from "#src/app/features/location/geo.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "#src/app/core/entity/entity-actions/entity-actions.service";
import { ConfigService } from "#src/app/core/config/config.service";

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
  const injector = Injector.create({
    providers: [
      { provide: ConfigurableEnumService, useValue: undefined },
      { provide: GeoService, useValue: undefined },
      { provide: EntityMapperService, useValue: undefined },
      { provide: EntityActionsService, useValue: undefined },
      { provide: EntitySchemaService, useValue: undefined },
      { provide: ConfigService, useValue: undefined },
      { provide: EntityRegistry, useValue: entityRegistry },
    ],
  });

  const entitySchemaService = runInInjectionContext(
    injector,
    () =>
      new EntitySchemaTransformer([
        new DefaultDatatype(),
        new StringDatatype(),
        new DateWithAgeDatatype(),
        new DateOnlyDatatype(),
        new LongTextDatatype(),
        new ConfigurableEnumDatatype(),
        new LocationDatatype(),
        new EntityDatatype(),
        new EventAttendanceMapDatatype(),
      ]),
  );

  const entityConfigService = runInInjectionContext(
    injector,
    () => new EntityConfigService(),
  );
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
