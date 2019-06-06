import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildBlockComponent } from './child-block.component';
import {RouterTestingModule} from '@angular/router/testing';
import {Child} from '../child';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import { MatIconModule } from '@angular/material/icon';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {ChildrenService} from '../children.service';
import {Database} from '../../database/database';
import {ChildWithRelation} from '../childWithRelation';

describe('ChildBlockComponent', () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;


  beforeEach(async(() => {
    const entityMapper = new EntityMapperService(new MockDatabase());

    TestBed.configureTestingModule({
      declarations: [ SchoolBlockComponent, ChildBlockComponent ],
      imports: [RouterTestingModule, MatIconModule],
      providers: [
        {provide: EntityMapperService, useValue: entityMapper},
        ChildrenService,
        {provide: Database, useClass: MockDatabase},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockComponent);
    component = fixture.componentInstance;
    component.entity = new ChildWithRelation(new Child(''));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
