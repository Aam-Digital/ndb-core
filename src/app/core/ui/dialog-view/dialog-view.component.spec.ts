import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { DialogViewComponent } from "./dialog-view.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentRegistry } from "../../../dynamic-components";
import { Component } from "@angular/core";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Router } from "@angular/router";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

@Component({
  template: ``,
})
class MockComponent {}

describe("DialogViewComponent", () => {
  let component: DialogViewComponent;
  let fixture: ComponentFixture<DialogViewComponent>;

  let mockDialogData;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockDialogData = {};
    mockRouter = { config: [] };

    TestBed.configureTestingModule({
      imports: [DialogViewComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockDialogData,
        },
        {
          provide: ComponentRegistry,
          useValue: { get: () => async () => MockComponent },
        },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  /**
   * create component (not done in beforeEach because initialization happens in constructor for this dialog)
   */
  function createComponent() {
    fixture = TestBed.createComponent(DialogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("should take component from dialog data and use it for dynamic component directive", fakeAsync(() => {
    mockDialogData.component = "TestComponent";
    createComponent();

    expect(component.component).toEqual("TestComponent");
  }));

  it("should pass dialog config data on as config", fakeAsync(() => {
    mockDialogData.config = { dialogDetail: "1" };
    createComponent();

    expect(component.config).toEqual({ dialogDetail: "1" });
  }));

  it("should add view config for given entity type as config", fakeAsync(() => {
    const testEntity = new TestEntity();
    mockDialogData.config = { dialogDetail: "1" };
    mockDialogData.entity = testEntity;

    const testRouteConfig = { config: { viewConfig: "2" } };
    mockRouter.config.push({ path: "test-entity/:id", data: testRouteConfig });
    mockRouter.config.push({ path: "other", data: {} });

    createComponent();

    expect(component.config).toEqual({
      dialogDetail: "1",
      viewConfig: "2",
      entity: testEntity,
    });
  }));
});
