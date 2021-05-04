import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurableEntitySelectComponent } from './configurable-entity-select.component';

describe('ConfigurableEntitySelectComponent', () => {
  let component: ConfigurableEntitySelectComponent;
  let fixture: ComponentFixture<ConfigurableEntitySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigurableEntitySelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurableEntitySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
