import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildBlockComponent } from "./child-block.component";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { FileService } from "app/features/file/file.service";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ChildBlockComponent", () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChild",
    ]);
    mockChildrenService.getChild.and.resolveTo(new Child(""));
    mockFileService = jasmine.createSpyObj(["loadFile"]);
    mockFileService.loadFile.and.returnValue(of("success"));

    TestBed.configureTestingModule({
      imports: [ChildBlockComponent, FontAwesomeTestingModule],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockComponent);
    component = fixture.componentInstance;
    component.entity = new Child("");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset picture if child has none", async () => {
    const withPicture = new Child();
    withPicture.photo = "some-picture";
    component.entity = withPicture;

    await component.ngOnChanges({ entity: undefined });

    expect(mockFileService.loadFile).toHaveBeenCalled();
    expect(component.imgPath).toBeDefined();

    mockFileService.loadFile.calls.reset();
    // without picture
    component.entity = new Child();

    await component.ngOnChanges({ entity: undefined });

    expect(mockFileService.loadFile).not.toHaveBeenCalled();
    expect(component.imgPath).toBeUndefined();
  });
});
