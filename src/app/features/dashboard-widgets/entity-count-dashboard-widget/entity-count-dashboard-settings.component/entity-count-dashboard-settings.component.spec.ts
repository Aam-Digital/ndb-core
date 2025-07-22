import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityCountDashboardSettingsComponent } from './entity-count-dashboard-settings.component';

describe('EntityCountDashboardSettingsComponent', () => {
  let component: EntityCountDashboardSettingsComponent;
  let fixture: ComponentFixture<EntityCountDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCountDashboardSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityCountDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
