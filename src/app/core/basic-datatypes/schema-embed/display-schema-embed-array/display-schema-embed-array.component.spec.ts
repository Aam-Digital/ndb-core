import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
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

  it.each<[string, Record<string, any>[], string]>([
    [
      "the first column's values of the first entries",
      [{ documentType: "Passport" }, { documentType: "ID Card" }],
      "Passport, ID Card",
    ],
    [
      "the number of further entries",
      [
        { documentType: "Passport" },
        { documentType: "ID Card" },
        { documentType: "Voter ID" },
      ],
      "Passport, ID Card +1 more",
    ],
    [
      "no empty first column values",
      [{ issueDate: new Date("2020-01-01") }, { documentType: "ID Card" }],
      "ID Card +1 more",
    ],
    [
      "the number of entries if no entry has a first column value",
      [{ issueDate: new Date("2020-01-01") }, {}],
      "2 entries",
    ],
    ["the number of entries for a single entry", [{}], "1 entry"],
  ])("shows %s", async (_, value, expected) => {
    await expectRendered(value, expected);
  });

  it("falls back to the number of entries if there are no columns", async () => {
    fixture.componentRef.setInput("formFieldConfig", {
      id: "documents",
      dataType: "schema-embed-array",
    });

    await expectRendered([{ documentType: "Passport" }], "1 entry");
  });

  it("shows a preview table of all entries on hover", async () => {
    fixture.componentRef.setInput("value", [
      { documentType: "Passport" },
      { documentType: "ID Card" },
    ]);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector(".summary")
      .dispatchEvent(new MouseEvent("mouseenter"));

    const preview = () =>
      document.querySelector(".cdk-overlay-container")?.textContent ?? "";
    await vi.waitFor(() => {
      expect(preview()).toContain("Document Type");
      expect(preview()).toContain("Passport");
      expect(preview()).toContain("ID Card");
    });
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
