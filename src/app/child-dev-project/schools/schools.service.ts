import { Injectable } from "@angular/core";
import { Child } from "../children/model/child";
import { ChildrenService } from "../children/children.service";
import { LoggingService } from "../../core/logging/logging.service";

@Injectable()
export class SchoolsService {
  constructor(
    private childrenService: ChildrenService
  ) {}

  async getChildrenForSchool(schoolId: string): Promise<Child[]> {
    const relations = await this.childrenService.queryRelationsOf(
      "school",
      schoolId
    );
    const childrenPromises = relations.map((rel) =>
      this.childrenService
        .getChild(rel.childId)
        .toPromise()
        .catch(() => null)
    );
    let children = await Promise.all(childrenPromises);
    children = children.filter((child) => !!child);
    return children;
  }
}
