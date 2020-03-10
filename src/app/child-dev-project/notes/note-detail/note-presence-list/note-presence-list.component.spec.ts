import { NotePresenceListComponent } from './note-presence-list.component';
import { Note } from '../../note';

describe('NotePresenceListComponent', () => {
  let component: NotePresenceListComponent;

  beforeEach(() => {
    component = new NotePresenceListComponent();
    component.entity = new Note('1');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
