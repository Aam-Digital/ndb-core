/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { DemoDataService, DemoDataServiceConfig } from "./demo-data.service";
import { NgModule } from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatDialogModule } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { DemoDataInitializerService } from "./demo-data-initializer.service";
import { DemoChildSchoolRelationGenerator } from "../../child-dev-project/children/demo-data-generators/demo-child-school-relation-generator.service";
import { DemoActivityGeneratorService } from "#src/app/features/attendance/demo-data/demo-activity-generator.service";
import { DemoActivityEventsGeneratorService } from "#src/app/features/attendance/demo-data/demo-activity-events-generator.service";
import { DemoNoteGeneratorService } from "../../child-dev-project/notes/demo-data/demo-note-generator.service";
import { DemoAserGeneratorService } from "../../child-dev-project/children/demo-data-generators/aser/demo-aser-generator.service";
import { DemoEducationalMaterialGeneratorService } from "../../child-dev-project/children/demo-data-generators/educational-material/demo-educational-material-generator.service";
import { DemoHealthCheckGeneratorService } from "../../child-dev-project/children/demo-data-generators/health-check/demo-health-check-generator.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { DemoHistoricalDataGenerator } from "../../child-dev-project/children/demo-data-generators/observations/demo-historical-data-generator";
import { DemoTodoGeneratorService } from "../../features/todos/model/demo-todo-generator.service";
import { GenericDemoDataEngine } from "./generic/generic-demo-data-engine";
import { DemoEntityStore } from "./generic/demo-entity-store";
import { DemoValueService } from "./generic/demo-value.service";
import { DEMO_VALUE_GENERATOR } from "./generic/demo-value-generator";
import { ValuePoolLoader } from "./generic/value-pool-loader";
import {
  BooleanDemoValueGenerator,
  ConfigurableEnumDemoValueGenerator,
  DateDemoValueGenerator,
  DateOnlyDemoValueGenerator,
  DateWithAgeDemoValueGenerator,
  MonthDemoValueGenerator,
  NumberDemoValueGenerator,
  SchemaEmbedDemoValueGenerator,
  StringDemoValueGenerator,
} from "./generic/core-demo-value-generators";

const demoDataGeneratorProviders = [
  // Engine must be first so retained generators can read its entity store
  { provide: GenericDemoDataEngine, useClass: GenericDemoDataEngine },
  ...DemoUserGeneratorService.provider(),
  ...DemoChildSchoolRelationGenerator.provider(),
  ...DemoActivityGeneratorService.provider(),
  ...DemoActivityEventsGeneratorService.provider({ forNLastYears: 1 }),
  ...DemoNoteGeneratorService.provider({
    minNotesPerChild: 2,
    maxNotesPerChild: 6,
    groupNotes: 3,
  }),
  ...DemoAserGeneratorService.provider(),
  ...DemoEducationalMaterialGeneratorService.provider({
    minCount: 3,
    maxCount: 8,
  }),
  ...DemoHealthCheckGeneratorService.provider(),
  ...DemoHistoricalDataGenerator.provider({
    minCountAttributes: 2,
    maxCountAttributes: 5,
  }),
  ...DemoTodoGeneratorService.provider(),
];

/**
 * Generate realistic mock entities for testing and demo purposes.
 *
 * Import this module in the root AppModule to automatically write demo data into the database on loading of the module.
 *
 * The `GenericDemoDataEngine` reads entity schemas and a `demoData` spec from the active
 * `Config:CONFIG_ENTITY` document to generate entities for any configured entity type.
 * Retained, scenario-specific generators (notes, ASER, attendance, …) run after the engine
 * and read its generated entities from `DemoEntityStore`.
 *
 * Feature/plugin modules can contribute their own value generator for custom datatypes:
 * `{ provide: DEMO_VALUE_GENERATOR, useClass: MyDemoValueGenerator, multi: true }`
 */
@NgModule({
  imports: [MatProgressBarModule, MatDialogModule],
  providers: [
    DemoDataInitializerService,
    DemoDataService,
    GenericDemoDataEngine,
    DemoEntityStore,
    DemoValueService,
    ValuePoolLoader,
    // Core per-datatype demo value generators
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: ConfigurableEnumDemoValueGenerator,
      multi: true,
    },
    { provide: DEMO_VALUE_GENERATOR, useClass: StringDemoValueGenerator, multi: true },
    { provide: DEMO_VALUE_GENERATOR, useClass: DateDemoValueGenerator, multi: true },
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: DateOnlyDemoValueGenerator,
      multi: true,
    },
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: DateWithAgeDemoValueGenerator,
      multi: true,
    },
    { provide: DEMO_VALUE_GENERATOR, useClass: MonthDemoValueGenerator, multi: true },
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: BooleanDemoValueGenerator,
      multi: true,
    },
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: NumberDemoValueGenerator,
      multi: true,
    },
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: SchemaEmbedDemoValueGenerator,
      multi: true,
    },
    {
      provide: DemoDataServiceConfig,
      useValue: { dataGeneratorProviders: demoDataGeneratorProviders },
    },
    demoDataGeneratorProviders,
  ],
  declarations: [DemoDataGeneratingProgressDialogComponent],
  exports: [DemoDataGeneratingProgressDialogComponent],
})
export class DemoDataModule {}
