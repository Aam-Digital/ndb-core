import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizableTooltipComponent } from './customizable-tooltip.component';

describe('CustomizableTooltipComponent', () => {
  let component: CustomizableTooltipComponent;
  let fixture: ComponentFixture<CustomizableTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomizableTooltipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizableTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
