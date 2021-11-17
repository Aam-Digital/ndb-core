import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Entity } from "../entity/model/entity";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityAbility } from "./ability.service";
import { Child } from "../../child-dev-project/children/model/child";
import { SessionService } from "../session/session-service/session.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { Subject } from "rxjs";

describe("DisableEntityOperationDirective", () => {
  let testComponent: ComponentFixture<TestComponent>;
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
    createComponent();
    expect(testComponent).toBeTruthy();
  });

  it("should disable an element when operation is not permitted", () => {
    createComponent(true);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();
  });

  it("should enable a component when operation is permitted", () => {
    createComponent(false);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();
  });

  it("should re-rest the disabled property when a new value arrives", () => {
    createComponent(false);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();

    mockAbility.cannot.and.returnValue(true);
    testComponent.componentInstance.entityConstructor = Child;
    testComponent.detectChanges();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();
  });

  it("should re-evaluate the ability whenever a new user is logged in", () => {
    createComponent(true);

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled
    ).toBeTrue();

    mockAbility.cannot.and.returnValue(false);
    mockLoginState.next(LoginState.LOGGED_IN);
    testComponent.detectChanges();

    expect(
      testComponent.componentInstance.buttonRef.nativeElement.disabled
    ).toBeFalse();
  });

  function createComponent(disabled: boolean = true) {
    mockAbility.cannot.and.returnValue(disabled);
    testComponent = TestBed.createComponent(TestComponent);
    testComponent.detectChanges();
  }
});

@Component({
  template: `<button
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
