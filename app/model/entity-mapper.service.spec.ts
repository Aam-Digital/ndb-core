import { EntityMapperService } from "./entity-mapper.service";

describe('entity-mapper tests', () => {
    let entityMapper: EntityMapperService;
    let mockDatabase;

    beforeEach(() => {
        mockDatabase = jasmine.createSpyObj('mockDatabase', []);
        entityMapper = new EntityMapperService(mockDatabase);
    });

    xit('test entitymapper', () => expect(true).toBeTruthy());
});
