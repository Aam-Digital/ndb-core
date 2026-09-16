import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DisplaySchemaEmbedArrayComponent } from "./display-schema-embed-array.component";
import { DisplayTextComponent } from "#src/app/core/basic-datatypes/string/display-text/display-text.component";
import { DisplayDateComponent } from "#src/app/core/basic-datatypes/date/display-date/display-date.component";

describe("DisplaySchemaEmbedArrayComponent", () => {
  let component: DisplaySchemaEmbedArrayComponent;
  let fixture: ComponentFixture<DisplaySchemaEmbedArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DisplaySchemaEmbedArrayComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplaySchemaEmbedArrayComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("formFieldConfig", {
      id: "documents",
      dataType: "schema-embed-array",
      additional: {
        documentType: { dataType: "string", label: "Document Type" },
        issueDate: { dataType: "date", label: "Issue Date" },
      },
    });
  });

  it("renders one column header per configured field, in order", () => {
    fixture.componentRef.setInput("value", [
      { documentType: "Passport", issueDate: new Date("2020-01-01") },
    ]);
    fixture.detectChanges();

    const headers = fixture.debugElement
      .queryAll(By.css("th"))
      .map((h) => h.nativeElement.textContent.trim());
    expect(headers).toEqual(["Document Type", "Issue Date"]);
  });

  it("resolves each column's default view component from its dataType", () => {
    fixture.componentRef.setInput("value", [
      { documentType: "Passport", issueDate: new Date("2020-01-01") },
    ]);
    fixture.detectChanges();

    expect(component.columns().map((c) => c.viewComponent)).toEqual([
      "DisplayText",
      "DisplayDate",
    ]);
  });

  it("renders one row per array entry through the resolved view components", async () => {
    fixture.componentRef.setInput("value", [
      { documentType: "Passport", issueDate: new Date("2020-01-01") },
      { documentType: "ID Card", issueDate: new Date("2021-06-15") },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.debugElement.queryAll(By.css("tbody tr"))).toHaveLength(2);
    expect(
      fixture.debugElement.queryAll(By.directive(DisplayTextComponent)),
    ).toHaveLength(2);
    expect(
      fixture.debugElement.queryAll(By.directive(DisplayDateComponent)),
    ).toHaveLength(2);
  });

  it("shows a placeholder when there are no entries", () => {
    fixture.componentRef.setInput("value", []);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css("table"))).toBeFalsy();
    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("shows a placeholder when the value is undefined", () => {
    fixture.detectChanges();

    expect(component.rows()).toEqual([]);
    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });
});
