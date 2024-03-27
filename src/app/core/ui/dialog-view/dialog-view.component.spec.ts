import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { DialogViewComponent } from "./dialog-view.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentRegistry } from "../../../dynamic-components";
import { Component } from "@angular/core";
import { EntityConfigService } from "../../entity/entity-config.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Entity } from "../../entity/model/entity";

@Component({
  template: ``,
})
class MockComponent {}

describe("DialogViewComponent", () => {
  let component: DialogViewComponent;
  let fixture: ComponentFixture<DialogViewComponent>;

  let mockDialogData;
  let mockEntityConfigService: jasmine.SpyObj<EntityConfigService>;

  beforeEach(() => {
    mockDialogData = {};
    mockEntityConfigService = jasmine.createSpyObj(["getDetailsViewConfig"]);

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
        { provide: EntityConfigService, useValue: mockEntityConfigService },
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
    const testEntity = new Entity();
    mockDialogData.config = { dialogDetail: "1" };
    mockDialogData.entity = testEntity;
    mockEntityConfigService.getDetailsViewConfig.and.returnValue({
      config: {
        viewConfig: "2",
      },
    } as any);
    createComponent();

    expect(component.config).toEqual({
      dialogDetail: "1",
      viewConfig: "2",
      entity: testEntity,
    });
    expect(mockEntityConfigService.getDetailsViewConfig).toHaveBeenCalledWith(
      Entity,
    );
  }));
});
