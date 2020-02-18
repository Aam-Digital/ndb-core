import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFileServiceUserSettingsComponent } from './cloud-file-service-user-settings.component';
import { CloudFileService } from '../cloud-file-service.service';
import { User } from '../../user/user';
import { WebdavModule } from '../webdav.module';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { AlertService } from '../../alerts/alert.service';
import { AppConfig } from '../../app-config/app-config';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CloudFileServiceUserSettingsComponent', () => {
  let component: CloudFileServiceUserSettingsComponent;
  let fixture: ComponentFixture<CloudFileServiceUserSettingsComponent>;

  let mockCloudFileService;
  let mockEntityMapper;
  let testUser;

  beforeEach(async(() => {
    testUser = new User('user');
    mockCloudFileService = jasmine.createSpyObj<CloudFileService>('', ['connect', 'checkConnection']);
    mockEntityMapper = jasmine.createSpyObj<EntityMapperService>('', ['save']);

    // @ts-ignore
    AppConfig.settings = { webdav: { remote_url: 'test-url' } };

    TestBed.configureTestingModule({
      imports: [
        WebdavModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: CloudFileService, useValue: mockCloudFileService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: AlertService, useValue: jasmine.createSpyObj(['addSuccess']) },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFileServiceUserSettingsComponent);
    component = fixture.componentInstance;
    component.user = testUser;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update cloud-service credentials and check the connection', async () => {
    spyOn(testUser, 'setCloudPassword');
    spyOn(testUser, 'checkPassword');
    testUser.checkPassword.and.returnValue(true);
    component.form.controls.cloudUser.setValue('testUser');
    component.form.controls.cloudPassword.setValue('testPwd');
    component.form.controls.userPassword.setValue('loginPwd');
    mockCloudFileService.checkConnection.and.returnValue(Promise.resolve(true));

    await component.updateCloudServiceSettings();
    expect(testUser.cloudUserName).toBe('testUser');
    expect(testUser.setCloudPassword).toHaveBeenCalledWith('testPwd', 'loginPwd');
    expect(mockCloudFileService.connect).toHaveBeenCalled();
    expect(mockCloudFileService.checkConnection).toHaveBeenCalled();
    expect(mockEntityMapper.save).toHaveBeenCalledWith(testUser);
  });

  it('should not save user if cloud-service credentials are incorrect', async () => {
    spyOn(testUser, 'setCloudPassword');
    spyOn(testUser, 'checkPassword');
    testUser.checkPassword.and.returnValue(true);
    component.form.controls.cloudUser.setValue('testUser');
    component.form.controls.cloudPassword.setValue('testPwd');
    component.form.controls.userPassword.setValue('loginPwd');
    mockCloudFileService.connect.and.throwError(new Error());

    await component.updateCloudServiceSettings();
    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });
});
