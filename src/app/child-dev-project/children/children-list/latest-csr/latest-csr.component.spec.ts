import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { LatestCsrComponent } from "./latest-csr.component";
import { ChildPhotoService } from "../../child-photo-service/child-photo.service";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { ChildrenService } from "../../children.service";
import { DatabaseIndexingService } from "../../../../core/entity/database-indexing/database-indexing.service";
import { Child } from "../../model/child";
import { ChildSchoolRelation } from "../../model/childSchoolRelation";
import { SimpleChange } from "@angular/core";

describe("LatestCsrComponent", () => {
  let component: LatestCsrComponent;
  let fixture: ComponentFixture<LatestCsrComponent>;

  beforeEach(async(() => {
    const photoMock: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
      "photoMock",
      ["getImage"]
    );
    TestBed.configureTestingModule({
      declarations: [LatestCsrComponent],
      providers: [
        { provide: Database, useClass: MockDatabase },
        EntityMapperService,
        EntitySchemaService,
        ChildrenService,
        DatabaseIndexingService,
        { provide: ChildPhotoService, useValue: photoMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestCsrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load and set the ChildSchoolRelation for the child", (done) => {
    const childrenService = fixture.debugElement.injector.get(ChildrenService);
    const testChild = new Child("testID");
    const testRel = new ChildSchoolRelation("relationID");
    testRel.schoolId = "schoolID";
    testRel.schoolClass = "1";
    spyOn(childrenService, "queryLatestRelation").and.returnValue(
      Promise.resolve(testRel)
    );
    component.child = testChild;
    component.ngOnChanges({
      child: new SimpleChange(undefined, testChild, false),
    });
    expect(childrenService.queryLatestRelation).toHaveBeenCalledWith(
      testChild.getId()
    );
    setTimeout(() => {
      expect(component.relation).toEqual(testRel);
      expect(testChild["schoolId"]).toEqual(testRel.schoolId);
      expect(testChild["schoolClass"]).toEqual(testRel.schoolClass);
      done();
    });
  });
});
