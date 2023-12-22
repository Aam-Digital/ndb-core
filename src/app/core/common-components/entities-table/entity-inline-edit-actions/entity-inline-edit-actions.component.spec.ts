import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityInlineEditActionsComponent } from './entity-inline-edit-actions.component';

describe('EntityInlineEditActionsComponent', () => {
  let component: EntityInlineEditActionsComponent;
  let fixture: ComponentFixture<EntityInlineEditActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityInlineEditActionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntityInlineEditActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
