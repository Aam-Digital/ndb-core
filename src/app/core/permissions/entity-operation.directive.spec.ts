import { EntityOperationDirective } from "./entity-operation.directive";
import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Entity } from "../entity/entity";
import { TooltipService } from "../tooltip/tooltip.service";

describe("EntityOperationDirective", () => {
  const mockEntityPermissionService: jasmine.SpyObj<EntityPermissionsService> = jasmine.createSpyObj(
    ["userIsPermitted"]
  );
  const mockTooltipService: jasmine.SpyObj<TooltipService> = jasmine.createSpyObj(
    ["createTooltip", "showTooltip", "hideTooltip"]
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, EntityOperationDirective],
      providers: [
        {
          provide: EntityPermissionsService,
          useValue: mockEntityPermissionService,
        },
        {
          provide: TooltipService,
          useValue: mockTooltipService,
        },
      ],
    });
  });

  it("should create a component that is using the directive", () => {
    const component = TestBed.createComponent(TestComponent);
    expect(component).toBeTruthy();
  });

  it("should disable an element when operation is not permitted", fakeAsync(() => {
    mockEntityPermissionService.userIsPermitted.and.returnValue(false);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();
    tick();
    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();
  }));

  it("should enable a component when operation is permitted", fakeAsync(() => {
    mockEntityPermissionService.userIsPermitted.and.returnValue(true);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();
    tick();
    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();
  }));

  it("should call create a tooltip when entering with the mouse", fakeAsync(() => {
    mockEntityPermissionService.userIsPermitted.and.returnValue(true);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();
    tick();
    expect(mockTooltipService.createTooltip).toHaveBeenCalled();
  }));
});

@Component({
  template: `<button
    [appEntityOperation]="{
      operation: operationTypes.CREATE,
      entity: entityConstructor
    }"
    #button
  ></button>`,
})
class TestComponent {
  public operationTypes = OperationType;
  public entityConstructor = Entity;
  @ViewChild("button") public buttonRef: ElementRef;
}
