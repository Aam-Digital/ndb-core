import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PasswordButtonComponent } from "./password-button.component";
import { AuthService } from "../../auth.service";

describe("PasswordButtonComponent", () => {
  let component: PasswordButtonComponent;
  let fixture: ComponentFixture<PasswordButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PasswordButtonComponent],
      providers: [
        { provide: AuthService, useValue: { changePassword: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
