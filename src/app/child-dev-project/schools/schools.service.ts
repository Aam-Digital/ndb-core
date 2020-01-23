import { Injectable } from '@angular/core';
import { School } from './model/school';
import { EntityMapperService } from '../../core/entity/entity-mapper.service';
import { from, Observable } from 'rxjs';
import { ChildSchoolRelation } from '../children/model/childSchoolRelation';
import { Database } from '../../core/database/database';
import { Child } from '../children/model/child';
import { EntitySchemaService } from '../../core/entity/schema/entity-schema.service';

@Injectable()
export class SchoolsService {

  constructor(
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    private db: Database) {
  }

  getSchools(): Observable<School[]> {
    return from(this.entityMapper.loadType<School>(School));
  }

  /***
   * Index is set int he ChildrenService
   * @param schoolId school you want relations for
   */
  queryRelationsOfSchool(schoolId: string): Promise<ChildSchoolRelation[]> {
    return this.db.query('childSchoolRelations_index/by_school', {key: schoolId, include_docs: true})
      .then(loadedEntities => {
        return loadedEntities.rows.map(loadedRecord => {
          const entity = new ChildSchoolRelation('');
          this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
          return entity;
        });
      });
  }

  async getChildrenForSchool(schoolId: string): Promise<Child[]> {
    const relations = await this.queryRelationsOfSchool(schoolId);
    const children: Child[] = [];
    for (const relation of relations) {
      const child = await this.entityMapper.load<Child>(Child, relation.childId);
      children.push(child);
    }
    return children;
  }
}
