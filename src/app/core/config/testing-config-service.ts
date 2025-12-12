import { mockEntityMapperProvider } from "../entity/entity-mapper/mock-entity-mapper-service";
import { Config } from "./config";
import { ConfigService } from "./config.service";
import defaultJsonConfig from "../../../assets/base-configs/all-features/Config_CONFIG_ENTITY.json";

export function provideTestingConfigService(
  configsObject: any = defaultJsonConfig,
) {
  return [
    ...mockEntityMapperProvider([getDefaultConfigEntity(configsObject)]),
    ConfigService,
  ];
}

export function getDefaultConfigEntity(configsObject: any = defaultJsonConfig) {
  return new Config(Config.CONFIG_KEY, configsObject.data);
}
