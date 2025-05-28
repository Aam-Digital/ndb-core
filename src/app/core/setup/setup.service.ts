import { inject, Injectable } from "@angular/core";
import { BaseConfig } from "./base-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { DemoDataInitializerService } from "../demo-data/demo-data-initializer.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { Logging } from "../logging/logging.service";

/**
 * Loads available "scenarios" of base configs
 * that users can select to start with setting up their system.
 */
@Injectable({
  providedIn: "root",
})
export class SetupService {
  private readonly httpClient = inject(HttpClient);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly demoDataInitializer = inject(DemoDataInitializerService);

  /**
   * Bridge to old DemoDataModule flow of generating demo data.
   * TODO: remove or refactor to match with new assets configs.
   * @deprecated will be replaced by calls to initSystemWithBaseConfig()
   * @private
   */
  async initDemoData() {
    // log in as demo user to initialize the database
    await this.demoDataInitializer.logInDemoUser();

    await this.initSystemWithBaseConfig(
      (await this.getAvailableBaseConfig())[0],
    );

    if (environment.demo_mode) {
      await this.demoDataInitializer.generateDemoData();
    }
  }

  async getAvailableBaseConfig(): Promise<BaseConfig[]> {
    // TODO: implement dynamic loading of base configs from assets/base-configs/
    const mockConfig: BaseConfig = {
      id: "basic",
      name: "Basic Setup",
      description:
        "A basic setup with minimal configuration to get started quickly.",
      entitiesToImport: ["Config_CONFIG_ENTITY.json"],
    };
    return [mockConfig];
  }

  async initSystemWithBaseConfig(baseConfig: BaseConfig): Promise<void> {
    const folder = `assets/base-configs/${baseConfig.id}/`;
    for (const file of baseConfig.entitiesToImport) {
      const entity = await this.loadEntityFromFile(folder + file);
      await this.entityMapper.save(entity);
    }
  }

  /**
   * (Try to) load the given file and convert it to an Entity instance
   * to be saved to the database.
   * @param filePath
   * @private
   */
  private async loadEntityFromFile(
    filePath: string,
  ): Promise<Entity | undefined> {
    const doc = await lastValueFrom(
      this.httpClient.get(filePath, { responseType: "json" }),
    );

    if (!doc || !doc["_id"]) {
      Logging.warn(
        "Invalid entity file. SetupService is skipping to import this.",
        filePath,
        doc,
      );
      return;
    }

    const entityType = this.entityRegistry.get(
      Entity.extractTypeFromId(doc["_id"]),
    );
    if (!entityType) {
      throw new Error("EntityType for entityToImport not found: " + doc["_id"]);
    }

    const entity = this.schemaService.loadDataIntoEntity(new entityType(), doc);
    Logging.debug("Importing baseConfig entity", entity);
    return entity;
  }
}
