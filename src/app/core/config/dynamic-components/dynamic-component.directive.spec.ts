import { TestBed } from "@angular/core/testing";
import { ChangeDetectorRef, ViewContainerRef } from "@angular/core";
import { DynamicComponentDirective } from "./dynamic-component.directive";
import { ComponentRegistry } from "../../../dynamic-components";

describe("DynamicComponentDirective", () => {
  let directive: DynamicComponentDirective;
  let mockContainer: jasmine.SpyObj<ViewContainerRef>;
  let mockDetector: jasmine.SpyObj<ChangeDetectorRef>;
  let mockRegistry: jasmine.SpyObj<ComponentRegistry>;

  beforeEach(() => {
    mockContainer = jasmine.createSpyObj(["clear", "createComponent"]);
    mockDetector = jasmine.createSpyObj(["detectChanges"]);
    mockRegistry = jasmine.createSpyObj(["get"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ViewContainerRef, useValue: mockContainer },
        { provide: ChangeDetectorRef, useValue: mockDetector },
        { provide: ComponentRegistry, useValue: mockRegistry },
        DynamicComponentDirective,
      ],
    });
    directive = TestBed.inject(DynamicComponentDirective);
  });

  it("should create the configured component", async () => {
    directive.appDynamicComponent = { component: "TestComp" };
    const comp = {} as any;
    mockRegistry.get.and.returnValue(() => Promise.resolve(comp));

    await directive.ngOnChanges();

    expect(mockRegistry.get).toHaveBeenCalledWith("TestComp");
    expect(mockContainer.createComponent).toHaveBeenCalledWith(comp);
  });

  it("should assign the properties to the component", async () => {
    directive.appDynamicComponent = {
      component: "TestComp",
      config: {
        numberProp: 0,
        stringProp: "should exist",
        missingProp: "should not exist",
      },
    };
    const comp: any = {
      prototype: {
        constructor: {
          ["ɵcmp"]: {
            inputs: { numberProp: {}, stringProp: {}, otherProp: {} },
          },
        },
      },
    };
    const setInputSpy = jasmine.createSpy("setInput");
    const compRef: any = {
      componentType: comp,
      setInput: setInputSpy,
    };
    mockRegistry.get.and.returnValue(() => Promise.resolve(comp));
    mockContainer.createComponent.and.returnValue(compRef);

    await directive.ngOnChanges();

    expect(setInputSpy).toHaveBeenCalledWith("numberProp", 0);
    expect(setInputSpy).toHaveBeenCalledWith("stringProp", "should exist");
    expect(setInputSpy).not.toHaveBeenCalledWith(
      "missingProp",
      jasmine.anything(),
    );
    expect(setInputSpy).not.toHaveBeenCalledWith(
      "otherProp",
      jasmine.anything(),
    );
  });
});
