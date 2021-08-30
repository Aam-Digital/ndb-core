import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { UserListComponent } from "./user-list.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { AdminModule } from "../admin.module";
import { User } from "../../user/user";

describe("UserListComponent", () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let testUsers: User[];

  beforeEach(
    waitForAsync(() => {
      testUsers = [new User("1"), new User("2")];
      mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", [
        "loadType",
        "save",
      ]);
      mockEntityMapper.loadType.and.returnValue(Promise.resolve(testUsers));

      TestBed.configureTestingModule({
        imports: [AdminModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
