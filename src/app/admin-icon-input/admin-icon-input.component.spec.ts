import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminIconComponent } from './admin-icon-input.component';

describe('AdminIconInputComponent', () => {
  let component: AdminIconComponent;
  let fixture: ComponentFixture<AdminIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminIconComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
