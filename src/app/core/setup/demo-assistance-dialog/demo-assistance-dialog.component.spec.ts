import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoAssistanceDialogComponent } from './demo-assistance-dialog.component';

describe('DemoAssistanceDialogComponent', () => {
  let component: DemoAssistanceDialogComponent;
  let fixture: ComponentFixture<DemoAssistanceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoAssistanceDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoAssistanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
