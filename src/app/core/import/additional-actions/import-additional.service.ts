import { inject, Injectable } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";

/**
 * Service to handle additional import actions
 * like creating secondary relationship entities.
 */
@Injectable({
  providedIn: "root",
})
export class ImportAdditionalService {
  private readonly entityMapper = inject(EntityMapperService);

  private linkableEntities: {
    [key: string]: {
      [key: string]: {
        create: (entities: Entity[], id: string) => Promise<any>;
        undo: (importMeta: ImportMetadata, id: string) => Promise<any>;
      };
    };
  } = {
    // TODO: generalize this somehow by analyzing schemas?
    ["Child"]: {
      [RecurringActivity.ENTITY_TYPE]: {
        create: this.linkToActivity.bind(this),
        undo: this.undoActivityLink.bind(this),
      },
      ["School"]: {
        create: this.linkToSchool.bind(this),
        undo: this.undoSchoolLink.bind(this),
      },
    },
  };

  getLinkableEntities(entityType: string): string[] {
    return Object.keys(this.linkableEntities[entityType] ?? {});
  }

  /**
   * Execute additional import actions for the given entities,
   * linking entities.
   * @param entities
   * @param settings
   */
  public executeImport(entities: Entity[], settings: ImportSettings) {
    return Promise.all(
      settings.additionalActions?.map(({ type, id }) =>
        this.linkableEntities[settings.entityType][type].create(entities, id),
      ) ?? [],
    );
  }

  public async undoImport(importMeta: ImportMetadata): Promise<void> {
    const undoes =
      importMeta.config.additionalActions?.map(({ type, id }) =>
        this.linkableEntities[importMeta.config.entityType][type].undo(
          importMeta,
          id,
        ),
      ) ?? [];
    await Promise.all(undoes);
  }

  private linkToSchool(entities: Entity[], id: string) {
    const relations = entities.map((entity) => {
      const relation = new ChildSchoolRelation();
      relation.childId = entity.getId();
      relation.schoolId = id;
      return relation;
    });
    return this.entityMapper.saveAll(relations);
  }

  private async undoSchoolLink(importMeta: ImportMetadata) {
    const relations = await this.entityMapper.loadType(ChildSchoolRelation);
    const imported = relations.filter((rel) =>
      importMeta.ids.includes(Entity.createPrefixedId("Child", rel.childId)),
    );
    return Promise.all(imported.map((rel) => this.entityMapper.remove(rel)));
  }

  private async linkToActivity(entities: Entity[], id: string) {
    const activity = await this.entityMapper.load(RecurringActivity, id);
    const ids = entities.map((e) => e.getId());
    activity.participants.push(...ids);
    return this.entityMapper.save(activity);
  }

  private async undoActivityLink(importMeta: ImportMetadata, id: string) {
    const activity = await this.entityMapper.load(RecurringActivity, id);
    activity.participants = activity.participants.filter(
      (p) => !importMeta.ids.includes(Entity.createPrefixedId("Child", p)),
    );
    return this.entityMapper.save(activity);
  }
}
