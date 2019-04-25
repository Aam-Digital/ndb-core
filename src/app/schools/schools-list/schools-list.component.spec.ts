import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolsListComponent } from './schools-list.component';
import {
  MatButtonToggleModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSortModule,
  MatTableModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {SchoolsService} from '../schools.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Router} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('SchoolsListComponent', () => {
  let component: SchoolsListComponent;
  let fixture: ComponentFixture<SchoolsListComponent>;
  const mockedEntityMapper = new EntityMapperService(new MockDatabase());
  const mockedRouter = {navigate: () => null};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchoolsListComponent ],
      imports: [
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSortModule,
        MatIconModule,
        MatButtonToggleModule,
        MatExpansionModule,
        FormsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        SchoolsService,
        {provide: Database, useClass: MockDatabase},
        {provide: EntityMapperService, useValue: mockedEntityMapper},
        {provide: Router, useValue: mockedRouter},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // TODO: reactivate component test
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
