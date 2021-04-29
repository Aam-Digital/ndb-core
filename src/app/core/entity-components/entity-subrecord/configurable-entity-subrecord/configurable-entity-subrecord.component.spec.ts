import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurableEntitySubrecordComponent } from './configurable-entity-subrecord.component';

describe('ConfigurableEntitySubrecordComponent', () => {
  let component: ConfigurableEntitySubrecordComponent;
  let fixture: ComponentFixture<ConfigurableEntitySubrecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigurableEntitySubrecordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurableEntitySubrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
