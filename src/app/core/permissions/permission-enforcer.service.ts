import { Injectable } from "@angular/core";
import { DatabaseRule, EntityAbility } from "./permission-types";
import { SessionService } from "../session/session-service/session.service";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Database } from "../database/database";
import { PouchDatabase } from "../database/pouch-database";
import { IDBPDatabase, openDB } from "idb";

@Injectable()
export class PermissionEnforcerService {
  static readonly STORAGE_KEY = "RULES";
  private idbDatabase: IDBPDatabase<any>;
  constructor(
    private sessionService: SessionService,
    private dynamicEntityService: DynamicEntityService,
    private ability: EntityAbility,
    private entityMapper: EntityMapperService,
    private database: Database
  ) {}

  async enforcePermissionsOnLocalData(userRules: DatabaseRule[]) {
    const userStorageKey =
      this.sessionService.getCurrentUser().name +
      "-" +
      PermissionEnforcerService.STORAGE_KEY;
    const storedRules = window.localStorage.getItem(userStorageKey);
    if (!storedRules) {
      const subjects = this.getSubjectsWithReadRestrictions(userRules);
      await this.enforceRulesOnSubjects(subjects);
    }
    window.localStorage.setItem(userStorageKey, JSON.stringify(userRules));
  }

  private getSubjectsWithReadRestrictions(
    rules: DatabaseRule[]
  ): EntityConstructor[] {
    const subjects = new Set<string>();
    rules.forEach((rule) => {
      if (this.hasReadRestriction(rule)) {
        if (Array.isArray(rule.subject)) {
          rule.subject.forEach((subj) => subjects.add(subj));
        } else {
          subjects.add(rule.subject);
        }
      }
    });
    return [...subjects].map((subj) =>
      this.dynamicEntityService.getEntityConstructor(subj)
    );
  }

  private hasReadRestriction(rule: DatabaseRule): boolean {
    return (
      (rule.action === "read" ||
        rule.action.includes("read") ||
        rule.action === "manage") &&
      rule.inverted === true
    );
  }

  private async enforceRulesOnSubjects(subjects: EntityConstructor[]) {
    const idbName =
      "_pouch_" + (this.database as PouchDatabase).getPouchDB().name;
    this.idbDatabase = await openDB(idbName);

    for (let subject of subjects) {
      const entities = await this.entityMapper.loadType(subject);
      for (let entity of entities) {
        if (this.ability.cannot("read", entity)) {
          await this.fullyDeleteEntity(entity);
        }
      }
    }
    this.idbDatabase.close();
  }

  private async fullyDeleteEntity(entity: Entity) {
    const beforeRemove = await this.createTransaction(
      "document-store",
      "readonly"
    ).get(entity._id);
    console.log("deleting", entity);

    await this.entityMapper.remove(entity);

    const afterRemove = await this.createTransaction(
      "document-store",
      "readonly"
    ).get(entity._id);
    await this.createTransaction("document-store", "readwrite").delete(
      entity._id
    );
    // console.log("doc", doc, beforeRemove);
    // console.log("deleting by sequence", doc.seq);
    // const before = await this.createTransaction("by-sequence", "readonly").get(
    //   doc.seq
    // );
    // console.log("before", before);
    await this.createTransaction("by-sequence", "readwrite").delete(
      beforeRemove.seq
    );
    await this.createTransaction("by-sequence", "readwrite").delete(
      afterRemove.seq
    );
    // .then((res) => console.log("res", res))
    //   .catch((err) => console.log("err", err));
  }

  private createTransaction(
    store: string,
    mode: "readwrite" | "readonly" = "readwrite"
  ) {
    return this.idbDatabase.transaction(store, mode).objectStore(store);
  }
}
