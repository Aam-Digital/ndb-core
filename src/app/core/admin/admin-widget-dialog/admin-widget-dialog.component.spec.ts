import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWidgetDialogComponent } from './admin-widget-dialog.component';

describe('AdminWidgetDialogComponent', () => {
  let component: AdminWidgetDialogComponent;
  let fixture: ComponentFixture<AdminWidgetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWidgetDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWidgetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
