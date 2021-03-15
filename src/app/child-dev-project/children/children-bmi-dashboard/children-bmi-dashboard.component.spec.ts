import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenBmiDashboardComponent } from './children-bmi-dashboard.component';

describe('ChildrenBmiDashboardComponent', () => {
  let component: ChildrenBmiDashboardComponent;
  let fixture: ComponentFixture<ChildrenBmiDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChildrenBmiDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenBmiDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
