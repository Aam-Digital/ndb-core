import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DisplayConfigurableEnumComponent } from "./display-configurable-enum.component";
import { Note } from "../../../child-dev-project/notes/model/note";

describe("DisplayConfigurableEnumComponent", () => {
  let component: DisplayConfigurableEnumComponent;
  let fixture: ComponentFixture<DisplayConfigurableEnumComponent>;
  const note = new Note();
  note.category = { id: "testCategory", label: "Test Category" };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisplayConfigurableEnumComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayConfigurableEnumComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({ entity: note, id: "category" });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("displays value's label", () => {
    expect(fixture.debugElement.nativeElement.innerHTML).toBe(
      note.category.label
    );
  });
});
