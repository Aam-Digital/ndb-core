import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMenuListComponent } from './admin-menu-list.component';

describe('AdminComponent', () => {
  let component: AdminMenuListComponent;
  let fixture: ComponentFixture<AdminMenuListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMenuListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
