import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityReferenceFieldSelectorComponent } from './entity-reference-field-selector.component';
import { MockedTestingModule } from '../utils/mocked-testing.module';

describe('EntityReferenceFieldSelectorComponent', () => {
  let component: EntityReferenceFieldSelectorComponent;
  let fixture: ComponentFixture<EntityReferenceFieldSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityReferenceFieldSelectorComponent, MockedTestingModule.withState()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityReferenceFieldSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
