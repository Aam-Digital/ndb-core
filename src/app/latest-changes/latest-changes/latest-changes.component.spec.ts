import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestChangesComponent } from './latest-changes.component';

describe('LatestChangesComponent', () => {
  let component: LatestChangesComponent;
  let fixture: ComponentFixture<LatestChangesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LatestChangesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
