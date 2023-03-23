import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogButtonsComponent } from './dialog-buttons.component';

describe('DialogButtonsComponent', () => {
  let component: DialogButtonsComponent;
  let fixture: ComponentFixture<DialogButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DialogButtonsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
