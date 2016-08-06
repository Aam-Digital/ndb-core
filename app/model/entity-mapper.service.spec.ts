import { EntityMapperService } from "./entity-mapper.service";
import { Entity } from "./entity";
import { PouchDatabase } from "../database/pouch-database";

describe('entity-mapper tests', () => {
    let entityMapper: EntityMapperService;
    let testDatabase: PouchDatabase;
    let pouch;

    let existingEntity = {
        _id: "existing-entity",
        label: "entity from database"
    };

    beforeEach(() => {
        pouch = new PouchDB("unit-test");
        pouch.put(existingEntity);
        testDatabase = new PouchDatabase(pouch);

        entityMapper = new EntityMapperService(testDatabase);
    });

    afterEach(() => {
        pouch.destroy();
    });


    it('loads existing entity', function (done) {
        entityMapper.load<Entity>(new Entity(existingEntity._id)).then(
            function (loadedEntity) {
                expect(loadedEntity.getId()).toBe(existingEntity._id);
                done();
            }
        );
    });

    it('rejects promise when loading nonexistent entity', function (done) {
        entityMapper.load<Entity>(new Entity("nonexistent_id")).catch(
            function () {
                done();
            }
        );
    });


    it('saves new entity and loads it', function (done) {
        let entity = new Entity("test1");
        entityMapper.save<Entity>(entity).then(
            function () {
                entityMapper.load<Entity>(new Entity(entity.getId())).then(
                    function (loadedEntity) {
                        expect(loadedEntity.getId()).toBe(entity.getId());
                        done();
                    }
                );
            }
        );
    });

    it('rejects promise when saving new entity with existing id', function (done) {
        let duplicateEntity = new Entity(existingEntity._id);
        entityMapper.save<Entity>(duplicateEntity).catch(
            function (error) {
                expect(error).toBeDefined();
                done();
            }
        );
    });

    it('saves new version of existing entity', function (done) {
        entityMapper.load<Entity>(new Entity(existingEntity._id)).then(
            function (loadedEntity) {
                expect(loadedEntity.getId()).toBe(existingEntity._id);

                entityMapper.save<Entity>(loadedEntity);
                done();
            }
        );
    });


    it('removes existing entity', function (done) {
        // entity needs to be an entity loaded from the database in order to remove it
        entityMapper.load<Entity>(new Entity(existingEntity._id)).then(
            function (loadedEntity) {
                entityMapper.remove<Entity>(loadedEntity).then(
                    function () {
                        entityMapper.load<Entity>(new Entity(existingEntity._id)).catch(
                            function () {
                                done();
                            }
                        );
                    }
                );
            }
        );
    });

    it('rejects promise removing nonexistent entity', function (done) {
        let nonexistingEntity = new Entity("nonexistent-entity");
        entityMapper.remove<Entity>(nonexistingEntity).catch(
            function (error) {
                expect(error).toBeDefined();
                done();
            }
        )
    });
});
