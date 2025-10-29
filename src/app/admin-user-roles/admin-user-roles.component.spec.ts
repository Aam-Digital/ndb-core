import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserRolesComponent } from './admin-user-roles.component';

describe('AdminUserRolesComponent', () => {
  let component: AdminUserRolesComponent;
  let fixture: ComponentFixture<AdminUserRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserRolesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUserRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
