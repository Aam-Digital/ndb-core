import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressDashboardSettingsComponent } from './progress-dashboard-settings.component';

describe('ProgressDashboardSettingsComponent', () => {
  let component: ProgressDashboardSettingsComponent;
  let fixture: ComponentFixture<ProgressDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressDashboardSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
