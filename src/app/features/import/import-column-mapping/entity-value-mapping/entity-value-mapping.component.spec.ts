import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityValueMappingComponent } from './entity-value-mapping.component';

describe('EntityValueMappingComponent', () => {
  let component: EntityValueMappingComponent;
  let fixture: ComponentFixture<EntityValueMappingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EntityValueMappingComponent]
    });
    fixture = TestBed.createComponent(EntityValueMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
