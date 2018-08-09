import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesManagerComponent } from './notes-manager.component';
import {
  MatButtonToggleModule, MatDialogModule, MatExpansionModule,
  MatFormFieldModule,
  MatIconModule, MatInputModule,
  MatSelectModule,
  MatTableModule
} from '@angular/material';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';
import {Database} from '../../../database/database';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {SessionService} from '../../../session/session.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

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
