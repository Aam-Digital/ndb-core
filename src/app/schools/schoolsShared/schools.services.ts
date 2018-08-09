import {Injectable} from '@angular/core';
import {School} from './school';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {Observable} from '../../../../node_modules/rxjs/Rx';

@Injectable()
export class SchoolsServices {

  constructor(private entityMapper: EntityMapperService) {
  }

  getSchools(): Observable<School[]> {
    return Observable.fromPromise(this.entityMapper.loadType<School>(School));
  }
}
