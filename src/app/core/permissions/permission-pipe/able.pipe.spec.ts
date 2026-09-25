import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AblePipe } from "./able.pipe";
import { EntityAbility } from "../ability/entity-ability";
import { entityAbilityFactory } from "../ability/testing-entity-ability-factory";
import { DatabaseRule, EntitySubject } from "../permission-types";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("AblePipe", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let ability: EntityAbility;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: EntityAbility, useFactory: entityAbilityFactory }],
    });

    ability = TestBed.inject(EntityAbility);
  });

  function createComponent(rules: DatabaseRule[]): void {
    ability.update(rules);
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }

  function renderedActions(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll("[data-test-action]"),
      (el: HTMLElement) => el.getAttribute("data-test-action"),
    );
  }

  it.each([
    ["a matching rule", [{ action: "update", subject: "TestEntity" }], true],
    ["a wildcard rule", [{ action: "manage", subject: "all" }], true],
    ["no rule at all", [], false],
    [
      "a rule for another action",
      [{ action: "read", subject: "TestEntity" }],
      false,
    ],
  ] as [string, DatabaseRule[], boolean][])(
    "renders the guarded content only if the rules permit the action (%s)",
    (_name, rules, expected) => {
      createComponent(rules);

      expect(renderedActions()).toEqual(expected ? ["update"] : []);
    },
  );

  it("re-renders an OnPush view when the ability rules change", () => {
    createComponent([]);
    expect(renderedActions()).toEqual([]);

    ability.update([{ action: "manage", subject: "all" }]);
    fixture.detectChanges();

    expect(renderedActions()).toEqual(["update"]);
  });

  it("applies rules restricted to specific fields", () => {
    createComponent([
      { action: "update", subject: "TestEntity", fields: ["name"] },
    ]);

    expect(renderedFields()).toEqual(["name"]);
  });

  function renderedFields(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll("[data-test-field]"),
      (el: HTMLElement) => el.getAttribute("data-test-field"),
    );
  }
});

/**
 * The pipe is used in OnPush components, whose views are only checked when
 * something marks them dirty - so the pipe is put into a child component here,
 * which a change detection run of the host does not check on its own.
 */
@Component({
  selector: "app-test-permission-guarded",
  template: `
    @if ("update" | able: subject()) {
      <span data-test-action="update"></span>
    }
    @for (field of ["name", "other"]; track field) {
      @if ("update" | able: subject() : field) {
        <span [attr.data-test-field]="field"></span>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AblePipe],
})
class PermissionGuardedComponent {
  readonly subject = input.required<EntitySubject>();
}

@Component({
  template: `<app-test-permission-guarded [subject]="subject" />`,
  imports: [PermissionGuardedComponent],
})
class TestHostComponent {
  readonly subject: EntitySubject = TestEntity;
}
