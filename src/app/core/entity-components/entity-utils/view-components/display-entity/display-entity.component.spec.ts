import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayEntityComponent } from "./display-entity.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Child } from "../../../../../child-dev-project/children/model/child";

describe("DisplayEntityComponent", () => {
  let component: DisplayEntityComponent;
  let fixture: ComponentFixture<DisplayEntityComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockEntityMapper.load.and.resolveTo(new Child());
    await TestBed.configureTestingModule({
      declarations: [DisplayEntityComponent],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
