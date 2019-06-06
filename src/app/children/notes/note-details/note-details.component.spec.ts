import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteDetailsComponent } from './note-details.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {EntityModule} from '../../../entity/entity.module';
import {FormsModule} from '@angular/forms';
import {ChildSelectComponent} from '../../child-select/child-select.component';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {Note} from '../note';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {ChildrenService} from '../../children.service';
import {WarningLevel} from '../../attendance/warning-level';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';

describe('NoteDetailsComponent', () => {
  let component: NoteDetailsComponent;
  let fixture: ComponentFixture<NoteDetailsComponent>;

  let note;

  beforeEach(async(() => {
    note = new Note('');
    note.warningLevel = WarningLevel.WARNING;
    note.date = new Date();
    note.subject = 'test';
    note.author = 'tester';
    note.text = 'foo';
    note.children = ['1', '2'];

    TestBed.configureTestingModule({
      declarations: [ NoteDetailsComponent, ChildSelectComponent, ChildBlockComponent, SchoolBlockComponent ],
      imports: [MatDialogModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        FormsModule, NoopAnimationsModule, MatIconModule,
        UiHelperModule, EntityModule],
      providers: [
        {provide: Database, useClass: MockDatabase},
        {provide: MatDialogRef, useValue: {beforeClose: () => { return { subscribe: () => {}}; }}},
        {provide: MAT_DIALOG_DATA, useValue: {entity: note}},
        {provide: ChildrenService, useClass: ChildrenService},
        ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
