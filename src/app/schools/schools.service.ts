import {Injectable} from '@angular/core';
import {School} from './school';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {Observable} from 'rxjs';

@Injectable()
export class SchoolsService {

  constructor(private entityMapper: EntityMapperService) {
  }

  getSchools(): Observable<School[]> {
    return Observable.fromPromise(this.entityMapper.loadType<School>(School));
  }
}
