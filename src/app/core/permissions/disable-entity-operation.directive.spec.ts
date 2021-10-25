import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { OperationType } from "./entity-permissions.service";
import { Component, ElementRef, ViewChild } from "@angular/core";
import {TestBed } from "@angular/core/testing";
import { Entity } from "../entity/model/entity";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityAbility } from "./ability.service";
import { Child } from "../../child-dev-project/children/model/child";
import { SessionService } from "../session/session-service/session.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { Subject } from "rxjs";

describe("DisableEntityOperationDirective", () => {
  let mockAbility: jasmine.SpyObj<EntityAbility>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockLoginState: Subject<LoginState>;

  beforeEach(() => {
    mockAbility = jasmine.createSpyObj(["cannot"]);
    mockLoginState = new Subject<LoginState>();
    mockSessionService = jasmine.createSpyObj([], {
      loginState: mockLoginState,
    });

    TestBed.configureTestingModule({
      declarations: [TestComponent, DisableEntityOperationDirective],
      imports: [MatTooltipModule],
      providers: [
        { provide: EntityAbility, useValue: mockAbility },
        { provide: SessionService, useValue: mockSessionService },
      ],
    });
  });

  it("should create a component that is using the directive", () => {
    const component = TestBed.createComponent(TestComponent);
    expect(component).toBeTruthy();
  });

  it("should disable an element when operation is not permitted", () => {
    mockAbility.cannot.and.returnValue(true);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();
  });

  it("should enable a component when operation is permitted", () => {
    mockAbility.cannot.and.returnValue(false);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();
  });

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

  it("should re-evaluate the ability whenever a new user is logged in", () => {
    mockAbility.cannot.and.returnValue(true);
    const component = TestBed.createComponent(TestComponent);
    component.detectChanges();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();

    mockAbility.cannot.and.returnValue(false);
    mockLoginState.next(LoginState.LOGGED_IN);
    component.detectChanges();

    expect(
      component.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();
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
