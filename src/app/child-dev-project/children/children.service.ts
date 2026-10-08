import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { ChildSchoolRelation } from "./model/childSchoolRelation";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { Entity } from "../../core/entity/model/entity";
import { groupBy } from "../../utils/utils";

@Injectable({ providedIn: "root" })
export class ChildrenService {
  private entityMapper = inject(EntityMapperService);
  private dbIndexing = inject(DatabaseIndexingService);

  constructor() {
    this.createChildSchoolRelationIndex();
  }

  /**
   * returns a list of children with additional school info
   */
  async getChildren(): Promise<Entity[]> {
    const children = await this.entityMapper.loadType("Child");
    const relations = await this.entityMapper.loadType(ChildSchoolRelation);
    groupBy(relations, "childId").forEach(([id, rels]) => {
      const child = children.find((c) => c.getId() === id);
      if (child) {
        this.extendChildWithSchoolInfo(child, rels);
      }
    });
    return children;
  }

  /**
   * returns a child with additional school info
   * @param id id of child
   */
  async getChild(id: string): Promise<Entity> {
    const child = await this.entityMapper.load("Child", id);
    const relations = await this.queryRelations(id);
    this.extendChildWithSchoolInfo(child, relations);
    return child;
  }

  private extendChildWithSchoolInfo(
    child: Entity,
    relations: ChildSchoolRelation[],
  ) {
    const active = relations.filter(
      (r) => !r.inactive && r.isActiveAt(new Date()),
    );
    child["schoolId"] = active.map((r) => r.schoolId);
    if (active.length > 0) {
      child["schoolClass"] = active[0]["schoolClass"];
    }
  }

  private createChildSchoolRelationIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/childSchoolRelations_index",
      views: {
        by_child_school: {
          map: `(doc) => {
            if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}:")) {
              return;
            };
            const start = new Date(doc.start || '3000-01-01').getTime();
            emit([doc.childId, start]);
            emit([doc.schoolId, start]);
            return;
          }`,
        },
      },
    };
    return this.dbIndexing.createIndex(designDoc);
  }

  queryRelations(prefix: string) {
    const startkey = prefix.endsWith(":") ? [prefix + "\uffff"] : [prefix, {}];
    return this.dbIndexing.queryIndexDocs(
      ChildSchoolRelation,
      "childSchoolRelations_index/by_child_school",
      {
        startkey,
        endkey: [prefix],
        descending: true,
      },
    );
  }

  queryActiveRelationsOf(
    id: string,
    date = new Date(),
  ): Promise<ChildSchoolRelation[]> {
    return this.queryRelations(id).then((relations) =>
      relations.filter((rel) => rel.isActiveAt(date)),
    );
  }
}
