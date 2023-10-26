import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigEntityComponent } from './config-entity.component';

describe('ConfigEntityComponent', () => {
  let component: ConfigEntityComponent;
  let fixture: ComponentFixture<ConfigEntityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigEntityComponent]
    });
    fixture = TestBed.createComponent(ConfigEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
