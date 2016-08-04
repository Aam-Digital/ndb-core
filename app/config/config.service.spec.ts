import { ConfigService } from "./config.service";

describe('config tests', () => {
    let configService: ConfigService;

    beforeEach(() => {
        configService = new ConfigService();
    });


    it('true is true', () => expect(true).toEqual(true));
    it('version is defined', () => expect(configService.version).toBeDefined());
    it('database name is defined', () => expect(configService.database.name).toBeDefined());
});
