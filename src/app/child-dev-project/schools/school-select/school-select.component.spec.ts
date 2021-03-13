import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { SchoolSelectComponent } from "./school-select.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SchoolsModule } from "../schools.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { School } from "../model/school";
import { SimpleChange } from "@angular/core";

describe("SchoolSelectComponent", () => {
  let component: SchoolSelectComponent;
  let fixture: ComponentFixture<SchoolSelectComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);
    await TestBed.configureTestingModule({
      declarations: [SchoolSelectComponent],
      imports: [SchoolsModule, NoopAnimationsModule],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should update the input array when selecting and unselecting elements", fakeAsync(() => {
    const school1 = new School("1");
    const school2 = new School("2");
    const school3 = new School("3");
    mockEntityMapper.loadType.and.resolveTo([school1, school2, school3]);
    component.selectedSchoolIds = [school2.getId()];
    component.ngOnChanges({
      selectedSchoolIds: new SimpleChange(null, [], false),
    });
    const eventEmitterSpy = spyOn(component.selectedSchoolIdsChange, "emit");
    tick();
    expect(component.notSelectedSchools).toEqual(
      jasmine.arrayWithExactContents([school1, school3])
    );
    expect(component.selectedSchools).toEqual(
      jasmine.arrayWithExactContents([school2])
    );
    expect(component.selectedSchoolIds).toEqual(
      jasmine.arrayWithExactContents([school2.getId()])
    );

    component.selectSchool(school1);

    expect(component.notSelectedSchools).toEqual(
      jasmine.arrayWithExactContents([school3])
    );
    expect(component.selectedSchools).toEqual(
      jasmine.arrayWithExactContents([school1, school2])
    );
    expect(component.selectedSchoolIds).toEqual(
      jasmine.arrayWithExactContents([school1.getId(), school2.getId()])
    );
    expect(eventEmitterSpy).toHaveBeenCalledWith(
      jasmine.arrayWithExactContents([school1.getId(), school2.getId()])
    );

    component.unselectSchool(school2);

    expect(component.notSelectedSchools).toEqual(
      jasmine.arrayWithExactContents([school3, school2])
    );
    expect(component.selectedSchools).toEqual(
      jasmine.arrayWithExactContents([school1])
    );
    expect(component.selectedSchoolIds).toEqual(
      jasmine.arrayWithExactContents([school1.getId()])
    );
    expect(eventEmitterSpy).toHaveBeenCalledWith([school1.getId()]);
  }));

  it("should search the schools by name", () => {
    const school1 = new School();
    school1.name = "matching name";
    const school2 = new School();
    school2.name = "wrong name";
    component.notSelectedSchools = [school1, school2];

    component.searchText = "matching";
    component.search();

    expect(component.suggestions).toEqual([school1]);
  });
});
