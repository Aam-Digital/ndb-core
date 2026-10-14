import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TemplateTooltipDirective } from "#src/app/core/common-components/template-tooltip/template-tooltip.directive";
import { DisplaySchemaEmbedArrayComponent } from "./display-schema-embed-array.component";

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

  const text = (): string =>
    fixture.nativeElement.textContent.replace(/\s+/g, " ").trim();

  /** Renders the value and waits for the (lazy-loaded) view components to match `expected`. */
  async function expectRendered(
    value: Record<string, any>[],
    expected: string,
  ) {
    fixture.componentRef.setInput("value", value);
    fixture.detectChanges();
    await vi.waitFor(() => expect(text()).toBe(expected));
  }

  it("shows the first column's values of the first entries", async () => {
    await expectRendered(
      [{ documentType: "Passport" }, { documentType: "ID Card" }],
      "Passport, ID Card",
    );
  });

  it("indicates the number of further entries", async () => {
    await expectRendered(
      [
        { documentType: "Passport" },
        { documentType: "ID Card" },
        { documentType: "Voter ID" },
      ],
      "Passport, ID Card +1 more",
    );
  });

  it("skips entries with an empty first column value", async () => {
    await expectRendered(
      [{ issueDate: new Date("2020-01-01") }, { documentType: "ID Card" }],
      "ID Card +1 more",
    );
  });

  it("falls back to the number of entries if no entry has a first column value", async () => {
    await expectRendered(
      [{ issueDate: new Date("2020-01-01") }, {}],
      "2 entries",
    );
    await expectRendered([{}], "1 entry");
  });

  it("falls back to the number of entries if there are no columns", async () => {
    fixture.componentRef.setInput("formFieldConfig", {
      id: "documents",
      dataType: "schema-embed-array",
    });

    await expectRendered([{ documentType: "Passport" }], "1 entry");
  });

  it("shows a preview table of all entries on hover", () => {
    fixture.componentRef.setInput("value", [{ documentType: "Passport" }]);
    fixture.detectChanges();

    const tooltip = fixture.debugElement
      .query(By.directive(TemplateTooltipDirective))
      .injector.get(TemplateTooltipDirective);
    expect(tooltip.contentTemplate()).toBeTruthy();
  });

  it("shows nothing when there are no entries", () => {
    fixture.componentRef.setInput("value", []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("");
    expect(fixture.debugElement.query(By.css(".summary"))).toBeFalsy();
  });

  it("shows nothing when the value is undefined", () => {
    fixture.detectChanges();

    expect(component.rows()).toEqual([]);
    expect(fixture.nativeElement.textContent.trim()).toBe("");
  });
});
