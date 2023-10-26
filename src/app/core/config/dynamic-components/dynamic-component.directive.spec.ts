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
    const changesSpy = jasmine.createSpy();
    const comp: any = {
      prototype: {
        constructor: {
          ["ɵcmp"]: {
            inputs: { numberProp: {}, stringProp: {}, otherProp: {} },
          },
        },
      },
    };
    const compRef: any = { instance: { ngOnChanges: changesSpy } };
    mockRegistry.get.and.returnValue(() => Promise.resolve(comp));
    mockContainer.createComponent.and.returnValue(compRef);

    await directive.ngOnChanges();

    expect(compRef.instance.numberProp).toBe(0);
    expect(compRef.instance.stringProp).toBe("should exist");
    expect(compRef.instance.missingProp).toBeUndefined();
    expect(compRef.instance.otherProp).toBeUndefined();
    expect(compRef.instance.ngOnChanges).toHaveBeenCalledWith({
      numberProp: jasmine.anything(),
      stringProp: jasmine.anything(),
    });
  });
});
