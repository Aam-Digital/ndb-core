import { ComponentFixture, TestBed } from "@angular/core/testing";
import { IconComponent } from "./icon-input.component";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { faUser, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

describe("IconInputComponent", () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;
  let iconLibrary: FaIconLibrary;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent, FontAwesomeModule],
    }).compileComponents();

    iconLibrary = TestBed.inject(FaIconLibrary);
    iconLibrary.addIcons(faUser, faQuestionCircle);

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("marks unknown icons as invalid", () => {
    component.iconControl.setValue("not-a-real-icon");
    component.iconControl.updateValueAndValidity();

    expect(component.iconControl.hasError("invalidIcon")).toBeTrue();
  });

  it("accepts known icons from the library", () => {
    component.iconControl.setValue("user");
    component.iconControl.updateValueAndValidity();

    expect(component.iconControl.valid).toBeTrue();
  });
});
