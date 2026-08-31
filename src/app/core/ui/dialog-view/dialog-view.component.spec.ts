import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DialogViewComponent } from "./dialog-view.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentRegistry } from "../../../dynamic-components";
import { Component, Input } from "@angular/core";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Router } from "@angular/router";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
@Component({
  template: ``,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
class MockComponent {
  @Input() dialogDetail: string;
  @Input() viewConfig: string;
  @Input() entity: TestEntity;
}

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

  it("should take component from dialog data and use it for dynamic component directive", async () => {
    mockDialogData.component = "TestComponent";
    createComponent();

    expect(component.component).toEqual("TestComponent");
  });

  it("should pass dialog config data on as config", async () => {
    mockDialogData.config = { dialogDetail: "1" };
    createComponent();

    expect(component.config).toEqual({ dialogDetail: "1" });
  });

  it("should add view config for given entity type as config", async () => {
    const testEntity = new TestEntity();
    mockDialogData.config = { dialogDetail: "1" };
    mockDialogData.entity = testEntity;

    const testRouteConfig = { config: { viewConfig: "2" } };
    mockRouter.config.push({
      path: "c/test-entity/:id",
      data: testRouteConfig,
    });
    mockRouter.config.push({ path: "other", data: {} });

    createComponent();

    expect(component.config).toEqual({
      dialogDetail: "1",
      viewConfig: "2",
      entity: testEntity,
    });
  });
});
