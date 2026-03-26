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
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be invalid when link ID contains special URL characters like /", () => {
    const formControl = component.formControl;

    formControl.setValue("valid-id");
    expect(formControl.valid).toBe(true);

    for (const char of ["/", "?", "#", "%", "&", "+", "\\"]) {
      formControl.setValue("id" + char + "test");
      expect(formControl.valid).toBe(false);
      expect(formControl.errors?.["pattern"]).toBeTruthy();
    }
  });
});
