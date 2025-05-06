import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDefaultValueStaticComponent } from './admin-default-value-static.component';

describe('AdminDefaultValueStaticComponent', () => {
  let component: AdminDefaultValueStaticComponent;
  let fixture: ComponentFixture<AdminDefaultValueStaticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueStaticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
