import { TestBed, inject } from '@angular/core/testing';

import { ConfigService } from './config.service';

describe('ConfigService', () => {
  describe('config tests', () => {
    let configService: ConfigService;

    beforeEach(() => {
      configService = new ConfigService();
    });

    it('version is defined', () => expect(configService.version).toBeDefined());

    it('database name is defined', () => expect(configService.database.name).toBeDefined());
    it('database name is defined', () => expect(configService.database.remote_url).toBeDefined());
  });
});
