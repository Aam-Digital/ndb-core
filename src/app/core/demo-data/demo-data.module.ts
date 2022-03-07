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

import { DemoDataServiceConfig, DemoDataService } from "./demo-data.service";
import {
  ClassProvider,
  FactoryProvider,
  ModuleWithProviders,
  NgModule,
  ValueProvider,
} from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatDialogModule } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { DemoDataInitializerService } from "./demo-data-initializer.service";

/**
 * Generate realist mock entities for testing and demo purposes.
 *
 * Import this module in the root AppModule to automatically write demo data into the database on loading of the module.
 * You need to pass providers for {@link DemoDataGenerator} implementations to the `forRoot()` method to register them.
 *
  ```
  DemoDataModule.forRoot([
     ...DemoChildGenerator.provider({count: 150}),
     { provide: DemoUserGeneratorService, useClass: DemoUserGeneratorService }
  ])
  ```
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
  providers: [DemoDataInitializerService],
  declarations: [DemoDataGeneratingProgressDialogComponent],
  exports: [DemoDataGeneratingProgressDialogComponent],
})
export class DemoDataModule {
  /**
   * Get a provider for the module while also passing the DemoDataGenerator services to be registered with the module.
   * @param demoDataGeneratorProviders An array of providers of DemoDataGenerator service implementations.
   *        These generators will be registered and called when demo data generation is triggered.
   */
  static forRoot(
    demoDataGeneratorProviders: (
      | ValueProvider
      | ClassProvider
      | FactoryProvider
    )[]
  ): ModuleWithProviders<DemoDataModule> {
    return {
      ngModule: DemoDataModule,
      providers: [
        DemoDataService,
        {
          provide: DemoDataServiceConfig,
          useValue: { dataGeneratorProviders: demoDataGeneratorProviders },
        },
        demoDataGeneratorProviders,
      ],
    };
  }
}
