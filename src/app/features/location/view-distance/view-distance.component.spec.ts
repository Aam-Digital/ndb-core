import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDistanceComponent } from './view-distance.component';

describe('ViewDistanceComponent', () => {
  let component: ViewDistanceComponent;
  let fixture: ComponentFixture<ViewDistanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewDistanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
