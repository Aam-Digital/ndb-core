import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLocationComponent } from './view-location.component';

describe('ViewLocationComponent', () => {
  let component: ViewLocationComponent;
  let fixture: ComponentFixture<ViewLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewLocationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
