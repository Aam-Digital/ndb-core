import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDefaultValueUpdatedComponent } from './admin-default-value-updated.component';

describe('AdminDefaultValueUpdatedComponent', () => {
  let component: AdminDefaultValueUpdatedComponent;
  let fixture: ComponentFixture<AdminDefaultValueUpdatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueUpdatedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueUpdatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
