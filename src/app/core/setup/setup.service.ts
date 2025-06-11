import { inject, Injectable } from "@angular/core";
import { BaseConfig } from "./base-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { HttpClient } from "@angular/common/http";
import { combineLatest, filter, firstValueFrom, merge, of } from "rxjs";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { Logging } from "../logging/logging.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";
import { ConfigService } from "../config/config.service";
import { SyncState } from "../session/session-states/sync-state.enum";
import { catchError } from "rxjs/operators";
import { asArray } from "../../utils/asArray";

/**
 * Loads available "scenarios" of base configs
 * that users can select to start with setting up their system.
 */
@Injectable({
  providedIn: "root",
})
export class SetupService {
  private readonly BASE_CONFIGS_FOLDER = "assets/base-configs";

  private readonly httpClient = inject(HttpClient);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly loginState = inject(LoginStateSubject);
  private readonly configService = inject(ConfigService);
  private readonly syncState = inject(SyncStateSubject);

  async getAvailableBaseConfig(): Promise<BaseConfig[]> {
    const doc = await firstValueFrom(
      this.httpClient
        .get<
          BaseConfig[]
        >(this.BASE_CONFIGS_FOLDER + "/available-configs.json", { responseType: "json" })
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              Logging.warn("No available-configs.json found.");
              return of([]);
            } else {
              throw e;
            }
          }),
        ),
    );

    return doc;
  }

  /**
   * Initialize the system with the given base config,
   * saving all given base-config entities to the database.
   * @param baseConfig
   */
  async initSystemWithBaseConfig(baseConfig: BaseConfig): Promise<void> {
    Logging.debug("Initializing system with new base config", baseConfig);

    for (const file of baseConfig.entitiesToImport) {
      const fileName = `${this.BASE_CONFIGS_FOLDER}/${file}`;

      const docs = await firstValueFrom(
        this.httpClient.get<Object | Object[]>(fileName, {
          responseType: "json",
        }),
      );

      for (const doc of asArray(docs)) {
        const entity = this.parseObjectToEntity(doc);
        if (entity) {
          await this.entityMapper.save(entity);
        } else {
          Logging.warn(
            "Invalid entity file. SetupService is skipping to import this.",
            fileName,
            doc,
          );
        }
      }
    }
  }

  /**
   * (Try to) convert the given doc to an Entity instance to be saved to the database.
   */
  private parseObjectToEntity(doc: any): Entity | undefined {
    if (!doc || !doc["_id"]) {
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

  /**
   * Check if we are currently still waiting for config to be initialized or downloaded
   * and keep the app on the loading screen until that is done.
   */
  public async detectConfigReadyState(
    mustHaveConfigAndSync: boolean = false,
  ): Promise<boolean> {
    // 1. user has to be logged in
    await firstValueFrom(
      this.loginState.pipe(filter((state) => state === LoginState.LOGGED_IN)),
    );

    // 2. Wait for config and/or sync state depending on flag
    const configReady$ = this.configService.configUpdates.pipe(
      filter((c) => c !== undefined),
    );
    const sync$ = this.syncState.pipe(
      filter((state) => state === SyncState.COMPLETED),
    );

    if (mustHaveConfigAndSync) {
      await firstValueFrom(combineLatest([configReady$, sync$]));
    } else {
      await firstValueFrom(merge(configReady$, sync$));
    }

    return true;
  }
}
