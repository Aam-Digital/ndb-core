import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { Config } from "./config";
import { ConfigService } from "./config.service";
import defaultJsonConfig from "../../../assets/base-configs/education/config.json";

export function createTestingConfigService(
  configsObject: any = defaultJsonConfig,
): ConfigService {
  return new ConfigService(
    mockEntityMapper([new Config(Config.CONFIG_KEY, configsObject.data)]),
  );
}
