import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { SelectGroupChildrenComponent } from "./select-group-children.component";
import { ChildrenService } from "../children.service";
import { BehaviorSubject } from "rxjs";
import { Child } from "../model/child";
import { ChildrenModule } from "../children.module";
import { RouterTestingModule } from "@angular/router/testing";

describe("SelectGroupChildrenComponent", () => {
  let component: SelectGroupChildrenComponent;
  let fixture: ComponentFixture<SelectGroupChildrenComponent>;

  let mockChildrenService;
  const mockChildrenObservable = new BehaviorSubject([]);

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj(["getChildren"]);
      mockChildrenService.getChildren.and.returnValue(mockChildrenObservable);

      TestBed.configureTestingModule({
        declarations: [SelectGroupChildrenComponent],
        imports: [ChildrenModule, RouterTestingModule],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectGroupChildrenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should extract all centers", () => {
    const mockChildren = [new Child("0"), new Child("1")];
    mockChildren[0].center = "Center A";
    mockChildren[1].center = "Center B";

    mockChildrenObservable.next(mockChildren);

    expect(component.centerFilters.options.length).toBe(3);
  });

  it("should extract all schools of selected center", () => {
    const selectedCenter = "Center A";
    const mockChildren = [
      new Child("0"),
      new Child("1"),
      new Child("2"),
      new Child("3"),
    ];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = "School:1";
    mockChildren[1].center = selectedCenter;
    mockChildren[1].schoolId = "School:2";
    mockChildren[3].center = "other center";
    mockChildren[3].schoolId = "School:3";

    mockChildrenObservable.next(mockChildren);

    component.selectCenterFilter(
      component.centerFilters.options.find((o) => o.label === selectedCenter)
    );

    expect(component.schoolFilters.options.length).toBe(3); // includes default option "all schools"
    expect(component.schoolFilters.options[1].key).toBe("School:1");
    expect(component.schoolFilters.options[2].key).toBe("School:2");
  });

  it("should not list empty filter for undefined schools", () => {
    const selectedCenter = "Center A";
    const mockChildren = [new Child("0"), new Child("1")];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = "School:1";
    mockChildren[1].center = selectedCenter;
    // mockChildren[1].schoolId is not set

    mockChildrenObservable.next(mockChildren);

    component.selectCenterFilter(
      component.centerFilters.options.find((o) => o.label === selectedCenter)
    );

    expect(component.schoolFilters.options.length).toBe(2); // includes default option "all schools"
    expect(component.schoolFilters.options[1].key).toBe("School:1");
  });

  it("should emit selected children correctly filtered by center and school", () => {
    const selectedCenter = "Center A";
    const selectedSchool = "School:1";

    const mockChildren = [new Child("0"), new Child("1"), new Child("2")];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = selectedSchool;
    mockChildren[1].center = selectedCenter;
    // mockChildren[1].schoolId is not set
    mockChildren[2].center = "other center";
    mockChildren[2].schoolId = selectedSchool;

    mockChildrenObservable.next(mockChildren);

    spyOn(component.valueChange, "emit");

    component.selectCenterFilter(
      component.centerFilters.options.find((o) => o.label === selectedCenter)
    );
    component.selectSchoolFilter(
      component.schoolFilters.options.find((o) => o.key === selectedSchool)
    );
    component.confirmSelectedChildren();

    expect(component.valueChange.emit).toHaveBeenCalledWith([mockChildren[0]]);
  });

  it("should emit all children of center for default filter", () => {
    const selectedCenter = "Center A";

    const mockChildren = [new Child("0"), new Child("1"), new Child("2")];
    mockChildren[0].center = selectedCenter;
    mockChildren[0].schoolId = "School:1";
    mockChildren[1].center = selectedCenter;
    // mockChildren[1].schoolId is not set
    mockChildren[2].center = "other center";
    mockChildren[2].schoolId = "School:1";

    mockChildrenObservable.next(mockChildren);

    spyOn(component.valueChange, "emit");

    component.selectCenterFilter(
      component.centerFilters.options.find((o) => o.label === selectedCenter)
    );
    component.selectSchoolFilter(
      component.schoolFilters.options.find((o) => o.key === "all")
    );
    component.confirmSelectedChildren();

    expect(component.valueChange.emit).toHaveBeenCalledWith([
      mockChildren[0],
      mockChildren[1],
    ]);
  });
});
