import {Injectable} from '@angular/core';
import {School} from './school';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {from, Observable} from 'rxjs';

@Injectable()
export class SchoolsService {

  constructor(private entityMapper: EntityMapperService) {
  }

  getSchools(): Observable<School[]> {
    return from(this.entityMapper.loadType<School>(School));
  }
}
