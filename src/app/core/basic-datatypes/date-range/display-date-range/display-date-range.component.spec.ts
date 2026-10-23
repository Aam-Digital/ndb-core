import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MatTooltip } from "@angular/material/tooltip";
import { mockEntityMapperProvider } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { Entity } from "../../../entity/model/entity";
import { CustomDatePipe } from "../../date/custom-date.pipe";
import { DateRangeValue } from "../date-range.datatype";
import { DisplayDateRangeComponent } from "./display-date-range.component";

@DatabaseEntity("DisplayDateRangeTestEntity")
class DisplayDateRangeTestEntity extends Entity {
  @DatabaseField({ dataType: "date-range", anonymize: "retain-anonymized" })
  period: DateRangeValue;
}

@DatabaseEntity("DisplayDateRangeTestAction")
class DisplayDateRangeTestAction extends Entity {
  static override toStringAttributes = ["name"];

  @DatabaseField() name: string;

  @DatabaseField({
    dataType: "entity",
    additional: "DisplayDateRangeTestAction",
  })
  parent: string;

  @DatabaseField({
    dataType: "date-range",
    withinParent: { parentReferenceField: "parent" },
  })
  period: DateRangeValue;
}

describe("DisplayDateRangeComponent", () => {
  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 4, 31);

  function render(value: DateRangeValue | undefined): string {
    const fixture = TestBed.createComponent(DisplayDateRangeComponent);
    fixture.componentRef.setInput("value", value);
    fixture.detectChanges();
    return fixture.nativeElement.textContent.replace(/\s+/g, " ").trim();
  }

  function formatted(date: Date): string {
    return TestBed.runInInjectionContext(() =>
      new CustomDatePipe().transform(date, "shortDate"),
    );
  }

  const parentAction = Object.assign(new DisplayDateRangeTestAction("1"), {
    name: "Training",
    period: { start, end },
  });
  const anonymizedParent = Object.assign(new DisplayDateRangeTestAction("2"), {
    anonymized: true,
    period: { start, end },
  });

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider([parentAction, anonymizedParent]),
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }),
  );

  function renderOfRecord(value: DateRangeValue, anonymized: boolean) {
    const entity = new DisplayDateRangeTestEntity();
    entity.anonymized = anonymized;
    const fixture = TestBed.createComponent(DisplayDateRangeComponent);
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("id", "period");
    fixture.componentRef.setInput("value", value);
    fixture.detectChanges();
    return {
      text: fixture.nativeElement.textContent.replace(/\s+/g, " ").trim(),
      hasWarning: !!fixture.nativeElement.querySelector("app-fa-dynamic-icon"),
    };
  }

  it.each([
    [
      "both dates",
      { start, end },
      () => `${formatted(start)} - ${formatted(end)}`,
    ],
    ["only a start date", { start }, () => `from ${formatted(start)}`],
    ["only an end date", { end }, () => `until ${formatted(end)}`],
    ["no value", undefined, () => ""],
  ])("should show %s", (_, value, expected) => {
    expect(render(value)).toBe(expected());
  });

  it.each([
    [
      "both dates",
      { start: new Date(2026, 6, 1), end: new Date(2027, 6, 1) },
      "2026 - 2027",
    ],
    ["only a start date", { start: new Date(2026, 6, 1) }, "from 2026"],
    ["only an end date", { end: new Date(2027, 6, 1) }, "until 2027"],
  ])(
    "should show only the years and a warning for an anonymized record: %s",
    (_, value, expected) => {
      expect(renderOfRecord(value, true)).toEqual({
        text: expected,
        hasWarning: true,
      });
    },
  );

  it("should show the dates without a warning for a record that is not anonymized", () => {
    const result = renderOfRecord({ start, end }, false);

    expect(result.text).toBe(`${formatted(start)} - ${formatted(end)}`);
    expect(result.hasWarning).toBe(false);
  });

  async function warningOfLinkedRecord(
    period: DateRangeValue,
    parent: string | undefined,
    anonymized = false,
  ): Promise<string | undefined> {
    const action = Object.assign(new DisplayDateRangeTestAction(), {
      parent,
      period,
      anonymized,
    });
    const fixture = TestBed.createComponent(DisplayDateRangeComponent);
    fixture.componentRef.setInput("entity", action);
    fixture.componentRef.setInput("id", "period");
    fixture.componentRef.setInput("value", period);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.debugElement
      .query(By.directive(MatTooltip))
      ?.injector.get(MatTooltip).message;
  }

  it("warns when the period goes beyond the period of the linked parent record", async () => {
    const warning = await warningOfLinkedRecord(
      { start: new Date(2026, 4, 20), end: new Date(2026, 5, 15) },
      parentAction.getId(),
    );

    expect(warning).toContain("Training");
  });

  it.each([
    [
      "lies within the parent's period",
      { start: new Date(2026, 2, 10), end: new Date(2026, 2, 20) },
      parentAction.getId(),
      false,
    ],
    ["has no parent linked", { start: new Date(2025, 0, 1) }, undefined, false],
    [
      "links a parent that does not exist",
      { start: new Date(2025, 0, 1) },
      "DisplayDateRangeTestAction:missing",
      false,
    ],
    [
      "belongs to an anonymized record (its dates are moved to 1 July)",
      { start: new Date(2026, 6, 1), end: new Date(2026, 6, 1) },
      parentAction.getId(),
      true,
    ],
    [
      "links an anonymized parent",
      { start: new Date(2025, 0, 1) },
      anonymizedParent.getId(),
      false,
    ],
  ])(
    "shows no warning for a period that %s",
    async (_, period, parent, anonymized) => {
      expect(
        await warningOfLinkedRecord(period, parent, anonymized),
      ).toBeUndefined();
    },
  );
});
