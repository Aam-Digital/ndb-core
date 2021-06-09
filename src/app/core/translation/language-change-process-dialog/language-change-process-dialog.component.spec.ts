import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageChangeProcessDialogComponent } from './language-change-process-dialog.component';

describe('LanguageChangeProcessDialogComponent', () => {
  let component: LanguageChangeProcessDialogComponent;
  let fixture: ComponentFixture<LanguageChangeProcessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LanguageChangeProcessDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageChangeProcessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
