import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { SchemaEmbedArraySummaryComponent } from "./schema-embed-array-summary.component";

describe("SchemaEmbedArraySummaryComponent", () => {
  let fixture: ComponentFixture<SchemaEmbedArraySummaryComponent>;

  const columns: FormFieldConfig[] = [
    { id: "documentType", label: "Type", viewComponent: "DisplayText" },
    { id: "documentNumber", label: "Number", viewComponent: "DisplayText" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaEmbedArraySummaryComponent, MockedTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaEmbedArraySummaryComponent);
    fixture.componentRef.setInput("columns", columns);
  });

  const text = (): string =>
    fixture.nativeElement.textContent.replace(/\s+/g, " ").trim();

  /** Renders the rows and waits for the (lazy-loaded) view components to match `expected`. */
  async function expectRendered(rows: Record<string, any>[], expected: string) {
    fixture.componentRef.setInput("rows", rows);
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
      [{ documentNumber: "A1" }, { documentType: "ID Card" }],
      "ID Card +1 more",
    );
  });

  it("falls back to the number of entries if no entry has a first column value", async () => {
    await expectRendered([{ documentNumber: "A1" }, {}], "2 entries");
    await expectRendered([{}], "1 entry");
    await expectRendered([], "no entries");
  });

  it("falls back to the number of entries if there are no columns", async () => {
    fixture.componentRef.setInput("columns", []);

    await expectRendered([{ documentType: "Passport" }], "1 entry");
  });
});
