import { Injectable } from "@angular/core";
import { Child } from "../children/model/child";
import { ChildrenService } from "../children/children.service";
import { LoggingService } from "../../core/logging/logging.service";

@Injectable()
export class SchoolsService {
  constructor(
    private childrenService: ChildrenService,
    private log: LoggingService
  ) {}

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
}
