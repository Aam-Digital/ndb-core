import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSchoolsComponentComponent } from './view-schools-component.component';

describe('ViewSchoolsComponentComponent', () => {
  let component: ViewSchoolsComponentComponent;
  let fixture: ComponentFixture<ViewSchoolsComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSchoolsComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSchoolsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
