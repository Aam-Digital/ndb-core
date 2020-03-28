import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteDetailsComponent } from './note-details.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UiHelperModule } from '../../../core/ui-helper/ui-helper.module';
import { EntityModule } from '../../../core/entity/entity.module';
import { FormsModule } from '@angular/forms';
import { ChildSelectComponent } from '../../children/child-select/child-select.component';
import { ChildBlockComponent } from '../../children/child-block/child-block.component';
import { Note } from '../model/note';
import { Database } from '../../../core/database/database';
import { MockDatabase } from '../../../core/database/mock-database';
import { ChildrenService } from '../../children/children.service';
import { WarningLevel } from '../../warning-level';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SchoolBlockComponent } from '../../schools/school-block/school-block.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ChildPhotoService } from '../../children/child-photo-service/child-photo.service';

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
        FormsModule, NoopAnimationsModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
        UiHelperModule, EntityModule],
      providers: [
        {provide: Database, useClass: MockDatabase},
        {provide: MatDialogRef, useValue: {beforeClose: () => { return { subscribe: () => {}}; }}},
        {provide: MAT_DIALOG_DATA, useValue: {entity: note}},
        {provide: ChildrenService, useClass: ChildrenService},
        { provide: ChildPhotoService, useValue: jasmine.createSpyObj(['getImage']) },
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
