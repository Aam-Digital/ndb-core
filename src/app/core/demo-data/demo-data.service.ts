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
  inject,
} from "@angular/core";
import { DemoDataGenerator } from "./demo-data-generator";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { ConfigService } from "../config/config.service";
import { firstValueFrom } from "rxjs";
import { GenericDemoDataEngine } from "./generic/generic-demo-data-engine";
import { DemoEntityStore } from "./generic/demo-entity-store";

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
  private entityMapper = inject(EntityMapperService);
  private injector = inject(Injector);
  private config = inject(DemoDataServiceConfig);
  private configService = inject(ConfigService);
  private readonly engine = inject(GenericDemoDataEngine);
  private readonly demoEntities = inject(DemoEntityStore);

  /** All registered demo data generator services */
  readonly dataGenerators: DemoDataGenerator<any>[] = [];

  private collectRecordsOfOtherGenerators() {
    for (const generator of this.dataGenerators) {
      if (generator === this.engine) {
        continue;
      }
      for (const entity of generator.entities) {
        this.demoEntities.add(entity.getType(), [entity]);
      }
    }
  }

  /** Types that a generator of their own creates, so the engine leaves them alone. */
  private typesOfOtherGenerators(): string[] {
    return this.dataGenerators
      .filter((generator) => generator !== this.engine)
      .flatMap((generator) => generator.ownedEntityTypes);
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
    this.registerAllProvidedDemoDataGenerators();

    // Wait for config to be loaded so that generators can access ConfigService and resolved settings
    await firstValueFrom(this.configService.configUpdates);
    // Let config subscribers (e.g. EntityConfigService, AttendanceService) process the config
    await new Promise((resolve) => setTimeout(resolve));

    // the engine fills every type no other generator takes care of
    await this.engine.init(this.typesOfOtherGenerators());

    // completely generate all data (i.e. call every generator) before starting to save the data
    // to allow generators to delete unwanted entities of other generators before they are saved
    // (e.g. the DropoutChildGenerator should be able to delete Attendance records of the Child after its dropout date)
    this.dataGenerators.forEach((generator) => generator.entities);

    // records of the other generators are link targets too (e.g. a staff member
    // a record is assigned to), so collect them before references are filled
    this.collectRecordsOfOtherGenerators();

    // link the generated records once every type has them
    this.engine.linkReferences();

    // save the generated data
    for (const generator of this.dataGenerators) {
      await this.entityMapper.saveAll(generator.entities, true);
      // Wait for other async tasks in the queue e.g. ConfigService setting up config after it has been saved
      await new Promise((resolve) => setTimeout(resolve));
    }
  }
}
