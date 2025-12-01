import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminUserRolesComponent } from "./admin-user-roles.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("AdminUserRolesComponent", () => {
  let component: AdminUserRolesComponent;
  let fixture: ComponentFixture<AdminUserRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserRolesComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
