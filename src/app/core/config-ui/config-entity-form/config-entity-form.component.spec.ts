import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigEntityFormComponent } from './config-entity-form.component';

describe('ConfigEntityFormComponent', () => {
  let component: ConfigEntityFormComponent;
  let fixture: ComponentFixture<ConfigEntityFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigEntityFormComponent]
    });
    fixture = TestBed.createComponent(ConfigEntityFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
