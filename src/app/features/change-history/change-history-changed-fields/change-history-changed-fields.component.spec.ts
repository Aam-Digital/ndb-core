import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChangeHistoryChangedFieldsComponent } from "./change-history-changed-fields.component";
import { AuditRecord } from "../model/audit-record";

describe("ChangeHistoryChangedFieldsComponent", () => {
  let component: ChangeHistoryChangedFieldsComponent;
  let fixture: ComponentFixture<ChangeHistoryChangedFieldsComponent>;

  function auditRecord(operation: string): AuditRecord {
    const record = new AuditRecord("Child:123:2026-08-01T10:00:00.000Z:2-abc");
    record.operation = operation as AuditRecord["operation"];
    return record;
  }

  /**
   * Renders with no changed fields, which is what every empty-state test wants
   * and what keeps the chips - and EntityFieldLabelComponent behind them - out
   * of this component's tests.
   */
  async function setup(operation: string) {
    await TestBed.configureTestingModule({
      imports: [ChangeHistoryChangedFieldsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeHistoryChangedFieldsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entity", auditRecord(operation));
    fixture.componentRef.setInput("value", []);
    fixture.detectChanges();
  }

  it("should name the type the field labels are resolved against", async () => {
    await setup("update");
    fixture.componentRef.setInput("value", ["phone"]);

    expect(component.recordType()).toBe("Child");
    expect(component.fields()).toEqual(["phone"]);
  });

  it("should explain a creation, which has no prior state to differ from", async () => {
    await setup("create");

    expect(fixture.nativeElement.textContent).toContain("new record");
  });

  it("should explain a deletion, which replicates as a stripped tombstone", async () => {
    await setup("delete");

    expect(fixture.nativeElement.textContent).toContain("record removed");
  });

  it("should explain an update that touched nothing visible", async () => {
    await setup("update");

    expect(fixture.nativeElement.textContent).toContain(
      "no visible field changes",
    );
  });
});
