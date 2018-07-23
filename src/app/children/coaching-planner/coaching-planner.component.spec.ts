import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachingPlannerComponent } from './coaching-planner.component';
import {FilterPipeModule} from 'ngx-filter-pipe';
import {MatCardModule, MatIconModule} from '@angular/material';
import {NgDragDropModule} from 'ng-drag-drop';
import {ChildBlockComponent} from '../child-block/child-block.component';
import {AserBlockComponent} from '../aser/aser-block/aser-block.component';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';

describe('CoachingPlannerComponent', () => {
  let component: CoachingPlannerComponent;
  let fixture: ComponentFixture<CoachingPlannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoachingPlannerComponent, ChildBlockComponent, AserBlockComponent, SchoolBlockComponent ],
      imports: [ FilterPipeModule, MatCardModule, NgDragDropModule.forRoot(), MatIconModule ],
      providers: [ChildrenService, EntityMapperService, { provide: Database, useClass: MockDatabase }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoachingPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
