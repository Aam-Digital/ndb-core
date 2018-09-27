import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchComponent } from './search.component';
import {MatAutocompleteModule, MatFormFieldModule, MatIconModule, MatInputModule} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {Database} from '../../database/database';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {PouchDatabase} from '../../database/pouch-database';
import PouchDB from 'pouchdb';
import {ChildrenModule} from '../../children/children.module';
import {SchoolsModule} from '../../schools/schools.module';
import {AlertService} from '../../alerts/alert.service';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async(() => {
    const pouchDB = new PouchDatabase(new PouchDB('unit-test-search'), new AlertService(null, null));

    TestBed.configureTestingModule({
      imports: [MatIconModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
        CommonModule, FormsModule, NoopAnimationsModule,
        ChildrenModule, SchoolsModule,
      ],
      providers: [{ provide: Database, useValue: pouchDB }],
      declarations: [ SearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
