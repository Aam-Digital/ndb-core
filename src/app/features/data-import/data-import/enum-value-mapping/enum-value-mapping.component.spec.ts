import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnumValueMappingComponent } from './enum-value-mapping.component';

describe('EnumValueMappingComponent', () => {
  let component: EnumValueMappingComponent;
  let fixture: ComponentFixture<EnumValueMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ EnumValueMappingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnumValueMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
