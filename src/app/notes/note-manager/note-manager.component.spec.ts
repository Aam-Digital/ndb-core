import {NoteManagerComponent} from './note-manager.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {NoteModel} from '../note.model';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NotesModule} from '../notes.module';
import {MatNativeDateModule} from '@angular/material/core';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {ChildrenService} from '../../children/children.service';
import {FormBuilder} from '@angular/forms';
import {SessionService} from '../../session/session.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';

function generateNewNoteModel() {
  return new NoteModel('1');
}

function generateUpdatedNoteModel() {
  const n1 = new NoteModel('1');
  n1._rev = 'x';
  return n1;
}

const database: Database = new MockDatabase();

describe('NoteManagerComponent', () => {

  let component: NoteManagerComponent;
  let fixture: ComponentFixture<NoteManagerComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        NotesModule,
        MatNativeDateModule],
      providers: [
        EntitySchemaService,
        EntityMapperService,
        ConfirmationDialogService,
        ChildrenService,
        FormBuilder,
        SessionService,
        {provide: Database, useValue: database}
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', function () {
    expect(component).toBeTruthy();
  });

});
