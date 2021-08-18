import { TestBed } from "@angular/core/testing";
import { CloudFileService } from "./cloud-file-service.service";
import { SessionService } from "../session/session-service/session.service";
import { User } from "../user/user";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "../session/session-type";
import { WebdavWrapperService } from "./webdav-wrapper.service";
import { WebDAVClient } from "webdav";

describe("CloudFileService", () => {
  let cloudFileService: CloudFileService;
  let sessionSpy: jasmine.SpyObj<SessionService>;
  let clientSpy: jasmine.SpyObj<WebDAVClient>;

  const BASE_PATH = "base-path/";
  let mockWebdav: jasmine.SpyObj<WebdavWrapperService>;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "",
      session_type: SessionType.mock,
      database: {
        name: "unit-tests",
        remote_url: "",
      },
      webdav: { remote_url: "test-url" },
    };

    sessionSpy = jasmine.createSpyObj("SessionService", ["getCurrentUser"]);
    clientSpy = jasmine.createSpyObj("client", [
      "getDirectoryContents",
      "createDirectory",
      "getFileContents",
      "putFileContents",
      "deleteFile",
    ]);
    mockWebdav = jasmine.createSpyObj(["createClient"]);

    TestBed.configureTestingModule({
      providers: [
        CloudFileService,
        { provide: SessionService, useValue: sessionSpy },
        { provide: WebdavWrapperService, useValue: mockWebdav },
      ],
    });

    cloudFileService = TestBed.inject<CloudFileService>(CloudFileService);
    cloudFileService["client"] = clientSpy;
    cloudFileService["basePath"] = BASE_PATH;
  });

  it(".connect() should check user existance and call webdav.createClient()", () => {
    sessionSpy.getCurrentUser.and.returnValue(new User("user"));

    cloudFileService.connect("user", "pass");
    expect(sessionSpy.getCurrentUser).toHaveBeenCalled();
    expect(mockWebdav.createClient).toHaveBeenCalledWith("test-url", {
      username: "user",
      password: "pass",
    });
  });

  it(".connect() should abort if appconfig for webdav is not set", () => {
    AppConfig.settings.webdav = null;
    sessionSpy.getCurrentUser.and.returnValue(new User("user"));

    cloudFileService.connect("user", "pass");
    expect(mockWebdav.createClient).not.toHaveBeenCalled();
  });

  it(".connect() should abort if credentials are passed and not configured for user", () => {
    sessionSpy.getCurrentUser.and.returnValue(new User("user"));

    cloudFileService.connect();
    expect(mockWebdav.createClient).not.toHaveBeenCalled();
  });

  it(".connect() should connect using credentials saved for user", () => {
    const testUser = new User("user");
    testUser.cloudUserName = "testuser";
    testUser.setCloudPassword("testuserpass", "pass");
    sessionSpy.getCurrentUser.and.returnValue(testUser);

    cloudFileService.connect();

    expect(sessionSpy.getCurrentUser).toHaveBeenCalled();
    expect(mockWebdav.createClient).toHaveBeenCalledWith("test-url", {
      username: "testuser",
      password: "testuserpass",
    });
  });

  it(".checkConnection() should try to create and delete a file", async () => {
    spyOn(cloudFileService, "doesFileExist").and.returnValue(
      new Promise((resolve) => {
        resolve(true);
      })
    );
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

  it("should check file existance", async () => {
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
