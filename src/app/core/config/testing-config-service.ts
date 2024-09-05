import { defaultJsonConfig } from "./config-fix";
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { Config } from "./config";
import { ConfigService } from "./config.service";

export function createTestingConfigService(
  configsObject: any = defaultJsonConfig,
): ConfigService {
  return new ConfigService(
    mockEntityMapper([new Config(Config.CONFIG_KEY, configsObject)]),
  );
}
