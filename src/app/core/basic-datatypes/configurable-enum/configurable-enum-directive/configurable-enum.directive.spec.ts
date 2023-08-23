import { ConfigurableEnumDirective } from "./configurable-enum.directive";
import { ViewContainerRef } from "@angular/core";
import { ConfigurableEnumConfig } from "../configurable-enum.interface";
import { ConfigurableEnumService } from "../configurable-enum.service";

describe("ConfigurableEnumDirective", () => {
  let testTemplateRef;
  let mockViewContainerRef: jasmine.SpyObj<ViewContainerRef>;
  let mockEnumService: jasmine.SpyObj<ConfigurableEnumService>;

  beforeEach(() => {
    testTemplateRef = {};
    mockViewContainerRef = jasmine.createSpyObj("mockViewContainerRef", [
      "createEmbeddedView",
    ]);
    mockEnumService = jasmine.createSpyObj("mockConfigService", [
      "getEnumValues",
    ]);
  });

  it("should create an instance", () => {
    const directive = new ConfigurableEnumDirective(
      testTemplateRef,
      mockViewContainerRef,
      mockEnumService,
    );
    expect(directive).toBeTruthy();
  });

  it("creates a view for each enum config value", () => {
    const testEnumConfigId = "test-enum";
    const testEnumValues: ConfigurableEnumConfig = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    mockEnumService.getEnumValues.and.returnValue(testEnumValues);

    const directive = new ConfigurableEnumDirective(
      testTemplateRef,
      mockViewContainerRef,
      mockEnumService,
    );

    directive.appConfigurableEnumOf = testEnumConfigId;

    expect(mockEnumService.getEnumValues).toHaveBeenCalledWith(
      testEnumConfigId,
    );
    expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(
      testEnumValues.length,
    );
  });
});
