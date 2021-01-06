import { ConfigurableEnumDirective } from "./configurable-enum.directive";
import { ConfigService } from "../../config/config.service";
import { ViewContainerRef } from "@angular/core";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../configurable-enum.interface";

describe("ConfigurableEnumDirective", () => {
  let testTemplateRef;
  let mockViewContainerRef: jasmine.SpyObj<ViewContainerRef>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    testTemplateRef = {};
    mockViewContainerRef = jasmine.createSpyObj("mockViewContainerRef", [
      "createEmbeddedView",
    ]);
    mockConfigService = jasmine.createSpyObj("mockConfigService", [
      "getConfig",
    ]);
  });

  it("should create an instance", () => {
    const directive = new ConfigurableEnumDirective(
      testTemplateRef,
      mockViewContainerRef,
      mockConfigService
    );
    expect(directive).toBeTruthy();
  });

  it("creates a view for each enum config value", () => {
    const testEnumConfigId = "test-enum";
    const testEnumValues: ConfigurableEnumConfig = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    mockConfigService.getConfig.and.returnValue(testEnumValues);

    const directive = new ConfigurableEnumDirective(
      testTemplateRef,
      mockViewContainerRef,
      mockConfigService
    );

    directive.appConfigurableEnumOf = testEnumConfigId;

    expect(mockConfigService.getConfig).toHaveBeenCalledWith(
      CONFIGURABLE_ENUM_CONFIG_PREFIX + testEnumConfigId
    );
    expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(
      testEnumValues.length
    );
  });
});
