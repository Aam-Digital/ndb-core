import {Injectable} from '@angular/core';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {NoteModel} from './note.model';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  // The data source for the note-model. This is where all the notes can be retrieved off
  private readonly dataSource: Observable<NoteModel[]>;

  // emits, whenever a new Note is being saved
  private noteUpdater = new BehaviorSubject<NoteModel[]>([]);

  constructor(private entityMapper: EntityMapperService) {
    this.dataSource = from(entityMapper.loadType<NoteModel>(NoteModel));
  }


  /**
   * returns all notes that can be accessed
   */

  getNotes(): Observable<NoteModel[]> {
    return this.dataSource;
  }

  /**
   * returns an observable that emits whenever a note-update happens
   * This returns an observable in contrast to a <code>Subject</code> since
   * returning a Subject is considered bad practice
   */

  getUpdater(): Observable<NoteModel[]> {
    return this.noteUpdater.asObservable();
  }

  /**
   * returns all the notes that are related to a specific child, identified by it's ID
   * @param childID The id of the child
   */

  getNotesForChild(childID: string) {
    return this.dataSource.pipe(map(notes => {
      return notes.filter(note => note.isLinkedWithChild(childID));
    }));
  }

  /**
   * saves a new note, pushing it to the data-base as well as publishing it to the subscribers
   * This will emit the note to all subscribers so they can update their view according to the added note
   * @param note The note to save
   */

  saveNewNote(note: NoteModel) {
    // save the new note to the database...
    const result = this.entityMapper.save(note);
    // ... and immediately inform any subscribers that a new note has been saved,
    // if this note is not old (the update will be done automatically by the individual components)
    result.then(res => {
      // if the revision is the first, emit the new note
      // What the revision is is dependant from the used database.
      // In case of a temporary db, the first revision is denoted as 'x', the second as 'xx' and so on
      // In the case of the pouch db, the first revision string starts with a '1', the second with a '2' and so on
      if (res.rev === 'x') {
        this.noteUpdater.next([note]);
      } else if (res.rev.startsWith('1')) {
        this.noteUpdater.next([note]);
      }

    }).catch(reason => {
      // should never trigger since errors should be handled directly by the database/entityMapper
      console.log('A new note could not be saved: ', reason);
    });
  }

}
