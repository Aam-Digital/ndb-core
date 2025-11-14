import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminUserRolesComponent } from "./admin-user-roles.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminUserRolesComponent", () => {
  let component: AdminUserRolesComponent;
  let fixture: ComponentFixture<AdminUserRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserRolesComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
