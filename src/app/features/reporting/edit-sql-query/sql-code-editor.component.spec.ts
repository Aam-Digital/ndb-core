import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { SqlCodeEditorComponent } from "./sql-code-editor.component";

describe("SqlCodeEditorComponent", () => {
  let component: SqlCodeEditorComponent;
  let fixture: ComponentFixture<SqlCodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SqlCodeEditorComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlCodeEditorComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component, "query", {}, fixture);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("exposes the current value via the value signal", () => {
    component.value = "SELECT name FROM children";
    expect(component.valueSignal()).toBe("SELECT name FROM children");
  });
});
