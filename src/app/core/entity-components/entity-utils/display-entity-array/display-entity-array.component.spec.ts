import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayEntityArrayComponent } from './display-entity-array.component';

describe('DisplayEntityArrayComponent', () => {
  let component: DisplayEntityArrayComponent;
  let fixture: ComponentFixture<DisplayEntityArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayEntityArrayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayEntityArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
