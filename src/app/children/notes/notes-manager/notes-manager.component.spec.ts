import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesManagerComponent } from './notes-manager.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';
import {Database} from '../../../database/database';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {SessionService} from '../../../session/session.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {EntitySchemaService} from '../../../entity/schema/entity-schema.service';

describe('NotesManagerComponent', () => {
  let component: NotesManagerComponent;
  let fixture: ComponentFixture<NotesManagerComponent>;

  const mockSessionService = { getCurrentUser: () => { return { name: 'tester' }; }};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotesManagerComponent, ChildBlockComponent, SchoolBlockComponent ],
      imports: [
        MatIconModule,
        MatTableModule,
        MatSelectModule,
        MatButtonToggleModule,
        FormsModule,
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatExpansionModule,
        MatDialogModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: Database, useClass: MockDatabase },
        EntityMapperService,
        EntitySchemaService,
        { provide: SessionService, useValue: mockSessionService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
