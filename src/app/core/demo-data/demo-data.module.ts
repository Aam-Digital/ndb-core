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
import { DemoConfigGeneratorService } from "../config/demo-config-generator.service";
import { DemoChildGenerator } from "../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoSchoolGenerator } from "../../child-dev-project/schools/demo-school-generator.service";
import { DemoChildSchoolRelationGenerator } from "../../child-dev-project/children/demo-data-generators/demo-child-school-relation-generator.service";
import { DemoActivityGeneratorService } from "../../child-dev-project/attendance/demo-data/demo-activity-generator.service";
import { DemoActivityEventsGeneratorService } from "../../child-dev-project/attendance/demo-data/demo-activity-events-generator.service";
import { DemoNoteGeneratorService } from "../../child-dev-project/notes/demo-data/demo-note-generator.service";
import { DemoAserGeneratorService } from "../../child-dev-project/children/aser/demo-aser-generator.service";
import { DemoEducationalMaterialGeneratorService } from "../../child-dev-project/children/educational-material/demo-educational-material-generator.service";
import { DemoHealthCheckGeneratorService } from "../../child-dev-project/children/health-checkup/demo-data/demo-health-check-generator.service";
import { DemoProgressDashboardWidgetGeneratorService } from "../../features/progress-dashboard-widget/demo-progress-dashboard-widget-generator.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { DemoHistoricalDataGenerator } from "../../features/historical-data/demo-historical-data-generator";
import { DemoPermissionGeneratorService } from "../permissions/demo-permission-generator.service";
import { DemoTodoGeneratorService } from "../../features/todos/model/demo-todo-generator.service";
import { DemoConfigurableEnumGeneratorService } from "../configurable-enum/demo-configurable-enum-generator.service";
import { DemoPublicFormGeneratorService } from "../../features/public-form/demo-public-form-generator.service";

const demoDataGeneratorProviders = [
  ...DemoConfigGeneratorService.provider(),
  ...DemoPermissionGeneratorService.provider(),
  ...DemoPublicFormGeneratorService.provider(),
  ...DemoUserGeneratorService.provider(),
  ...DemoConfigurableEnumGeneratorService.provider(),
  ...DemoChildGenerator.provider({ count: 120 }),
  ...DemoSchoolGenerator.provider({ count: 8 }),
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
  ...DemoProgressDashboardWidgetGeneratorService.provider(),
  ...DemoHistoricalDataGenerator.provider({
    minCountAttributes: 2,
    maxCountAttributes: 5,
  }),
  ...DemoTodoGeneratorService.provider(),
];

/**
 * Generate realist mock entities for testing and demo purposes.
 *
 * Import this module in the root AppModule to automatically write demo data into the database on loading of the module.
 * You need to pass providers for {@link DemoDataGenerator} implementations to the `forRoot()` method to register them.
 *
 *```javascript
 *  DemoDataModule.forRoot([
 *    ...DemoChildGenerator.provider({count: 150}),
 *    { provide: DemoUserGeneratorService, useClass: DemoUserGeneratorService }
 *   ])
 * ```
 *
 * In addition to importing the `DemoDataModule` you need to call the {@link DemoDataService}'s `publishDemoData()` method
 * to actually start the data generation.
 * Use `DemoDataGeneratingProgressDialogComponent.loadDemoDataWithLoadingDialog(this.dialog);` passing a `MatDialog` service
 * to display a dialog box to the user and automatically handle the data generation.
 *
 * To implement your own demo data generator, refer to the How-To Guides:
 * - [How to Generate Demo Data]{@link /additional-documentation/how-to-guides/generate-demo-data.html}
 */
@NgModule({
  imports: [MatProgressBarModule, MatDialogModule],
  providers: [
    DemoDataInitializerService,
    DemoDataService,
    {
      provide: DemoDataServiceConfig,
      useValue: { dataGeneratorProviders: demoDataGeneratorProviders },
    },
    demoDataGeneratorProviders,
  ],
  declarations: [DemoDataGeneratingProgressDialogComponent],
  exports: [DemoDataGeneratingProgressDialogComponent],
})
export class DemoDataModule {
  constructor(private demoDataInitializer: DemoDataInitializerService) {}

  publishDemoData() {
    return this.demoDataInitializer.run();
  }
}
