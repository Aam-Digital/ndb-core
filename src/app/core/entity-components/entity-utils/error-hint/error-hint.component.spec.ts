import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ErrorHintComponent } from "./error-hint.component";
import { UntypedFormControl, Validators } from "@angular/forms";
import { By } from "@angular/platform-browser";

describe("ErrorHintComponent", () => {
  let component: ErrorHintComponent;
  let fixture: ComponentFixture<ErrorHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorHintComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorHintComponent);
    component = fixture.componentInstance;
    component.form = new UntypedFormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be empty when there are no errors", () => {
    const ellElements = fixture.debugElement.queryAll(By.css("div"));
    expect(ellElements).toHaveSize(0);
  });

  it("should contain an entry when there is one error", async () => {
    component.form = new UntypedFormControl("", Validators.required);
    fixture.detectChanges();
    await fixture.whenStable();
    const ellElements = fixture.debugElement.queryAll(By.css("div"));
    expect(ellElements).toHaveSize(1);
  });
});
