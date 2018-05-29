import { TestBed, inject } from '@angular/core/testing';

import { ChildrenService } from './children.service';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {MockDatabase} from '../database/mock-database';
import {Database} from '../database/database';

describe('ChildrenService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChildrenService, EntityMapperService, { provide: Database, useClass: MockDatabase }]
    });
  });

  it('should be created', inject([ChildrenService], (service: ChildrenService) => {
    expect(service).toBeTruthy();
  }));

  // TODO: test getChildren

  // TODO: test getChild

  // TODO: test getAttendances
});
