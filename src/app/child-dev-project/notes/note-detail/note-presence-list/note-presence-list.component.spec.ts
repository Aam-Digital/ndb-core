import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotePresenceListComponent } from './note-presence-list.component';
import { NotesModule } from '../../notes.module';

describe('NotePresenceListComponent', () => {
  let component: NotePresenceListComponent;
  let fixture: ComponentFixture<NotePresenceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotePresenceListComponent ],
      imports: [NotesModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotePresenceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
