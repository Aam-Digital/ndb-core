import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { ChildPhotoService } from "./child-photo.service";
import { CloudFileService } from "../../../core/webdav/cloud-file-service.service";
import { Child } from "../model/child";

describe("ChildPhotoService", () => {
  let service: ChildPhotoService;
  let mockCloudFileService: jasmine.SpyObj<CloudFileService>;

  const DEFAULT_IMG = "assets/child.png";

  beforeEach(() => {
    mockCloudFileService = jasmine.createSpyObj("mockCloudFileService", [
      "isConnected",
      "uploadFile",
      "doesFileExist",
      "getFile",
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: CloudFileService, useValue: mockCloudFileService },
      ],
    });
    service = TestBed.inject<ChildPhotoService>(ChildPhotoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should getFile default if no webdav connection", async () => {
    const testChild = new Child("1");
    const actualImage = await service.getImage(testChild);
    expect(actualImage).toBe(DEFAULT_IMG);
  });

  it("should getFile from webdav connection", async () => {
    const testChild = new Child("1");
    const testImg = "url-encoded-img";
    mockCloudFileService.isConnected.and.returnValue(true);
    mockCloudFileService.doesFileExist.and.returnValue(Promise.resolve(true));
    mockCloudFileService.getFile.and.returnValue(Promise.resolve(testImg));

    const actualImage = await service.getImage(testChild);
    expect(actualImage).toBe(testImg);
    expect(mockCloudFileService.getFile).toHaveBeenCalledWith(
      "photos/" + testChild.getId() + ".png"
    );
  });

  it("should getFile from assets (old pattern) if it not exists at webdav location", async () => {
    const testChild = new Child("1");
    testChild.photoFile = "test-photo.png";
    mockCloudFileService.isConnected.and.returnValue(true);
    mockCloudFileService.doesFileExist.and.returnValue(Promise.resolve(false));
    mockCloudFileService.getFile.and.returnValue(
      Promise.reject("File not found")
    );

    const actualImage = await service.getImage(testChild);
    expect(actualImage).toBe(Child.generatePhotoPath(testChild.photoFile));
  });

  it("should getFile default if neither webdav nor assets has the file", async () => {
    const testChild = new Child("1");
    mockCloudFileService.isConnected.and.returnValue(true);
    mockCloudFileService.doesFileExist.and.returnValue(Promise.resolve(false));
    mockCloudFileService.getFile.and.returnValue(
      Promise.reject("File not found")
    );

    const actualImage = await service.getImage(testChild);
    expect(actualImage).toBe(DEFAULT_IMG);
  });

  it("should getImageAsyncObservable with multiple next() images", fakeAsync(() => {
    const testChild = new Child("1");
    const testImg = "url-encoded-img";
    mockCloudFileService.isConnected.and.returnValue(true);
    mockCloudFileService.doesFileExist.and.returnValue(Promise.resolve(true));
    mockCloudFileService.getFile.and.returnValue(Promise.resolve(testImg));

    const resultSubject = service.getImageAsyncObservable(testChild);
    expect(resultSubject.value).toBe(DEFAULT_IMG);

    tick();
    expect(resultSubject.value).toBe(testImg);
  }));

  it("should return false for canSetImage if no webdav connection", async () => {
    mockCloudFileService.isConnected.and.returnValue(false);

    expect(service.canSetImage()).toBeFalsy();
    expect(mockCloudFileService.isConnected).toHaveBeenCalled();
  });

  it("should reject uploadFile if no webdav connection", async () => {
    mockCloudFileService.isConnected.and.returnValue(false);

    await expectAsync(service.setImage(null, "1")).toBeRejected();
    expect(mockCloudFileService.isConnected).toHaveBeenCalled();
    expect(mockCloudFileService.uploadFile).not.toHaveBeenCalled();
  });

  it("should call uploadFile for existing webdav connection", async () => {
    const childId = "1";
    const testImg = { name: "test.png", data: "test-img-data" };
    mockCloudFileService.isConnected.and.returnValue(true);
    mockCloudFileService.uploadFile.and.returnValue(Promise.resolve(true));

    await expectAsync(service.setImage(testImg, childId)).toBeResolved();
    expect(mockCloudFileService.uploadFile).toHaveBeenCalledWith(
      testImg,
      "photos/" + childId + ".png"
    );
  });
});
