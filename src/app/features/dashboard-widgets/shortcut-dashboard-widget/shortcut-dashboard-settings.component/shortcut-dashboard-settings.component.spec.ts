import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortcutDashboardSettingsComponent } from './shortcut-dashboard-settings.component';

describe('ShortcutDashboardSettingsComponent', () => {
  let component: ShortcutDashboardSettingsComponent;
  let fixture: ComponentFixture<ShortcutDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShortcutDashboardSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShortcutDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
