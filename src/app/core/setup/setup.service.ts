import { inject, Injectable } from "@angular/core";
import { BaseConfig } from "./base-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { HttpClient } from "@angular/common/http";
import { combineLatest, filter, firstValueFrom, merge, of } from "rxjs";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { Logging } from "../logging/logging.service";
import { SyncStateSubject } from "../session/session-type";
import { ConfigService } from "../config/config.service";
import { SyncState } from "../session/session-states/sync-state.enum";
import { catchError, switchMap } from "rxjs/operators";
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
  private readonly configService = inject(ConfigService);
  private readonly syncState = inject(SyncStateSubject);

  async getAvailableBaseConfig(): Promise<BaseConfig[]> {
    const externalSourceUrlsRaw = await firstValueFrom(
      this.httpClient
        .get<
          string[]
        >(this.BASE_CONFIGS_FOLDER + "/external-sources.json", { responseType: "json" })
        .pipe(
          catchError(() => {
            Logging.debug("No external-sources.json found, skipping.");
            return of([] as string[]);
          }),
        ),
    );

    const validatedExternalSourceUrls = Array.isArray(externalSourceUrlsRaw)
      ? externalSourceUrlsRaw.filter(
          (item): item is string => typeof item === "string",
        )
      : [];

    const descriptorUrls = [
      this.BASE_CONFIGS_FOLDER + "/available-configs.json",
      ...validatedExternalSourceUrls,
    ];

    const results = await Promise.all(
      descriptorUrls.map((url) => this.loadConfigDescriptor(url)),
    );

    // flatten and deduplicate: first occurrence wins (local is listed first)
    const seen = new Set<string>();
    return results.flat().filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  private async loadConfigDescriptor(url: string): Promise<BaseConfig[]> {
    const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
    const entries = await firstValueFrom(
      this.httpClient
        .get<BaseConfig | BaseConfig[]>(url, { responseType: "json" })
        .pipe(catchError(() => of(null))),
    );
    if (!entries) {
      Logging.warn("Failed to load config descriptor: " + url);
      return [];
    }
    return asArray(entries).map((entry) => ({ ...entry, baseUrl }));
  }

  /**
   * Initialize the system with the given base config,
   * saving all given base-config entities to the database.
   * @param baseConfig
   */
  async initSystemWithBaseConfig(baseConfig: BaseConfig): Promise<void> {
    Logging.debug("Initializing system with new base config", baseConfig);

    for (const file of baseConfig.entitiesToImport) {
      const fileName = `${baseConfig.baseUrl}${file}`;

      const docs = await firstValueFrom(
        this.httpClient.get<Object | Object[]>(fileName, {
          responseType: "json",
        }),
      );

      for (const doc of asArray(docs)) {
        const entity = this.parseObjectToEntity(doc);
        if (entity) {
          await this.entityMapper.save(entity, true);
        } else {
          Logging.warn(
            "Invalid record file. SetupService is skipping to import this.",
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
      throw new Error("RecordType for recordToImport not found: " + doc["_id"]);
    }

    const entity = this.schemaService.loadDataIntoEntity(new entityType(), doc);
    Logging.debug("Importing baseConfig entity", entity);

    return entity;
  }

  /**
   * Wait until config is ready and/or sync is complete.
   * @param mustHaveConfigAndSync
   * If true, waits for both config and sync.
   * If false, resolves when either:
   * - configUpdates emits a non-undefined config, or
   * - SyncState.COMPLETED is reached and config loads afterward.
   */
  public async waitForConfigReady(
    mustHaveConfigAndSync: boolean = false,
  ): Promise<boolean> {
    const configReady$ = this.configService.configUpdates.pipe(
      filter((c) => c !== undefined),
    );
    const sync$ = this.syncState.pipe(
      filter((state) => state === SyncState.COMPLETED),
      // make sure config update is already done after the sync:
      switchMap(() => this.configService.loadOnce()),
    );

    if (mustHaveConfigAndSync) {
      await firstValueFrom(combineLatest([configReady$, sync$]));
    } else {
      await firstValueFrom(merge(configReady$, sync$));
    }

    return true;
  }
}
