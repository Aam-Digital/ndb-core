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
import { LoggingService } from "../logging/logging.service";
import { User } from "../user/user";

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
    private loggingService: LoggingService,
    private injector: Injector,
    private config: DemoDataServiceConfig
  ) {
    this.registerAllProvidedDemoDataGenerators();
  }

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
    if (!(await this.hasEmptyDatabase())) {
      return;
    }

    // completely generate all data (i.e. call every generator) before starting to save the data
    // to allow generators to delete unwanted entities of other generators before they are saved
    // (e.g. the DropoutChildGenerator should be able to delete Attendance records of the Child after its dropout date)
    this.dataGenerators.forEach((generator) => generator.entities);

    // save the generated data
    for (const generator of this.dataGenerators) {
      for (const entity of generator.entities) {
        try {
          await this.entityMapper.save(entity);
        } catch (e) {
          this.loggingService.warn(e);
        }
      }
    }
  }

  async hasEmptyDatabase(): Promise<boolean> {
    const existingUsers = await this.entityMapper.loadType(User);
    return existingUsers.length === 0;
  }
}
