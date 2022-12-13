import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTaskCompletionComponent } from './edit-task-completion.component';

describe('EditTaskCompletionComponent', () => {
  let component: EditTaskCompletionComponent;
  let fixture: ComponentFixture<EditTaskCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTaskCompletionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTaskCompletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
