import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayImgComponent } from "./display-img.component";
import { of } from "rxjs";
import { FileService } from "../file.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("DisplayImgComponent", () => {
  let component: DisplayImgComponent;
  let fixture: ComponentFixture<DisplayImgComponent>;
  let mockFileService: any;

  beforeEach(() => {
    mockFileService = {
      loadFile: vi.fn(),
    };
    mockFileService.loadFile.mockReturnValue(of("success"));
    TestBed.configureTestingModule({
      imports: [DisplayImgComponent],
      providers: [{ provide: FileService, useValue: mockFileService }],
    });
    fixture = TestBed.createComponent(DisplayImgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset picture if child has none", () => {
    const withPicture = new TestEntity();
    withPicture["photo"] = "some-picture";
    component.entity = withPicture;
    component.imgProperty = "photo";

    component.ngOnChanges({ entity: undefined });

    expect(mockFileService.loadFile).toHaveBeenCalled();
    expect(component.imgSrc).toBeDefined();

    mockFileService.loadFile.mockClear();
    // without picture
    component.entity = new TestEntity();

    component.ngOnChanges({ entity: undefined });

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(component.imgSrc).toBeUndefined();
  });

  it("should use remote URL directly without calling FileService", () => {
    const entity = new TestEntity();
    entity["photo"] = "https://example.com/logo.png";
    component.entity = entity;
    component.imgProperty = "photo";

    component.ngOnChanges({ entity: undefined });

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(component.imgSrc).toBe("https://example.com/logo.png");
  });

  it("should use FileService for plain filename (not a URL)", () => {
    const entity = new TestEntity();
    entity["photo"] = "logo.png";
    component.entity = entity;
    component.imgProperty = "photo";

    component.ngOnChanges({ entity: undefined });

    expect(mockFileService.loadFile).toHaveBeenCalled();
  });
});
