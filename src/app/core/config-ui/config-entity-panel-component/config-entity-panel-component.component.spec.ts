import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigEntityPanelComponentComponent } from './config-entity-panel-component.component';

describe('ConfigEntityPanelComponentComponent', () => {
  let component: ConfigEntityPanelComponentComponent;
  let fixture: ComponentFixture<ConfigEntityPanelComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigEntityPanelComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigEntityPanelComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
