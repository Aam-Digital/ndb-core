import { TestBed } from '@angular/core/testing';

import { CloudFileService } from './cloud-file-service.service';
import { SessionService } from 'app/session/session.service';
import { User } from 'app/user/user';
import { AppConfig } from 'app/app-config/app-config';
import webdav from 'webdav';


describe('CloudFileService', () => {
  let cloudFileService: CloudFileService;
  let sessionService: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: '',
      database: {name: 'unit-tests', remote_url: '', timeout: 60000, outdated_threshold_days: 0, useTemporaryDatabase: true},
      webdav: {remote_url: 'test-url'}
    };

    const sessionSpy = jasmine.createSpyObj('SessionService', ['getCurrentUser']);

    TestBed.configureTestingModule({ providers: [
      CloudFileService,
      { provide: SessionService, useValue: sessionSpy}]
    });

    cloudFileService = TestBed.get(CloudFileService);
    sessionService = TestBed.get(SessionService);
  });

  it('.connect() should call sessionService.getCurrentUser()', () => {
    cloudFileService.connect('user', 'pass');
    expect(sessionService.getCurrentUser).toHaveBeenCalled();
  });

  it('.connect() should call webdav.createClient()', () => {
    spyOn(webdav, 'createClient');
    sessionService.getCurrentUser.and.returnValue(new User('user'));
    cloudFileService.connect('user', 'pass');
    expect(webdav.createClient).toHaveBeenCalledWith('test-url', {username: 'user', password: 'pass'});
  });

  it('.getDir() should call webdav.getDirectoryContents()', () => {
    spyOn(webdav, 'getDirectoryContents');
    cloudFileService.getDir('testDir');
    expect(webdav.getDirectoryContents).toHaveBeenCalledWith('testDir');
  });

  it('should create dir', () => {
    spyOn(webdav, 'createDirectory');
    cloudFileService.createDir('testDir');
    expect(webdav.createDirectory).toHaveBeenCalledWith('testDir');
  })
});
