import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemplateSelectionDialogComponent } from './email-template-selection-dialog.component';

describe('EmailTemplateSelectionDialogComponent', () => {
  let component: EmailTemplateSelectionDialogComponent;
  let fixture: ComponentFixture<EmailTemplateSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplateSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailTemplateSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
