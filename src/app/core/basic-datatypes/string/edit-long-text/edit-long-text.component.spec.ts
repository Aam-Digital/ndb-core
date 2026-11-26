import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { EditLongTextComponent } from "./edit-long-text.component";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { LongTextFieldConfig } from "../display-long-text/display-long-text.component";

describe("EditLongTextComponent", () => {
  let fixture: ComponentFixture<EditLongTextComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EditLongTextComponent] });
    fixture = TestBed.createComponent(EditLongTextComponent);
  });

  function renderAutosize(additional?: LongTextFieldConfig) {
    setupCustomFormControlEditComponent(
      fixture.componentInstance,
      "description",
      { additional },
      fixture,
    );
    fixture.detectChanges();

    return fixture.debugElement
      .query(By.directive(CdkTextareaAutosize))
      .injector.get(CdkTextareaAutosize);
  }

  it.each<[string, LongTextFieldConfig | undefined, number, number]>([
    ["default", undefined, 4, 20],
    ["configured", { rows: 10, maxRows: 30 }, 10, 30],
    ["maxRows below rows", { rows: 25 }, 25, 25],
  ])(
    "should let the text box grow with its text between the min and max rows (%s)",
    (_, additional, expectedMin, expectedMax) => {
      const autosize = renderAutosize(additional);

      expect(autosize.minRows).toBe(expectedMin);
      expect(autosize.maxRows).toBe(expectedMax);
    },
  );

  it("should switch the autosize on once the field is rendered", () => {
    const autosize = renderAutosize();
    TestBed.tick();
    fixture.detectChanges();

    expect(autosize.enabled).toBe(true);
  });
});
