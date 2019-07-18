import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolsListComponent } from './schools-list.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {SchoolsService} from '../schools.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Router} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';

describe('SchoolsListComponent', () => {
  let component: SchoolsListComponent;
  let fixture: ComponentFixture<SchoolsListComponent>;
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
        MatSelectModule,
      ],
      providers: [
        SchoolsService,
        {provide: Database, useClass: MockDatabase},
        EntityMapperService,
        EntitySchemaService,
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
