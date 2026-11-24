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
import { DemoHealthCheckGeneratorService } from "../../child-dev-project/children/demo-data-generators/health-check/demo-health-check-generator.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { DemoTodoGeneratorService } from "../../features/todos/model/demo-todo-generator.service";
import { DemoActionGeneratorService } from "#src/app/features/hierarchy/demo-data/demo-action-generator.service";
import { GenericDemoDataEngine } from "./generic/generic-demo-data-engine";
import { DemoEntityStore } from "./generic/demo-entity-store";
import { DemoValueService } from "./generic/demo-value.service";
import { DEMO_VALUE_GENERATOR } from "./generic/demo-value-generator";
import {
  BooleanDemoValueGenerator,
  ConfigurableEnumDemoValueGenerator,
  DateDemoValueGenerator,
  DateOnlyDemoValueGenerator,
  DateWithAgeDemoValueGenerator,
  EmailDemoValueGenerator,
  LongTextDemoValueGenerator,
  MonthDemoValueGenerator,
  NumberDemoValueGenerator,
  PercentageDemoValueGenerator,
  SchemaEmbedArrayDemoValueGenerator,
  SchemaEmbedDemoValueGenerator,
  StringDemoValueGenerator,
  UrlDemoValueGenerator,
} from "./generic/core-demo-value-generators";

/** Demo values per datatype, extensible from feature modules. */
const demoValueGeneratorProviders = [
  ConfigurableEnumDemoValueGenerator,
  StringDemoValueGenerator,
  LongTextDemoValueGenerator,
  EmailDemoValueGenerator,
  UrlDemoValueGenerator,
  BooleanDemoValueGenerator,
  NumberDemoValueGenerator,
  PercentageDemoValueGenerator,
  DateDemoValueGenerator,
  DateOnlyDemoValueGenerator,
  DateWithAgeDemoValueGenerator,
  MonthDemoValueGenerator,
  SchemaEmbedDemoValueGenerator,
  SchemaEmbedArrayDemoValueGenerator,
].map((useClass) => ({ provide: DEMO_VALUE_GENERATOR, useClass, multi: true }));

const demoDataGeneratorProviders = [
  // first, so the generators below can build on the records it creates
  { provide: GenericDemoDataEngine, useClass: GenericDemoDataEngine },
  ...DemoUserGeneratorService.provider(),
  ...DemoChildSchoolRelationGenerator.provider(),
  ...DemoActivityGeneratorService.provider(),
  ...DemoActivityEventsGeneratorService.provider({ forNLastYears: 1 }),
  ...DemoNoteGeneratorService.provider({
    minNotesPerChild: 2,
    maxNotesPerChild: 6,
    groupNotes: 15,
  }),
  ...DemoAserGeneratorService.provider(),
  ...DemoHealthCheckGeneratorService.provider(),
  ...DemoTodoGeneratorService.provider(),
  ...DemoActionGeneratorService.provider(),
];

/**
 * Generate realistic mock entities for testing and demo purposes.
 *
 * {@link GenericDemoDataEngine} creates records for every entity type the active
 * use case configures, from the type's schema and the `Config:DemoData` spec.
 * The generators registered below keep the logic a declarative spec cannot express
 * (date series, attendance, the fixed demo accounts); they read the engine's
 * records from {@link DemoEntityStore} and declare the types they own themselves.
 *
 * Call {@link DemoDataService}'s `publishDemoData()` to start generation, or
 * `DemoDataGeneratingProgressDialogComponent.loadDemoDataWithLoadingDialog(dialog)`
 * to show a progress dialog while it runs.
 *
 * See the [demo-data README](../../../../src/app/core/demo-data/README.md).
 */
@NgModule({
  imports: [MatProgressBarModule, MatDialogModule],
  providers: [
    DemoDataInitializerService,
    DemoDataService,
    DemoEntityStore,
    DemoValueService,
    demoValueGeneratorProviders,
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
