import { ConfigurableEnumDirective } from "./configurable-enum.directive";
import { TemplateRef, ViewContainerRef } from "@angular/core";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { ConfigurableEnumConfig } from "../configurable-enum.types";
import { TestBed } from "@angular/core/testing";
import type { Mock } from "vitest";

type TemplateRefMock = {
  elementRef: Mock;
};

type ViewContainerRefMock = {
  createEmbeddedView: Mock;
};

type ConfigurableEnumServiceMock = {
  getEnumValues: Mock;
};

describe("ConfigurableEnumDirective", () => {
  let mockTemplateRef: TemplateRefMock;
  let mockViewContainerRef: ViewContainerRefMock;
  let mockEnumService: ConfigurableEnumServiceMock;
  let directive: ConfigurableEnumDirective;

  beforeEach(() => {
    mockTemplateRef = {
      elementRef: vi.fn().mockName("TemplateRef.elementRef"),
    };
    mockViewContainerRef = {
      createEmbeddedView: vi
        .fn()
        .mockName("ViewContainerRef.createEmbeddedView"),
    };
    mockEnumService = {
      getEnumValues: vi.fn().mockName("ConfigurableEnumService.getEnumValues"),
    };

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
    mockEnumService.getEnumValues.mockReturnValue(testEnumValues);

    directive.appConfigurableEnumOf = testEnumConfigId;

    expect(mockEnumService.getEnumValues).toHaveBeenCalledWith(
      testEnumConfigId,
    );
    expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(
      testEnumValues.length,
    );
  });
});
