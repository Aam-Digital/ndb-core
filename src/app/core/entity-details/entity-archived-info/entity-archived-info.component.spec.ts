import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityArchivedInfoComponent } from './entity-archived-info.component';

describe('EntityArchivedInfoComponent', () => {
  let component: EntityArchivedInfoComponent;
  let fixture: ComponentFixture<EntityArchivedInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EntityArchivedInfoComponent]
    });
    fixture = TestBed.createComponent(EntityArchivedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
