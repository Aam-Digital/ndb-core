import { Injectable } from "@angular/core";
import { School } from "./model/school";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { from, Observable } from "rxjs";
import { Child } from "../children/model/child";
import { ChildrenService } from "../children/children.service";
import { LoggingService } from "../../core/logging/logging.service";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";

@Injectable()
export class SchoolsService {
  constructor(
    private entityMapper: EntityMapperService,
    private childrenService: ChildrenService,
    private log: LoggingService
  ) {}

  getSchools(): Observable<School[]> {
    return from(this.entityMapper.loadType<School>(School));
  }

  async getChildrenForSchool(schoolId: string): Promise<Child[]> {
    const relations = await this.childrenService.queryRelationsOf(
      "school",
      schoolId
    );
    const children: Child[] = [];
    for (const relation of relations) {
      try {
        children.push(
          await this.childrenService.getChild(relation.childId).toPromise()
        );
      } catch (e) {
        this.log.warn("Could not find child " + relation.childId);
      }
    }
    return children;
  }

  getRelationsForSchool(schoolId: string): Promise<ChildSchoolRelation[]> {
    return this.childrenService.queryRelationsOf(
      "school",
      schoolId
    );
  }
}
