import {EventEmitter, Injectable} from '@angular/core';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {NoteModel} from './note.model';
import {from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  // The data source for the note-model.
  private readonly dataSource: Observable<NoteModel[]>;
  public noteUpdate = new EventEmitter<NoteModel>();

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
    this.entityMapper.save(note);
    this.noteUpdate.emit(note);
  }

}
