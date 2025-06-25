import { ConfigurableEnumService } from "./configurable-enum.service";

export function createTestingConfigurableEnumService() {
  let service: ConfigurableEnumService;
  service = new ConfigurableEnumService();
  service.preLoadEnums();
  return service;
}
