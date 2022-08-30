import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AccountPageComponent } from "./account-page.component";
import { AuthService } from "../../auth.service";

describe("AccountPageComponent", () => {
  let component: AccountPageComponent;
  let fixture: ComponentFixture<AccountPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccountPageComponent],
      providers: [
        { provide: AuthService, useValue: { changePassword: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
