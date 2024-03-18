import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { DialogViewComponent } from "./dialog-view.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentRegistry } from "../../../dynamic-components";
import { Component } from "@angular/core";

@Component({
  template: ``,
})
class MockComponent {}

describe("DialogViewComponent", () => {
  let component: DialogViewComponent;
  let fixture: ComponentFixture<DialogViewComponent>;

  let mockDialogData;

  beforeEach(() => {
    mockDialogData = {};

    TestBed.configureTestingModule({
      imports: [DialogViewComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockDialogData,
        },
        {
          provide: ComponentRegistry,
          useValue: { get: () => async () => MockComponent },
        },
      ],
    });
    fixture = TestBed.createComponent(DialogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should take component from dialog data and use it for dynamic component directive", fakeAsync(() => {
    mockDialogData.component = "TestComponent";
    tick();

    expect(component.component).toEqual("TestComponent");
  }));

  it("should pass config route data on as config", fakeAsync(() => {
    //mockActivatedRoute.data.next({ config: { testDetail: "test" } });
    tick();

    expect(component.config).toEqual({ testDetail: "test" });
  }));

  it("should add route param '/:id' to config", fakeAsync(() => {
    // TODO: find the right view-config for the given entityType and inject it

    //mockActivatedRoute.paramMap.next(mockParamMap({ id: "123" }));
    tick();

    expect(component.config.id).toEqual("123");
  }));
});
