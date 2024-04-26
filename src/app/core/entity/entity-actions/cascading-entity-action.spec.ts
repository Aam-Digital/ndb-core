import { DatabaseEntity } from "../database-entity.decorator";
import { Entity } from "../model/entity";
import { DatabaseField } from "../database-field.decorator";
import {
  comparableEntityData,
  expectEntitiesToMatch,
} from "../../../utils/expect-entity-data.spec";
import { MockEntityMapperService } from "../entity-mapper/mock-entity-mapper-service";

/*
     Deleting/Anonymizing referenced & related entities
     also see doc/compodoc_sources/concepts/entity-anonymization.md

     we distinguish different roles / relations between entities:
      ♢ "aggregate" (has-a): both entities have meaning independently
      ♦ "composite" (is-part-of): the entity holding the reference is only meaningful in the context of the referenced
  */
@DatabaseEntity("EntityWithAnonRelations")
export class EntityWithAnonRelations extends Entity {
  static override hasPII = true;

  @DatabaseField() name: string;

  @DatabaseField({
    dataType: "array",
    innerDataType: "entity",
    additional: "EntityWithAnonRelations",
    anonymize: "retain",
    entityReferenceRole: "aggregate",
  })
  refAggregate: string[];

  @DatabaseField({
    dataType: "array",
    innerDataType: "entity",
    additional: "EntityWithAnonRelations",
    anonymize: "retain",
    entityReferenceRole: "composite",
  })
  refComposite: string[];

  static create(name: string, properties?: Partial<EntityWithAnonRelations>) {
    return Object.assign(new EntityWithAnonRelations(), {
      name: name,
      ...properties,
    });
  }
}

export function expectAllUnchangedExcept(
  changedEntities: EntityWithAnonRelations[],
  entityMapper: MockEntityMapperService,
) {
  const isExpectedUnchanged = (entity: EntityWithAnonRelations) => {
    !changedEntities.some((c) => entity.getId() === c.getId());
  };

  const actualEntitiesAfter =
    entityMapper.getAllData() as EntityWithAnonRelations[];

  expectEntitiesToMatch(
    actualEntitiesAfter.filter(isExpectedUnchanged),
    allEntities.filter(isExpectedUnchanged),
    true,
  );
}

export function expectDeleted(
  deletedEntities: Entity[],
  entityMapper: MockEntityMapperService,
) {
  const actualEntitiesAfter = entityMapper.getAllData();

  for (const deletedEntity of deletedEntities) {
    expect(actualEntitiesAfter).not.toContain(deletedEntity);
  }
}

export function expectUpdated(
  updatedEntities: EntityWithAnonRelations[],
  entityMapper: MockEntityMapperService,
) {
  const actualEntitiesAfter = entityMapper.getAllData();

  for (const updatedEntity of updatedEntities) {
    const actualEntity = actualEntitiesAfter.find(
      (e) => e.getId() === updatedEntity.getId(),
    );
    expect(comparableEntityData(actualEntity)).toEqual(
      comparableEntityData(updatedEntity),
    );
  }
}

const WithoutRelations = EntityWithAnonRelations.create(
  "entity without relations",
);

const ReferencedAsComposite = EntityWithAnonRelations.create(
  "entity referenced as composite",
);
const ReferencingSingleComposite = EntityWithAnonRelations.create(
  "entity having a composite reference",
  {
    refComposite: [ReferencedAsComposite.getId()],
  },
);

const ReferencedAsOneOfMultipleComposites1 = EntityWithAnonRelations.create(
  "entity referenced as one composite (1)",
);
const ReferencedAsOneOfMultipleComposites2 = EntityWithAnonRelations.create(
  "entity referenced as one composite (2)",
);
const ReferencingTwoComposites = EntityWithAnonRelations.create(
  "entity referencing two entities as composites",
  {
    refComposite: [
      ReferencedAsOneOfMultipleComposites1.getId(),
      ReferencedAsOneOfMultipleComposites2.getId(),
    ],
  },
);

const ReferencingCompositeAndAggregate_refComposite =
  EntityWithAnonRelations.create(
    "referenced as composite from composite+aggregate referencing entity",
  );
const ReferencingCompositeAndAggregate_refAggregate =
  EntityWithAnonRelations.create(
    "referenced as aggregate from composite+aggregate referencing entity",
  );
const ReferencingCompositeAndAggregate = EntityWithAnonRelations.create(
  "having both a composite and a aggregate reference",
  {
    refComposite: [ReferencingCompositeAndAggregate_refComposite.getId()],
    refAggregate: [ReferencingCompositeAndAggregate_refAggregate.getId()],
  },
);

const ReferencingAggregate_ref = EntityWithAnonRelations.create(
  "entity referenced as aggregate",
);
const ReferencingAggregate = EntityWithAnonRelations.create(
  "entity having an aggregate reference",
  {
    refAggregate: [ReferencingAggregate_ref.getId()],
  },
);

const ReferencingTwoAggregates_ref1 = EntityWithAnonRelations.create(
  "entity referenced as one aggregate (1)",
);
const ReferencingTwoAggregates_ref2 = EntityWithAnonRelations.create(
  "entity referenced as one aggregate (2)",
);
const ReferencingTwoAggregates = EntityWithAnonRelations.create(
  "entity referencing two entities as aggregates",
  {
    refAggregate: [
      ReferencingTwoAggregates_ref1.getId(),
      ReferencingTwoAggregates_ref2.getId(),
    ],
  },
);

export const ENTITIES = {
  WithoutRelations,
  ReferencedAsComposite,
  ReferencingSingleComposite,
  ReferencedAsOneOfMultipleComposites1,
  ReferencedAsOneOfMultipleComposites2,
  ReferencingTwoComposites,
  ReferencingCompositeAndAggregate_refComposite,
  ReferencingCompositeAndAggregate_refAggregate,
  ReferencingCompositeAndAggregate,
  ReferencingAggregate_ref,
  ReferencingAggregate,
  ReferencingTwoAggregates_ref1,
  ReferencingTwoAggregates_ref2,
  ReferencingTwoAggregates,
};

export const allEntities: EntityWithAnonRelations[] = [
  ENTITIES.WithoutRelations,
  ENTITIES.ReferencedAsComposite,
  ENTITIES.ReferencingSingleComposite,
  ENTITIES.ReferencedAsOneOfMultipleComposites1,
  ENTITIES.ReferencedAsOneOfMultipleComposites2,
  ENTITIES.ReferencingTwoComposites,
  ENTITIES.ReferencingCompositeAndAggregate_refComposite,
  ENTITIES.ReferencingCompositeAndAggregate_refAggregate,
  ENTITIES.ReferencingCompositeAndAggregate,
  ENTITIES.ReferencingAggregate_ref,
  ENTITIES.ReferencingAggregate,
  ENTITIES.ReferencingTwoAggregates_ref1,
  ENTITIES.ReferencingTwoAggregates_ref2,
  ENTITIES.ReferencingTwoAggregates,
];
