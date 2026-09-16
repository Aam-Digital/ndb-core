import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DisplayTextComponent } from "#src/app/core/basic-datatypes/string/display-text/display-text.component";
import { DisplayDateComponent } from "#src/app/core/basic-datatypes/date/display-date/display-date.component";
import { SchemaEmbedArrayTableComponent } from "./schema-embed-array-table.component";

describe("SchemaEmbedArrayTableComponent", () => {
  let fixture: ComponentFixture<SchemaEmbedArrayTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SchemaEmbedArrayTableComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaEmbedArrayTableComponent);
    fixture.componentRef.setInput("columns", [
      {
        id: "documentType",
        label: "Document Type",
        viewComponent: "DisplayText",
      },
      { id: "issueDate", label: "Issue Date", viewComponent: "DisplayDate" },
    ]);
  });

  it("renders one column header per configured column, in order", () => {
    fixture.componentRef.setInput("rows", []);
    fixture.detectChanges();

    const headers = fixture.debugElement
      .queryAll(By.css("th"))
      .map((h) => h.nativeElement.textContent.trim());
    expect(headers).toEqual(["Document Type", "Issue Date"]);
  });

  it("renders one row per entry through each column's resolved view component", async () => {
    fixture.componentRef.setInput("rows", [
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
});
