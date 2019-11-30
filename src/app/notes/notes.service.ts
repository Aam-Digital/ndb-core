import {Injectable} from '@angular/core';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {NoteModel} from './note.model';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  // The data source for the note-model. This is where all the notes are
  private readonly dataSource: Observable<NoteModel[]>;
  // TODO: Can the dataSource and noteUpdater be combined into one entity?
  // emits, whenever a new is getting saved
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
      if (res.rev === 'x') {
        this.noteUpdater.next([note]);
      }
    });
  }

}
