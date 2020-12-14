import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivityListComponent } from "./activity-list.component";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";

describe("ActivityListComponent", () => {
  let component: ActivityListComponent;
  let fixture: ComponentFixture<ActivityListComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", ["loadType"]);
    mockEntityService.loadType.and.resolveTo([]);

    TestBed.configureTestingModule({
      declarations: [ActivityListComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
