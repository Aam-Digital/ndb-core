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

import {
  ClassProvider,
  FactoryProvider,
  Injectable,
  Injector,
  ValueProvider,
} from "@angular/core";
import { DemoDataGenerator } from "./demo-data-generator";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Database } from "../database/database";

/**
 * General config object to pass all initially register DemoDataGenerators
 * with `DemoDataModule.forRoot()`.
 *
 * see docs at {@link DemoDataModule}
 */
export class DemoDataServiceConfig {
  /**
   * Providers for DemoDataGenerator service implementations to be registered for data generation.
   *
   * This may also include providers for services a DemoDataGenerator depends on.
   */
  dataGeneratorProviders: (ValueProvider | ClassProvider | FactoryProvider)[] =
    [];
}

/**
 * The DemoDataService is the manager for all provided DemoDataGenerator implementations.
 * It serves as the central service to trigger the demo data generation into the database.
 *
 * To add more demo data generators, refer the documentation
 * [How to Generate Demo Data]{@link /additional-documentation/how-to-guides/generate-demo-data.html}
 */
@Injectable()
export class DemoDataService {
  /** All registered demo data generator services */
  readonly dataGenerators: DemoDataGenerator<any>[] = [];

  constructor(
    private entityMapper: EntityMapperService,
    private injector: Injector,
    private config: DemoDataServiceConfig,
    private database: Database,
  ) {}

  private registerAllProvidedDemoDataGenerators() {
    for (const provider of this.config.dataGeneratorProviders) {
      const service = this.injector.get<any>(provider.provide);
      if (service && service instanceof DemoDataGenerator) {
        this.dataGenerators.push(service);
      }
    }
  }

  /**
   * Trigger all registered DemoDataGenerator implementations to generate demo entities
   * and add all the generated entities to the Database.
   */
  async publishDemoData() {
    if (!(await this.database.isEmpty())) {
      return;
    }
    this.registerAllProvidedDemoDataGenerators();

    // completely generate all data (i.e. call every generator) before starting to save the data
    // to allow generators to delete unwanted entities of other generators before they are saved
    // (e.g. the DropoutChildGenerator should be able to delete Attendance records of the Child after its dropout date)
    this.dataGenerators.forEach((generator) => generator.entities);

    // save the generated data
    for (const generator of this.dataGenerators) {
      await this.entityMapper.saveAll(generator.entities);
      // Wait for other async tasks in the queue e.g. ConfigService setting up config after it has been saved
      await new Promise((resolve) => setTimeout(resolve));
    }
  }
}
