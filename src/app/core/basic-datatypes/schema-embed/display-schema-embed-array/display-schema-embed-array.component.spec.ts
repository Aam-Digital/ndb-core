import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DisplaySchemaEmbedArrayComponent } from "./display-schema-embed-array.component";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";

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

  it("resolves columns in order with their default view components", () => {
    fixture.componentRef.setInput("value", [
      { documentType: "Passport", issueDate: new Date("2020-01-01") },
    ]);
    fixture.detectChanges();

    expect(
      component
        .columns()
        .map((c) => ({ id: c.id, viewComponent: c.viewComponent })),
    ).toEqual([
      { id: "documentType", viewComponent: "DisplayText" },
      { id: "issueDate", viewComponent: "DisplayDate" },
    ]);
  });

  it("shows the number of entries as text", () => {
    fixture.componentRef.setInput("value", [
      { documentType: "Passport" },
      { documentType: "ID Card" },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("2 entries");
  });

  it("shows nothing when there are no entries", () => {
    fixture.componentRef.setInput("value", []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("");
    expect(fixture.debugElement.query(By.css(".entry-count"))).toBeFalsy();
  });

  it("shows nothing when the value is undefined", () => {
    fixture.detectChanges();

    expect(component.rows()).toEqual([]);
    expect(fixture.nativeElement.textContent.trim()).toBe("");
  });

  it("wires the hover tooltip with the preview table content", () => {
    fixture.componentRef.setInput("value", [{ documentType: "Passport" }]);
    fixture.detectChanges();

    const directive = fixture.debugElement
      .query(By.directive(TemplateTooltipDirective))
      .injector.get(TemplateTooltipDirective);
    expect(directive.contentTemplate()).toBeTruthy();
  });
});
