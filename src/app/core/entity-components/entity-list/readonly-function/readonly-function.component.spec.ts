import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadonlyFunctionComponent } from './readonly-function.component';

describe('ReadonlyFunctionComponent', () => {
  let component: ReadonlyFunctionComponent;
  let fixture: ComponentFixture<ReadonlyFunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReadonlyFunctionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadonlyFunctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
