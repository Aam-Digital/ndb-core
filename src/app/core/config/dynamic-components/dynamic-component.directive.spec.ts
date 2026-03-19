import { TestBed } from "@angular/core/testing";
import {
  ChangeDetectorRef,
  Component,
  ViewContainerRef,
  input,
} from "@angular/core";
import { DynamicComponentDirective } from "./dynamic-component.directive";
import { ComponentRegistry } from "../../../dynamic-components";

@Component({
  selector: "app-test-signal-input",
  template: "",
})
class TestSignalInputComponent {
  signalInput = input<number>(1);
}

describe("DynamicComponentDirective", () => {
  let directive: DynamicComponentDirective;
  let mockContainer: any;
  let mockDetector: any;
  let mockRegistry: any;

  beforeEach(() => {
    mockContainer = {
      clear: vi.fn(),
      createComponent: vi.fn(),
    };
    mockDetector = {
      detectChanges: vi.fn(),
    };
    mockRegistry = {
      get: vi.fn(),
    };
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
    mockRegistry.get.mockReturnValue(() => Promise.resolve(comp));

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
    const setInputSpy = vi.fn();
    const compRef: any = {
      componentType: comp,
      setInput: setInputSpy,
    };
    mockRegistry.get.mockReturnValue(() => Promise.resolve(comp));
    mockContainer.createComponent.mockReturnValue(compRef);

    await directive.ngOnChanges();

    expect(setInputSpy).toHaveBeenCalledWith("numberProp", 0);
    expect(setInputSpy).toHaveBeenCalledWith("stringProp", "should exist");
    expect(setInputSpy).not.toHaveBeenCalledWith(
      "missingProp",
      expect.anything(),
    );
    expect(setInputSpy).not.toHaveBeenCalledWith(
      "otherProp",
      expect.anything(),
    );
  });

  it("should use setInput for signal inputs without mutating the signal property", async () => {
    directive.appDynamicComponent = {
      component: "TestComp",
      config: {
        signalInput: 42,
      },
    };

    const fixture = TestBed.createComponent(TestSignalInputComponent);
    const componentRef = fixture.componentRef;
    const setInputSpy = vi.spyOn(componentRef, "setInput");

    mockRegistry.get.mockReturnValue(() =>
      Promise.resolve(TestSignalInputComponent),
    );
    mockContainer.createComponent.mockReturnValue(componentRef);

    await directive.ngOnChanges();

    expect(setInputSpy).toHaveBeenCalledWith("signalInput", 42);
    expect(typeof componentRef.instance.signalInput).toBe("function");
    expect(componentRef.instance.signalInput).not.toBe(42);
  });

  it("should skip component creation if destroyed before async load resolves", async () => {
    directive.appDynamicComponent = { component: "TestComp" };

    let resolveComponent: (component: any) => void;
    const componentPromise = new Promise<any>((resolve) => {
      resolveComponent = resolve;
    });
    mockRegistry.get.mockReturnValue(() => componentPromise);

    const loadPromise = directive.ngOnChanges();
    directive.ngOnDestroy();
    resolveComponent({} as any);

    await loadPromise;

    expect(mockContainer.createComponent).not.toHaveBeenCalled();
    expect(mockDetector.detectChanges).not.toHaveBeenCalled();
  });
});
