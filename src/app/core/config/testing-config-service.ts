import { mockEntityMapperProvider } from "../entity/entity-mapper/mock-entity-mapper-service";
import { Config } from "./config";
import { ConfigService } from "./config.service";
import defaultJsonConfig from "../../../assets/base-configs/education/Config_CONFIG_ENTITY.json";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";

export function provideTestingConfigService(
  configsObject: any = defaultJsonConfig,
) {
  return [
    {
      provide: EntityMapperService,
      useValue: mockEntityMapperProvider([
        getDefaultConfigEntity(configsObject),
      ]),
    },
    ConfigService,
  ];
}

export function getDefaultConfigEntity(configsObject: any = defaultJsonConfig) {
  return new Config(Config.CONFIG_KEY, configsObject.data);
}
