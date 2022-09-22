import { TestBed } from "@angular/core/testing";

import { ChildPhotoService } from "./child-photo.service";
import { Child } from "../model/child";

describe("ChildPhotoService", () => {
  let service: ChildPhotoService;

  const DEFAULT_IMG = "assets/child.png";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [],
    });
    service = TestBed.inject<ChildPhotoService>(ChildPhotoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should getFile default", async () => {
    const testChild = new Child("1");
    const actualImage = await service.getImage(testChild);
    expect(actualImage).toBe(DEFAULT_IMG);
  });
});
