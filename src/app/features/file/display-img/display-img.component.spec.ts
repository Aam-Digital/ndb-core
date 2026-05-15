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

  it("should reset picture if child has none", async () => {
    const withPicture = new TestEntity();
    withPicture["photo"] = "some-picture";
    fixture.componentRef.setInput("entity", withPicture);
    fixture.componentRef.setInput("imgProperty", "photo");
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockFileService.loadFile).toHaveBeenCalled();
    expect(component.imgSrc.value()).toBeDefined();

    mockFileService.loadFile.mockClear();
    // without picture
    fixture.componentRef.setInput("entity", new TestEntity());
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(component.imgSrc.value()).toBeUndefined();
  });

  it("should use remote URL directly without calling FileService", async () => {
    const entity = new TestEntity();
    entity["photo"] = "https://example.com/logo.png";
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("imgProperty", "photo");
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(component.imgSrc.value()).toBe("https://example.com/logo.png");
  });

  it("should use FileService for plain filename (not a URL)", () => {
    const entity = new TestEntity();
    entity["photo"] = "logo.png";
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("imgProperty", "photo");
    fixture.detectChanges();

    expect(mockFileService.loadFile).toHaveBeenCalled();
  });
});
