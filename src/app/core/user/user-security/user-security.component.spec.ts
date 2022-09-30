import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserSecurityComponent } from "./user-security.component";
import { UserModule } from "../user.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("UserSecurityComponent", () => {
  let component: UserSecurityComponent;
  let fixture: ComponentFixture<UserSecurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModule, MockedTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
