import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditJsonComponent } from "./edit-json.component";

describe("EditJsonComponent", () => {
  let component: EditJsonComponent;
  let fixture: ComponentFixture<EditJsonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditJsonComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditJsonComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(
      component,
      "reportDefinition",
      {},
      fixture,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
