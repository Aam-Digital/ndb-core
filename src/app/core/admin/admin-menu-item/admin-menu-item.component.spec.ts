import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMenuItemComponent } from './admin-menu-item.component';

describe('AdminMenuItemComponent', () => {
  let component: AdminMenuItemComponent;
  let fixture: ComponentFixture<AdminMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
