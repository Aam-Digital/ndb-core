import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaterangePanelComponent } from './daterange-panel.component';

describe('DaterangePanelComponent', () => {
  let component: DaterangePanelComponent;
  let fixture: ComponentFixture<DaterangePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DaterangePanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaterangePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
