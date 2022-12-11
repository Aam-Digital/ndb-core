import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksRelatedToEntityComponent } from './tasks-related-to-entity.component';

describe('TasksRelatedToEntityComponent', () => {
  let component: TasksRelatedToEntityComponent;
  let fixture: ComponentFixture<TasksRelatedToEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TasksRelatedToEntityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TasksRelatedToEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
