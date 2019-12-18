
import { ChildPresenceListComponent } from './child-presence-list.component';
import {NoteModel} from '../../note.model';

describe('ChildPresenceListComponent', () => {
  let component: ChildPresenceListComponent;

  beforeEach(() => {
    component = new ChildPresenceListComponent();
    component.note = new NoteModel('1');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
