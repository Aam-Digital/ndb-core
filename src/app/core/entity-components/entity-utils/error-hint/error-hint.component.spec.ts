import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ErrorHintComponent } from "./error-hint.component";
import { KeysPipeModule } from "../../../keys-pipe/keys-pipe.module";
import { FormControl } from "@angular/forms";

describe("ErrorHintComponent", () => {
  let component: ErrorHintComponent;
  let fixture: ComponentFixture<ErrorHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorHintComponent],
      imports: [KeysPipeModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorHintComponent);
    component = fixture.componentInstance;
    component.form = new FormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
