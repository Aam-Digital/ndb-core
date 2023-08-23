import { defaultJsonConfig } from "./config-fix";
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { LoggingService } from "../logging/logging.service";
import { Config } from "./config";
import { ConfigService } from "./config.service";

export function createTestingConfigService(
  configsObject: any = defaultJsonConfig,
): ConfigService {
  return new ConfigService(
    mockEntityMapper([new Config(Config.CONFIG_KEY, configsObject)]),
    new LoggingService(),
    { can: () => true } as any,
  );
}
