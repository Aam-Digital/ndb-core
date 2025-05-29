import { ConfigurableEnumService } from "./configurable-enum.service";
import { NEVER } from "rxjs";
import { demoEnums } from "./demo-enums";

export function createTestingConfigurableEnumService() {
  let service: ConfigurableEnumService;
  service = new ConfigurableEnumService(
    {
      receiveUpdates: () => NEVER,
      loadType: () => Promise.resolve(demoEnums),
      save: () => Promise.resolve(),
    } as any,
    { can: () => true } as any,
  );
  service.preLoadEnums();
  return service;
}
