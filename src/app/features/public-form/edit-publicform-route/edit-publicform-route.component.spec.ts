import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { setupCustomFormControlEditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditPublicformRouteComponent } from "./edit-publicform-route.component";

describe("EditPublicformRouteComponent", () => {
  let component: EditPublicformRouteComponent;
  let fixture: ComponentFixture<EditPublicformRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditPublicformRouteComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPublicformRouteComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component, "testProperty", {}, fixture);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be valid for lowercase letters, digits, hyphens and underscores", () => {
    const formControl = component.formControl;

    for (const id of ["valid-id", "form_1", "abc123", "my-form_v2"]) {
      formControl.setValue(id);
      expect(formControl.valid).toBe(true);
    }
  });

  it("should be invalid for any character outside the allow-list", () => {
    const formControl = component.formControl;

    for (const id of [
      "id/test",
      "id?test",
      "id#test",
      "id test",
      "id@test",
      "id!test",
      "id.test",
    ]) {
      formControl.setValue(id);
      expect(formControl.valid).toBe(false);
      expect(formControl.errors?.["pattern"]).toBeTruthy();
    }
  });
});
