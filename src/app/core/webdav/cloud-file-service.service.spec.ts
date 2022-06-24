import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { CloudFileService } from "./cloud-file-service.service";
import { SessionService } from "../session/session-service/session.service";
import { User } from "../user/user";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "../session/session-type";
import { WebdavWrapperService } from "./webdav-wrapper.service";
import { WebDAVClient } from "webdav/web";
import { EntityMapperService } from "../entity/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity/mock-entity-mapper-service";

describe("CloudFileService", () => {
  let cloudFileService: CloudFileService;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockedEntityMapper: MockEntityMapperService;
  let clientSpy: jasmine.SpyObj<WebDAVClient>;

  const BASE_PATH = "base-path/";
  let mockWebdav: jasmine.SpyObj<WebdavWrapperService>;
  let testUser: User;

  beforeEach(fakeAsync(() => {
    AppConfig.settings = {
      site_name: "",
      session_type: SessionType.mock,
      database: { name: "unit-tests" },
      webdav: { remote_url: "test-url" },
    };

    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "user",
      roles: [],
    });
    testUser = new User("user");
    testUser.cloudUserName = "testuser";
    testUser.setCloudPassword("testuserpass", "pass");
    testUser.cloudBaseFolder = BASE_PATH;

    mockedEntityMapper = mockEntityMapper([testUser]);
    clientSpy = jasmine.createSpyObj("client", [
      "getDirectoryContents",
      "createDirectory",
      "getFileContents",
      "putFileContents",
      "deleteFile",
    ]);
    mockWebdav = jasmine.createSpyObj(["createClient", "deleteFile"]);
    mockWebdav.createClient.and.returnValue(clientSpy);
    TestBed.configureTestingModule({
      providers: [
        CloudFileService,
        { provide: SessionService, useValue: mockSessionService },
        { provide: WebdavWrapperService, useValue: mockWebdav },
        { provide: EntityMapperService, useValue: mockedEntityMapper },
      ],
    });

    cloudFileService = TestBed.inject<CloudFileService>(CloudFileService);
    tick();
    mockWebdav.createClient.calls.reset();
  }));

  it(".connect() should check user existence and call webdav.createClient()", async () => {
    await cloudFileService.connect("user", "pass");

    expect(mockSessionService.getCurrentUser).toHaveBeenCalled();
    expect(mockWebdav.createClient).toHaveBeenCalledWith("test-url", {
      username: "user",
      password: "pass",
    });
  });

  it(".connect() should abort if appconfig for webdav is not set", async () => {
    AppConfig.settings.webdav = null;

    await cloudFileService.connect("user", "pass");

    expect(mockWebdav.createClient).not.toHaveBeenCalledTimes(1);
  });

  it(".connect() should abort if credentials are not passed and not configured for user", async () => {
    spyOn(mockedEntityMapper, "load").and.resolveTo(new User());

    await cloudFileService.connect();

    expect(mockWebdav.createClient).not.toHaveBeenCalled();
  });

  it(".connect() should connect using credentials saved for user", async () => {
    await cloudFileService.connect();

    expect(mockSessionService.getCurrentUser).toHaveBeenCalled();
    expect(mockWebdav.createClient).toHaveBeenCalledWith("test-url", {
      username: "testuser",
      password: "testuserpass",
    });
  });

  it(".checkConnection() should try to create and delete a file", async () => {
    spyOn(cloudFileService, "doesFileExist").and.resolveTo(true);

    await cloudFileService.checkConnection();

    expect(clientSpy.putFileContents).toHaveBeenCalled();
    expect(clientSpy.deleteFile).toHaveBeenCalled();
  });

  it(".getDir() should call webdav.getDirectoryContents()", () => {
    cloudFileService.getDir("testDir");

    expect(clientSpy.getDirectoryContents).toHaveBeenCalledWith(
      BASE_PATH + "testDir"
    );
  });

  it("should create dir", () => {
    cloudFileService.createDir("testDir");

    expect(clientSpy.createDirectory).toHaveBeenCalledWith(
      BASE_PATH + "testDir"
    );
  });

  it("should check file existence", async () => {
    clientSpy.getDirectoryContents.and.resolveTo({
      basename: "filename",
    } as any);

    expect(await cloudFileService.doesFileExist("filename")).toBe(true);
    expect(clientSpy.getDirectoryContents).toHaveBeenCalledWith(BASE_PATH);
    expect(await cloudFileService.doesFileExist("nonexistant")).toBe(false);
  });

  it("should get images", async () => {
    clientSpy.getFileContents.and.resolveTo("image-data");

    const cloudBufferConverterFun = spyOn(
      cloudFileService,
      // @ts-ignore
      "bufferArrayToBase64"
    ).and.returnValue("data-url" as any);

    const returnedFile = await cloudFileService.getFile("filepath");
    expect(returnedFile).toEqual("data-url");
    expect(clientSpy.getFileContents).toHaveBeenCalledWith(
      BASE_PATH + "filepath"
    );
    expect(cloudBufferConverterFun).toHaveBeenCalledWith("image-data");
  });

  it("should set images", () => {
    cloudFileService.uploadFile("image", "path/file");
    expect(clientSpy.putFileContents).toHaveBeenCalledWith(
      BASE_PATH + "path/file",
      "image"
    );
  });

  it("should reject if file does not exist", () => {
    clientSpy.getFileContents.and.rejectWith();
    return expectAsync(cloudFileService.getFile("filepath")).toBeRejected();
  });
});
