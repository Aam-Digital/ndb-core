import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayEntityArrayComponent } from "./display-entity-array.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { Note } from "../../../../../child-dev-project/notes/model/note";

describe("DisplayEntityArrayComponent", () => {
  let component: DisplayEntityArrayComponent;
  let fixture: ComponentFixture<DisplayEntityArrayComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockEntityMapper.load.and.resolveTo(new Child());
    await TestBed.configureTestingModule({
      declarations: [DisplayEntityArrayComponent],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayEntityArrayComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({ entity: new Note(), id: "children" });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
