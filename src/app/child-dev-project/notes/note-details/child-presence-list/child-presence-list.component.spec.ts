
import { ChildPresenceListComponent } from './child-presence-list.component';
import { Note } from '../../model/note';

describe('ChildPresenceListComponent', () => {
  let component: ChildPresenceListComponent;

  beforeEach(() => {
    component = new ChildPresenceListComponent();
    component.note = new Note('1');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
