import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { RoutedViewComponent } from "./routed-view.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { ComponentRegistry } from "../../../dynamic-components";
import { Component } from "@angular/core";

@Component({
  template: ``,
})
class MockComponent {}

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

  it("should take component from route data and use it for dynamic component directive", fakeAsync(() => {
    mockActivatedRoute.data.next({ component: "TestComponent" });
    tick();

    expect(component.component).toEqual("TestComponent");
  }));

  it("should pass config route data on as config", fakeAsync(() => {
    mockActivatedRoute.data.next({ config: { testDetail: "test" } });
    tick();

    expect(component.config).toEqual({ testDetail: "test" });
  }));

  it("should add route param '/:id' to config", fakeAsync(() => {
    mockActivatedRoute.paramMap.next(mockParamMap({ id: "123" }));
    tick();

    expect(component.config.id).toEqual("123");
  }));
});
