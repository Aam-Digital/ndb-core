import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ListClassComponent } from "./list-class.component";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { ChildrenService } from "../../children.service";
import { DatabaseIndexingService } from "../../../../core/entity/database-indexing/database-indexing.service";
import { ChildPhotoService } from "../../child-photo-service/child-photo.service";

describe("ListClassComponent", () => {
  let component: ListClassComponent;
  let fixture: ComponentFixture<ListClassComponent>;

  beforeEach(async(() => {
    const photoMock: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
      "photoMock",
      ["getImage"]
    );
    TestBed.configureTestingModule({
      declarations: [ListClassComponent],
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
    fixture = TestBed.createComponent(ListClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
