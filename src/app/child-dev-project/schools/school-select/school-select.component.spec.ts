import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SchoolSelectComponent } from "./school-select.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SchoolsModule } from "../schools.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

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
});
