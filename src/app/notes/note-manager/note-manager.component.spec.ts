import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteManagerComponent } from './note-manager.component';

describe('NoteManagerComponent', () => {
  let component: NoteManagerComponent;
  let fixture: ComponentFixture<NoteManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoteManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
