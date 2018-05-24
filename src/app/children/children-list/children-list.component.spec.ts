import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenListComponent } from './children-list.component';
import {
  MatButtonModule, MatButtonToggleModule,
  MatExpansionModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSidenavModule, MatSortModule,
  MatTableModule
} from '@angular/material';
import {CommonModule} from '@angular/common';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {Database} from '../../database/database';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('ChildrenListComponent', () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildrenListComponent ],
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]),
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatExpansionModule,
        MatTableModule,
        MatSortModule,
        MatSidenavModule,
        MatButtonModule,
        MatButtonToggleModule,
        NoopAnimationsModule,
      ],
      providers: [ChildrenService, EntityMapperService, { provide: Database, useClass: MockDatabase }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
