import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColoredReadonlyFunctionComponent } from './colored-readonly-function.component';

describe('ColoredReadonlyFunctionComponent', () => {
  let component: ColoredReadonlyFunctionComponent;
  let fixture: ComponentFixture<ColoredReadonlyFunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ColoredReadonlyFunctionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColoredReadonlyFunctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
