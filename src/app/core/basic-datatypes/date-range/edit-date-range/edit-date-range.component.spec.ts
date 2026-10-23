import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { MatTooltip } from "@angular/material/tooltip";
import { provideNativeDateAdapter } from "@angular/material/core";
import { DateRange } from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EMPTY_FILTER_OPTION_KEY } from "../../../filter/filters/filters";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { mockEntityMapperProvider } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "../../../entity/model/entity";
import { DateRangeValue } from "../date-range.datatype";
import {
  MatDialogMock,
  mockMatDialog,
  mockMatDialogRef,
} from "../../../../utils/test-utils/dialog-mocks";
import { DateRangeFilterPanelComponent } from "../../date/date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import { periodRangeOptions } from "../../date/date-range-filter/date-range-filter-panel/date-range-utils";
import {
  EditDateRangeComponent,
  endNotBeforeStart,
} from "./edit-date-range.component";

@DatabaseEntity("EditDateRangeTestAction")
class EditDateRangeTestAction extends Entity {
  static override readonly toStringAttributes = ["name"];

  @DatabaseField() name: string;
  @DatabaseField() parent: string;
  @DatabaseField({ dataType: "date-range" }) period: DateRangeValue;
  @DatabaseField({ dataType: "date-range" }) plannedPeriod: DateRangeValue;
}

describe("EditDateRangeComponent", () => {
  let component: EditDateRangeComponent;
  let fixture: ComponentFixture<EditDateRangeComponent>;
  let dialog: MatDialogMock;

  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 4, 31);
  const parentAction = Object.assign(new EditDateRangeTestAction("1"), {
    name: "Training",
    plannedPeriod: { start, end },
  });

  beforeEach(async () => {
    dialog = mockMatDialog();
    await TestBed.configureTestingModule({
      imports: [EditDateRangeComponent, NoopAnimationsModule],
      providers: [
        provideNativeDateAdapter(),
        { provide: MatDialog, useValue: dialog },
        ...mockEntityMapperProvider([parentAction]),
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDateRangeComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component, "period", {}, fixture);
    fixture.detectChanges();
  });

  it("should show a value that is set on the form control in the picker", () => {
    component.formControl.setValue({ start, end });

    expect(component.range.value).toEqual({ start, end });
  });

  it.each([
    ["both dates", { start, end }, { start, end }],
    ["only the start date", { start, end: null }, { start }],
    ["only the end date", { start: null, end }, { end }],
    ["no date", { start: null, end: null }, null],
  ])(
    "should set the value of the form control if the picker has %s",
    (_, pickerValue, expected) => {
      component.range.setValue(pickerValue);

      expect(component.formControl.value).toEqual(expected);
      expect(component.formControl.dirty).toBe(true);
    },
  );

  function typeInto(selector: string, text: string): HTMLInputElement {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(selector);
    input.value = text;
    input.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    return input;
  }

  it("should report a typed text that is not a date as an error of the field, keeping the text", () => {
    typeInto("input[matStartDate]", "3/1/2026");
    const endInput = typeInto("input[matEndDate]", "not a date");

    expect(endInput.value).toBe("not a date");
    expect(component.formControl.value).toEqual({ start });
    expect(
      component.formControl.errors?.dateRangeInput.errorMessage,
    ).toBeTruthy();
  });

  it("should accept the field again once the typed text is a date", () => {
    typeInto("input[matStartDate]", "3/1/2026");
    typeInto("input[matEndDate]", "not a date");
    typeInto("input[matEndDate]", "5/31/2026");

    expect(component.formControl.valid).toBe(true);
    expect(component.formControl.value).toEqual({ start, end });
  });

  it("should not keep a text that is not a date as an error of the field once the component is gone", () => {
    typeInto("input[matEndDate]", "not a date");
    const control = component.formControl;

    // e.g. the field is hidden by a display condition while the form stays open
    fixture.destroy();
    control.setValue({ start, end });

    expect(control.valid).toBe(true);
  });

  it("should open the panel of the date filters with the current dates, for selecting a value", () => {
    component.formControl.setValue({ start, end });

    component.openPanel(new Event("click"));

    expect(dialog.open).toHaveBeenCalledWith(
      DateRangeFilterPanelComponent,
      expect.objectContaining({
        data: {
          dateRange: new DateRange(start, end),
          rangeOptions: periodRangeOptions,
          hideAllOption: true,
        },
      }),
    );
  });

  describe("predefined periods", () => {
    const projectPhase = {
      label: "Project phase",
      startOffsets: [{ amount: 0, unit: "years" as const }],
      endOffsets: [{ amount: 2, unit: "years" as const }],
    };

    function openedPanelOptions() {
      component.openPanel(new Event("click"));
      return dialog.open.mock.calls[0][1].data.rangeOptions;
    }

    it.each([
      ["no 'additional' config", undefined, periodRangeOptions],
      ["an 'additional' config that is not a list", "none", periodRangeOptions],
      ["an empty list", [], []],
      ["a list of periods", [projectPhase], [projectPhase]],
    ])(
      "should offer the periods of %s in the panel",
      (_, additional, expected) => {
        fixture.componentRef.setInput("formFieldConfig", {
          id: "period",
          additional,
        });

        expect(openedPanelOptions()).toEqual(expected);
      },
    );

    it("should set the field to the range of a configured period selected in the panel", () => {
      fixture.componentRef.setInput("formFieldConfig", {
        id: "period",
        additional: [projectPhase],
      });
      dialog.open.mockReturnValue(
        mockMatDialogRef({ selectedOptionValues: ["0"] }),
      );

      component.openPanel(new Event("click"));

      const year = new Date().getFullYear();
      expect(component.formControl.value).toEqual({
        start: new Date(year, 0, 1),
        end: new Date(year + 2, 11, 31),
      });
    });
  });

  it("should not open the panel while the field cannot be edited", () => {
    component.formControl.disable();
    fixture.detectChanges();

    component.openPanel(new Event("click"));

    expect(dialog.open).not.toHaveBeenCalled();
  });

  const today = new Date();
  it.each([
    [
      "two dates picked in the calendar",
      { selectedOptionValues: ["2026-04-01", "2026-04-30"] },
      { start: new Date(2026, 3, 1), end: new Date(2026, 3, 30) },
    ],
    [
      "the predefined range of the current month",
      { selectedOptionValues: ["0"] },
      {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      },
    ],
    [
      "'no date defined'",
      { selectedOptionValues: [EMPTY_FILTER_OPTION_KEY] },
      null,
    ],
    ["nothing (the panel is closed)", undefined, { start, end }],
  ])(
    "should set the field to what is selected in the panel: %s",
    (_, panelResult, expected) => {
      component.formControl.setValue({ start, end });
      dialog.open.mockReturnValue(mockMatDialogRef(panelResult));

      component.openPanel(new Event("click"));

      expect(component.formControl.value).toEqual(expected);
    },
  );

  it("should mark the field as invalid if the end date is before the start date", () => {
    component.range.setValue({ start: end, end: start });

    expect(component.formControl.errors?.dateRange.errorMessage).toBeTruthy();
  });

  it.each([
    ["no value", null, true],
    ["only a start date", { start }, true],
    ["only an end date", { end }, true],
    ["the end date after the start date", { start, end }, true],
    ["the same day", { start, end: start }, true],
    ["the end date before the start date", { start: end, end: start }, false],
  ])("validator: %s", (_, value, valid) => {
    expect(endNotBeforeStart(new FormControl(value)) === null).toBe(valid);
  });

  describe("period of a linked parent record", () => {
    const outside = {
      start: new Date(2026, 4, 20),
      end: new Date(2026, 5, 15),
    };
    const within = {
      start: new Date(2026, 2, 10),
      end: new Date(2026, 2, 20),
    };

    /**
     * @param parentInForm the parent link entered in the form; undefined if the form has no such field
     * @param parentOfRecord the parent link saved for the record
     */
    async function render(
      period: DateRangeValue,
      parentInForm: string | null | undefined,
      parentOfRecord?: string,
      anonymized = false,
    ) {
      const parentFixture = TestBed.createComponent(EditDateRangeComponent);
      const form = setupCustomFormControlEditComponent(
        parentFixture.componentInstance,
        "period",
        {
          withinParent: {
            parentReferenceField: "parent",
            parentValueField: "plannedPeriod",
          },
        },
        parentFixture,
      );
      if (parentInForm !== undefined) {
        form.addControl("parent", new FormControl(parentInForm));
      }
      parentFixture.componentRef.setInput(
        "entity",
        Object.assign(new EditDateRangeTestAction(), {
          parent: parentOfRecord,
          anonymized,
        }),
      );
      form.get("period").setValue(period);
      parentFixture.detectChanges();

      const warning = async () => {
        parentFixture.detectChanges();
        await parentFixture.whenStable();
        parentFixture.detectChanges();
        return parentFixture.debugElement
          .query(By.directive(MatTooltip))
          ?.injector.get(MatTooltip).message;
      };
      return { form, warning };
    }

    it.each<{
      period: DateRangeValue;
      parentInForm: string | null | undefined;
      parentOfRecord?: string;
      warns: boolean;
    }>([
      { period: outside, parentInForm: parentAction.getId(), warns: true },
      { period: within, parentInForm: parentAction.getId(), warns: false },
      {
        period: outside,
        parentInForm: null,
        parentOfRecord: parentAction.getId(),
        warns: false,
      },
      {
        period: outside,
        parentInForm: undefined,
        parentOfRecord: parentAction.getId(),
        warns: true,
      },
    ])(
      "uses the parent link of the form, or of the record if the form has no such field (in form: $parentInForm, saved: $parentOfRecord, warns: $warns)",
      async ({ period, parentInForm, parentOfRecord, warns }) => {
        const { warning } = await render(period, parentInForm, parentOfRecord);

        expect(await warning()).toBe(
          warns ? "Outside the period of Training" : undefined,
        );
      },
    );

    it("shows no warning on an anonymized record, whose dates are moved to 1 July", async () => {
      const { warning } = await render(
        { start: new Date(2026, 6, 1), end: new Date(2026, 6, 1) },
        parentAction.getId(),
        undefined,
        true,
      );

      expect(await warning()).toBeUndefined();
    });

    it("follows a parent link entered in the form", async () => {
      const { form, warning } = await render(outside, null);
      expect(await warning()).toBeUndefined();

      form.get("parent").setValue(parentAction.getId());

      expect(await warning()).toBe("Outside the period of Training");
    });

    it("follows the dates entered in the form", async () => {
      const { form, warning } = await render(within, parentAction.getId());
      expect(await warning()).toBeUndefined();

      form.get("period").setValue(outside);

      expect(await warning()).toBe("Outside the period of Training");
    });
  });
});
