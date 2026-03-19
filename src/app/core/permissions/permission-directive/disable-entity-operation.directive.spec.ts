import type { Mock } from "vitest";
import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Entity } from "../../entity/model/entity";
import { EntityAbility } from "../ability/entity-ability";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntitySubject } from "../permission-types";

describe("DisableEntityOperationDirective", () => {
  let testComponent: ComponentFixture<TestComponent>;
  let mockAbility: EntityAbility;

  let callbackOnAbilityUpdate;

  beforeEach(() => {
    mockAbility = {
      cannot: vi.fn(),
      on: vi.fn().mockImplementation((_, callback) => {
        callbackOnAbilityUpdate = callback;
        return () => {};
      }),
      update: vi.fn(),
    } as Partial<EntityAbility> as EntityAbility;

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
    ).toBe(true);
  });

  it("should enable a component when operation is permitted", () => {
    createComponent(false);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(false);
  });

  it("should re-rest the disabled property when a new value arrives", () => {
    createComponent(false);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(false);

    (mockAbility.cannot as Mock).mockReturnValue(true);
    callbackOnAbilityUpdate();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(true);
  });

  it("should re-evaluate the ability whenever it is updated", () => {
    createComponent(true);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(true);

    (mockAbility.cannot as Mock).mockReturnValue(false);
    mockAbility.update([{ action: "manage", subject: "all" }]);
    callbackOnAbilityUpdate(); // Simulate the ability update callback

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(false);
  });

  it("should disable when all subjects in array are not permitted", () => {
    (mockAbility.cannot as Mock).mockReturnValue(true);
    testComponent = TestBed.createComponent(TestComponent);
    testComponent.componentInstance.entity = [Entity, TestEntity];
    testComponent.detectChanges();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(true);
  });

  it("should enable when at least one subject in array is permitted", () => {
    (mockAbility.cannot as Mock).mockImplementation(
      (_, subject) => subject !== TestEntity,
    );
    testComponent = TestBed.createComponent(TestComponent);
    testComponent.componentInstance.entity = [Entity, TestEntity];
    testComponent.detectChanges();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled,
    ).toBe(false);
  });

  function createComponent(disabled: boolean = true) {
    (mockAbility.cannot as Mock).mockReturnValue(disabled);
    testComponent = TestBed.createComponent(TestComponent);
    testComponent.detectChanges();
  }
});

@Component({
  template: ` <button
    *appDisabledEntityOperation="{
      operation: 'create',
      entity: entity,
    }"
    #button
  ></button>`,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
class TestComponent {
  public entity: EntitySubject | EntitySubject[] = Entity;
  @ViewChild("button")
  public buttonRef: ElementRef;
}
