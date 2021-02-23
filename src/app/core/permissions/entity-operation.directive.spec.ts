import { EntityOperationDirective } from "./entity-operation.directive";
import {
  EntityPermissionsService,
  OperationType,
} from "./entity-permissions.service";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Entity } from "../entity/entity";
import { MatTooltipModule } from "@angular/material/tooltip";

describe("EntityOperationDirective", () => {
  const mockEntityPermissionService: jasmine.SpyObj<EntityPermissionsService> = jasmine.createSpyObj(
    ["userIsPermitted"]
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, EntityOperationDirective],
      imports: [MatTooltipModule],
      providers: [
        {
          provide: EntityPermissionsService,
          useValue: mockEntityPermissionService,
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
});

@Component({
  template: `<button
    *appEntityOperation="{
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
