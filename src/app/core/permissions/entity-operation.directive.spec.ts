import { EntityOperationDirective } from "./entity-operation.directive";
import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { fakeAsync, TestBed, tick, flush } from "@angular/core/testing";
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

  it("should show a tooltip when the mouse enters the disabled field", fakeAsync(() => {
    mockEntityPermissionService.userIsPermitted.and.returnValue(false);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();
    tick();
    const mouseEnterEvent = new Event("mouseenter", {});
    component.componentInstance.buttonRef.nativeElement.dispatchEvent(
      mouseEnterEvent
    );
    expect(mockTooltipService.showTooltip).toHaveBeenCalled();
    flush();
    expect(mockTooltipService.hideTooltip).toHaveBeenCalled();
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
