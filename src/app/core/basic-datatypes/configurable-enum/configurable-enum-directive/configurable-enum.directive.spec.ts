import { ConfigurableEnumDirective } from "./configurable-enum.directive";
import { TemplateRef, ViewContainerRef } from "@angular/core";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { ConfigurableEnumConfig } from "../configurable-enum.types";
import { TestBed } from "@angular/core/testing";

describe("ConfigurableEnumDirective", () => {
  let mockTemplateRef: jasmine.SpyObj<TemplateRef<any>>;
  let mockViewContainerRef: jasmine.SpyObj<ViewContainerRef>;
  let mockEnumService: jasmine.SpyObj<ConfigurableEnumService>;
  let directive: ConfigurableEnumDirective;

  beforeEach(() => {
    mockTemplateRef = jasmine.createSpyObj("TemplateRef", ["elementRef"]);
    mockViewContainerRef = jasmine.createSpyObj("ViewContainerRef", [
      "createEmbeddedView",
    ]);
    mockEnumService = jasmine.createSpyObj("ConfigurableEnumService", [
      "getEnumValues",
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: TemplateRef, useValue: mockTemplateRef },
        { provide: ViewContainerRef, useValue: mockViewContainerRef },
        { provide: ConfigurableEnumService, useValue: mockEnumService },
        ConfigurableEnumDirective,
      ],
    });

    directive = TestBed.inject(ConfigurableEnumDirective);
  });

  it("should create an instance", () => {
    expect(directive).toBeTruthy();
  });

  it("creates a view for each enum config value", () => {
    const testEnumConfigId = "test-enum";
    const testEnumValues: ConfigurableEnumConfig = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    mockEnumService.getEnumValues.and.returnValue(testEnumValues);

    directive.appConfigurableEnumOf = testEnumConfigId;

    expect(mockEnumService.getEnumValues).toHaveBeenCalledWith(
      testEnumConfigId,
    );
    expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(
      testEnumValues.length,
    );
  });
});
