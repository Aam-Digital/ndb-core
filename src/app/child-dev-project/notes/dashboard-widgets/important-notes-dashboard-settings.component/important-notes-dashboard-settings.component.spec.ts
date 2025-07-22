import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportantNotesDashboardSettingsComponent } from './important-notes-dashboard-settings.component';

describe('ImportantNotesDashboardSettingsComponent', () => {
  let component: ImportantNotesDashboardSettingsComponent;
  let fixture: ComponentFixture<ImportantNotesDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportantNotesDashboardSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportantNotesDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
