import {NoteDetailComponent} from './note-detail.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {NoteModel} from '../note.model';
import {AttendanceModel} from '../attendance.model';
import {InteractionTypes} from '../interaction-types.enum';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {FormBuilder} from '@angular/forms';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {of} from 'rxjs';
import {MatNativeDateModule} from '@angular/material/core';
import {ChildrenService} from '../../children/children.service';
import {NavigationExtras, Router} from '@angular/router';
import {NotesModule} from '../notes.module';
import {Child} from '../../children/child';

function generateChildAttendanceModels() {
  const attendances = [];
  let i;
  for (i = 1; i < 4; i++) {
    const am = new AttendanceModel('' + i);
    if (i % 2 === 0) {
      am.present = false;
      am.remarks = 'not empty';
    }
    attendances.push(am);
  }
  return attendances;
}

function generateTestingData() {
  const n1 = new NoteModel('1');
  n1.children = generateChildAttendanceModels();
  n1.category = InteractionTypes.CHILDREN_MEETING;
  n1.date = new Date(Date.now());
  // mock an already existing note
  n1._rev = 'x';
  return {entity: n1};
}

const children = [new Child('1'), new Child('2'), new Child('3')];
const testData = generateTestingData();
const mockDialogRef = {beforeClosed() {return of(new NoteModel('1')); },
                      close(r: any) {}};
const mockedDatabase = new MockDatabase();
const mockedRouter = {navigate(commands: any[], extras?: NavigationExtras) {return Promise.resolve(); }};

describe('NoteDetailComponent', () => {

  let component: NoteDetailComponent;
  let fixture: ComponentFixture<NoteDetailComponent>;

  beforeEach( () => {
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
        {provide: Router, useValue: mockedRouter},
        {provide: MatDialogRef, useValue: mockDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: testData},
        {provide: Database, useValue: mockedDatabase},
        FormBuilder
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(NoteDetailComponent);
    component = fixture.componentInstance;
    const entityMapperService = fixture.debugElement.injector.get(EntityMapperService);
    entityMapperService.save<NoteModel>(testData.entity);
    children.forEach(child => entityMapperService.save<Child>(child));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data', () => {
    expect(component.entity).toBe(testData.entity);
  });

  it('should save data', async function () {
    component.entity.addChildren('5', '7');
    await component.save();
    const newNote: NoteModel = await mockedDatabase.get('Note:1');
    expect(newNote.children.length).toBe(5);
  });

});
