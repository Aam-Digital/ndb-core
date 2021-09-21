import { Injectable } from "@angular/core";
import { School } from "./model/school";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { from, Observable } from "rxjs";
import { ChildrenService } from "../children/children.service";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";

@Injectable()
export class SchoolsService {
  constructor(
    private entityMapper: EntityMapperService,
    private childrenService: ChildrenService
  ) {}

  getSchools(): Observable<School[]> {
    return from(this.entityMapper.loadType<School>(School));
  }

  getRelationsForSchool(schoolId: string): Promise<ChildSchoolRelation[]> {
    return this.childrenService.queryRelationsOf("school", schoolId);
  }
}
