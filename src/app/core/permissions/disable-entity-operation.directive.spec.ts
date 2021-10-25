import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { OperationType } from "./entity-permissions.service";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Entity } from "../entity/model/entity";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityAbility } from "./ability.service";
import { Child } from "../../child-dev-project/children/model/child";

describe("DisableEntityOperationDirective", () => {
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(() => {
    mockAbility = jasmine.createSpyObj(["cannot"]);
    TestBed.configureTestingModule({
      declarations: [TestComponent, DisableEntityOperationDirective],
      imports: [MatTooltipModule],
      providers: [{ provide: EntityAbility, useValue: mockAbility }],
    });
  });

  it("should create a component that is using the directive", () => {
    const component = TestBed.createComponent(TestComponent);
    expect(component).toBeTruthy();
  });

  it("should disable an element when operation is not permitted", fakeAsync(() => {
    mockAbility.cannot.and.returnValue(true);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();
    tick();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();
  }));

  it("should enable a component when operation is permitted", fakeAsync(() => {
    mockAbility.cannot.and.returnValue(false);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();
    tick();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();
  }));

  it("should re-rest the disabled property when a new value arrives", () => {
    mockAbility.cannot.and.returnValue(false);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();

    mockAbility.cannot.and.returnValue(true);
    component.componentInstance.entityConstructor = Child;
    component.detectChanges();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();
  });
});

@Component({
  template: `<button
    *appDisabledEntityOperation="{
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
