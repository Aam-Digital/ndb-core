import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RoutedViewComponent } from "./routed-view.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { ComponentRegistry } from "../../../dynamic-components";
import { Component, input } from "@angular/core";

@Component({
  template: ``,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
class MockComponent {
  testFlag = input<boolean>();
  testDetail = input<string>();
  id = input<string>();
}

describe("RoutedViewComponent", () => {
  let component: RoutedViewComponent;
  let fixture: ComponentFixture<RoutedViewComponent>;

  let mockActivatedRoute;

  function mockParamMap(params: { [key: string]: any }) {
    return { keys: Object.keys(params), get: (key: string) => params[key] };
  }

  beforeEach(() => {
    mockActivatedRoute = {
      data: new BehaviorSubject({
        component: "InitialComponent",
        config: { testFlag: true },
      }),
      paramMap: new BehaviorSubject(mockParamMap({})),
    };

    TestBed.configureTestingModule({
      imports: [RoutedViewComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute as unknown as ActivatedRoute,
        },
        {
          provide: ComponentRegistry,
          useValue: { get: () => async () => MockComponent },
        },
      ],
    });
    fixture = TestBed.createComponent(RoutedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should take component from route data and use it for dynamic component directive", async () => {
    vi.useFakeTimers();
    try {
      mockActivatedRoute.data.next({ component: "TestComponent" });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.component).toEqual("TestComponent");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should pass config route data on as config", async () => {
    vi.useFakeTimers();
    try {
      mockActivatedRoute.data.next({ config: { testDetail: "test" } });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.config).toEqual({ testDetail: "test" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("should add route param '/:id' to config", async () => {
    vi.useFakeTimers();
    try {
      mockActivatedRoute.paramMap.next(mockParamMap({ id: "123" }));
      await vi.advanceTimersByTimeAsync(0);

      expect(component.config.id).toEqual("123");
    } finally {
      vi.useRealTimers();
    }
  });
});
