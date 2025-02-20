import { inject, Injectable } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";

/**
 * Service to handle additional import actions
 * like creating secondary relationship entities.
 */
@Injectable({
  providedIn: "root",
})
export class ImportAdditionalService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly entityRegistry = inject(EntityRegistry);

  private GP_INDIVIDUAL_LINKABLE_ENTITIES = {
    ["Event"]: {
      create: (entities: Entity[], id: string) =>
        this.linkIndirectly(
          entities,
          "Participant2Event",
          "participant",
          "event",
          id,
        ),
      undo: (entities: string[], id: string) =>
        this.undoLinkIndirectly(entities, "Participant2Event", "participant"),
    },
    ["organisation"]: {
      create: (entities: Entity[], id: string) =>
        this.linkIndirectly(
          entities,
          "Individual2Organisation",
          "individual",
          "organisation",
          id,
        ),
      undo: (entities: string[], id: string) =>
        this.undoLinkIndirectly(
          entities,
          "Individual2Organisation",
          "individual",
        ),
    },
  };

  private linkableEntities: {
    [key: string]: {
      [key: string]: {
        create: (entities: Entity[], id: string) => Promise<any>;
        undo: (entities: string[], id: string) => Promise<any>;
      };
    };
  } = {
    // TODO: generalize this somehow by analyzing schemas?
    ["Individual"]: this.GP_INDIVIDUAL_LINKABLE_ENTITIES,
    ["Child"]: {
      [RecurringActivity.ENTITY_TYPE]: {
        create: (entities: Entity[], id: string) =>
          this.linkDirectly(
            entities,
            RecurringActivity.ENTITY_TYPE,
            "participants",
            id,
          ),
        undo: (entities: string[], id: string) =>
          this.undoLinkDirectly(
            entities,
            RecurringActivity.ENTITY_TYPE,
            "participants",
            id,
          ),
      },
      ["School"]: {
        create: (entities: Entity[], id: string) =>
          this.linkIndirectly(
            entities,
            ChildSchoolRelation.ENTITY_TYPE,
            "childId",
            "schoolId",
            id,
          ),
        undo: (entities: string[], id: string) =>
          this.undoLinkIndirectly(
            entities,
            ChildSchoolRelation.ENTITY_TYPE,
            "childId",
          ),
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
          importMeta.ids,
          id,
        ),
      ) ?? [];
    await Promise.all(undoes);
  }

  /**
   * Link the imported entities "indirectly"
   * by creating "relationship entities" between the imported entities and a given target entity.
   * @param entitiesToBeLinked An array of imported entities for which the additional linking should be done
   * @param relationshipEntityType EntityType of the relationship entity (used to reference both the imported and the target, e.g. "ChildSchoolRelation")
   * @param relationshipProperty Attribute of the relationship entity that references the imported entity
   * @param relationshipTargetProperty Attribute of the relationship entity that references the target entity
   * @param targetId ID of the target entity (to which the entities should be linked via the relationship entity)
   * @private
   */
  private linkIndirectly(
    entitiesToBeLinked: Entity[],
    relationshipEntityType: string,
    relationshipProperty: string,
    relationshipTargetProperty: string,
    targetId: string,
  ) {
    const relationCtr = this.entityRegistry.get(relationshipEntityType);

    const relations = entitiesToBeLinked.map((entity) => {
      const relation = new relationCtr();
      relation[relationshipProperty] = entity.getId();
      relation[relationshipTargetProperty] = targetId;
      return relation;
    });
    return this.entityMapper.saveAll(relations);
  }

  /**
   * Undo the `linkIndirectly` action and delete relationship entities linking imported entities to other entity.
   * @param entitiesToBeUnlinked An array of imported entities for which the additional linking was done
   * @param relationshipEntityType EntityType of the relationship entity (used to reference both the imported and the target, e.g. "ChildSchoolRelation")
   * @param relationshipProperty Attribute of the relationship entity that references the imported entity
   * @private
   */
  private async undoLinkIndirectly(
    entitiesToBeUnlinked: string[],
    relationshipEntityType: string,
    relationshipProperty: string,
  ) {
    const relations = await this.entityMapper.loadType(relationshipEntityType);
    const imported = relations.filter((rel) =>
      entitiesToBeUnlinked.includes(rel[relationshipProperty]),
    );
    await Promise.all(imported.map((rel) => this.entityMapper.remove(rel)));
  }

  /**
   * Link the imported entities "directly"
   * by updating and entity-reference field in a given other entity.
   * @param entitiesToBeLinked An array of imported entities for which the additional linking should be done
   * @param targetType EntityType of the target entity (into which the entities should be linked)
   * @param targetProperty Attribute of the target entity to which the linked entities should be added
   * @param targetId ID of the target entity (into which the entities should be linked)
   * @private
   */
  private async linkDirectly(
    entitiesToBeLinked: Entity[],
    targetType: string,
    targetProperty: string,
    targetId: string,
  ) {
    const targetEntity = await this.entityMapper.load(targetType, targetId);
    const ids = entitiesToBeLinked.map((e) => e.getId());

    if (!targetEntity[targetProperty]) {
      targetEntity[targetProperty] = [];
    }
    targetEntity[targetProperty].push(...ids);
    return this.entityMapper.save(targetEntity);
  }

  /**
   * Undo the `linkDirectly` action and remove references to the imported entities from the target entity.
   * @param entitiesToBeUnlinked An array of imported entities for which the additional linking was done
   * @param targetType EntityType of the target entity (into which the entities have been linked)
   * @param targetProperty Attribute of the target entity to which the linked entities should be removed
   * @param targetId ID of the target entity (into which the entities have been linked)
   * @private
   */
  private async undoLinkDirectly(
    entitiesToBeUnlinked: string[],
    targetType: string,
    targetProperty: string,
    targetId: string,
  ) {
    const targetEntity = await this.entityMapper.load(targetType, targetId);
    targetEntity[targetProperty] = targetEntity[targetProperty]?.filter(
      (e) => !entitiesToBeUnlinked.includes(e),
    );
    return this.entityMapper.save(targetEntity);
  }
}
