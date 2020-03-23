import { TestBed } from '@angular/core/testing';
import { CloudFileService } from './cloud-file-service.service';
import { SessionService } from '../session/session.service';
import { User } from '../user/user';
import { AppConfig } from '../app-config/app-config';
import webdav from 'webdav';


describe('CloudFileService', () => {
  let cloudFileService: CloudFileService;
  let sessionService: jasmine.SpyObj<SessionService>;
  let sessionSpy;
  let clientSpy;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: '',
      database: {name: 'unit-tests', remote_url: '', timeout: 60000, outdated_threshold_days: 0, useTemporaryDatabase: true},
      webdav: {remote_url: 'test-url'},
    };

    sessionSpy = jasmine.createSpyObj('SessionService', ['getCurrentUser']);
    clientSpy = jasmine.createSpyObj('client', ['getDirectoryContents', 'createDirectory', 'getFileContents', 'putFileContents', 'deleteFile']);

    TestBed.configureTestingModule({ providers: [
      CloudFileService,
      { provide: SessionService, useValue: sessionSpy}],
    });

    cloudFileService = TestBed.get(CloudFileService);
    cloudFileService['client'] = clientSpy;
    cloudFileService['imagePath'] = '/imagePath';
    sessionService = TestBed.get(SessionService);
  });



  it('.connect() should check user existance and call webdav.createClient()', () => {
    spyOn(webdav, 'createClient');
    sessionService.getCurrentUser.and.returnValue(new User('user'));

    cloudFileService.connect('user', 'pass');
    expect(sessionService.getCurrentUser).toHaveBeenCalled();
    expect(webdav.createClient).toHaveBeenCalledWith('test-url', {username: 'user', password: 'pass'});
  });

  it('.connect() should abort if appconfig for webdav is not set', () => {
    spyOn(webdav, 'createClient');
    AppConfig.settings.webdav = null;
    sessionService.getCurrentUser.and.returnValue(new User('user'));

    cloudFileService.connect('user', 'pass');
    expect(webdav.createClient).not.toHaveBeenCalled();
  });

  it('.connect() should abort if credentials are passed and not configured for user', () => {
    spyOn(webdav, 'createClient');
    sessionService.getCurrentUser.and.returnValue(new User('user'));

    cloudFileService.connect();
    expect(webdav.createClient).not.toHaveBeenCalled();
  });

  it('.connect() should connect using credentials saved for user', () => {
    spyOn(webdav, 'createClient');

    const testUser = new User('user');
    testUser.setNewPassword('pass');
    testUser.cloudUserName = 'testuser';
    testUser.setCloudPassword('testuserpass', 'pass');
    sessionService.getCurrentUser.and.returnValue(testUser);

    cloudFileService.connect();
    expect(sessionService.getCurrentUser).toHaveBeenCalled();
    expect(webdav.createClient).toHaveBeenCalledWith('test-url', {username: 'testuser', password: 'testuserpass'});
  });


  it('.checkConnection() should try to create and delete a file', async () => {
    spyOn(cloudFileService, 'doesFileExist').and.returnValue(new Promise(resolve => {resolve(true); }));
    await cloudFileService.checkConnection();
    expect(clientSpy.putFileContents).toHaveBeenCalled();
    expect(clientSpy.deleteFile).toHaveBeenCalled();
  });

  it('.getDir() should call webdav.getDirectoryContents()', () => {
    cloudFileService.getDir('testDir');
    expect(clientSpy.getDirectoryContents).toHaveBeenCalledWith('testDir');
  });

  it('should create dir', () => {
    cloudFileService.createDir('testDir');
    expect(clientSpy.createDirectory).toHaveBeenCalledWith('testDir');
  });

  it('should check file existance', async() => {
    spyOn(cloudFileService, 'getDir').and.returnValue(new Promise(resolve => {resolve('"basename": "filename"'); }));
    expect(await cloudFileService.doesFileExist('filename')).toBe(true);
    expect(await cloudFileService.doesFileExist('nonexistant')).toBe(false);
  });

  it('should get images', async() => {
    spyOn(cloudFileService, 'doesFileExist').and.returnValue(new Promise(resolve => {resolve(true); }));
    await cloudFileService.getImage('filepath');
    expect(clientSpy.getFileContents).toHaveBeenCalledWith(cloudFileService['imagePath'] + '/filepath');
  });

  it('should set images', () => {
    cloudFileService.setImage('image', 'path');
    expect(clientSpy.putFileContents).toHaveBeenCalledWith(cloudFileService['imagePath'] + '/path', 'image', jasmine.anything());
  });

  it('should return a default image if no child picture is present', async () => {
    spyOn(cloudFileService, 'getDefaultImage');
    spyOn(cloudFileService, 'doesFileExist').and.returnValue(new Promise(resolve => {resolve(false); }));
    const image = await cloudFileService.getImage('filepath');
    expect(image).toBe(cloudFileService.getDefaultImage());
  });
});
