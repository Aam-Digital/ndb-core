import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Child} from './child';
import {EntityMapperService} from '../entity/entity-mapper.service';

@Injectable()
export class ChildrenService {
  constructor(private entityMapper: EntityMapperService) {
  }

  getChildren(): Observable<Child[]> {
    return Observable.fromPromise(
      this.entityMapper.loadType<Child>(Child).then(
        loadedEntities => { return loadedEntities; }
      )
    );
  }
}
