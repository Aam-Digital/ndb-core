import { defaultJsonConfig } from "./config-fix";
import { mockEntityMapper } from "../entity/mock-entity-mapper-service";
import { LoggingService } from "../logging/logging.service";
import { Config } from "./config";
import { ConfigService } from "./config.service";

export function createTestingConfigService(
  configsObject: any = defaultJsonConfig
): ConfigService {
  const configService = new ConfigService(
    mockEntityMapper(),
    new LoggingService()
  );
  configService["currentConfig"] = new Config(Config.CONFIG_KEY, configsObject);
  return configService;
}
