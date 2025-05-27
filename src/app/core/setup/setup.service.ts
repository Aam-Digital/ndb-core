import { inject, Injectable } from "@angular/core";
import { BaseConfig } from "./base-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "../config/config";
import { defaultJsonConfig } from "../config/config-fix";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";

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

  async getAvailableBaseConfig(): Promise<BaseConfig[]> {
    // TODO: implement dynamic loading of base configs from assets/base-configs/
    const mockConfig: BaseConfig = {
      id: "basic",
      name: "Basic Setup",
      description:
        "A basic setup with minimal configuration to get started quickly.",
    };
    return [mockConfig];
  }

  async initSystemWithBaseConfig(baseConfig: BaseConfig): Promise<void> {
    // load assets/base-configs/${baseConfig.id}/Config_CONFIG_ENTITY.json
    const config = await lastValueFrom(
      this.httpClient.get(
        `assets/base-configs/${baseConfig.id}/Config_CONFIG_ENTITY.json`,
        { responseType: "json" },
      ),
    );

    const configEntity = Object.assign(new Config(), config);
    this.entityMapper.save(configEntity);
  }
}
