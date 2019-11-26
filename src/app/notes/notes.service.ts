import {Injectable} from '@angular/core';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {NoteModel} from './note.model';
import {from, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  allNotes: Observable<NoteModel[]>;

  constructor(private entityMapper: EntityMapperService) {
    this.allNotes = from(this.entityMapper.loadType<NoteModel>(NoteModel));
  }

  getNotes(): Observable<NoteModel[]> {
    return this.allNotes;
  }

  getNotesForChild(childID: string) {
    return this.allNotes.pipe(map(notes => notes.filter(note => {
          return note.isLinkedWithChild(childID);
        })
    ));
  }

}
