import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigFieldComponent } from './config-field.component';

describe('ConfigFieldComponent', () => {
  let component: ConfigFieldComponent;
  let fixture: ComponentFixture<ConfigFieldComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigFieldComponent]
    });
    fixture = TestBed.createComponent(ConfigFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
