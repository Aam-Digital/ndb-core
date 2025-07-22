import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesDashboardSettingsComponent } from './notes-dashboard-settings.component';

describe('NotesDashboardSettingsComponent', () => {
  let component: NotesDashboardSettingsComponent;
  let fixture: ComponentFixture<NotesDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesDashboardSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
