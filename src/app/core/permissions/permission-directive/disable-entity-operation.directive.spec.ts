import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Entity } from "../../entity/model/entity";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityAbility } from "../ability/entity-ability";

describe("DisableEntityOperationDirective", () => {
  let testComponent: ComponentFixture<TestComponent>;
  let mockAbility: EntityAbility;

  beforeEach(() => {
    mockAbility = new EntityAbility(null);
    spyOn(mockAbility, "cannot");

    TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [DisableEntityOperationDirective],
      providers: [{ provide: EntityAbility, useValue: mockAbility }],
    });
  });

  it("should create a component that is using the directive", () => {
    createComponent();
    expect(testComponent).toBeTruthy();
  });

  it("should disable an element when operation is not permitted", () => {
    createComponent(true);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBeTrue();
  });

  it("should enable a component when operation is permitted", () => {
    createComponent(false);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBeFalse();
  });

  it("should re-rest the disabled property when a new value arrives", () => {
    createComponent(false);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBeFalse();

    (mockAbility.cannot as jasmine.Spy).and.returnValue(true);
    testComponent.componentInstance.entityConstructor = Child;
    testComponent.detectChanges();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBeTrue();
  });

  it("should re-evaluate the ability whenever it is updated", () => {
    createComponent(true);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBeTrue();

    (mockAbility.cannot as jasmine.Spy).and.returnValue(false);
    mockAbility.update([{ action: "manage", subject: "all" }]);
    testComponent.detectChanges();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBeFalse();
  });

  function createComponent(disabled: boolean = true) {
    (mockAbility.cannot as jasmine.Spy).and.returnValue(disabled);
    testComponent = TestBed.createComponent(TestComponent);
    testComponent.detectChanges();
  }
});

@Component({
  template: ` <button
    *appDisabledEntityOperation="{
      operation: 'create',
      entity: entityConstructor
    }"
    #button
  ></button>`,
})
class TestComponent {
  public entityConstructor = Entity;
  @ViewChild("button") public buttonRef: ElementRef;
}
