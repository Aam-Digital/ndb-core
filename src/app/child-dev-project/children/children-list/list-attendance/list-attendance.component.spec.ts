import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ListAttendanceComponent } from "./list-attendance.component";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { ChildrenService } from "../../children.service";
import { DatabaseIndexingService } from "../../../../core/entity/database-indexing/database-indexing.service";
import { CloudFileService } from "../../../../core/webdav/cloud-file-service.service";
import { ChildPhotoService } from "../../child-photo-service/child-photo.service";
import { FilterPipeModule } from "ngx-filter-pipe";

describe("ListAttendanceComponent", () => {
  let component: ListAttendanceComponent;
  let fixture: ComponentFixture<ListAttendanceComponent>;

  beforeEach(async(() => {
    const photoMock: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
      "photoMock",
      ["getImage"]
    );
    TestBed.configureTestingModule({
      declarations: [ListAttendanceComponent],
      imports: [FilterPipeModule],
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
    fixture = TestBed.createComponent(ListAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
