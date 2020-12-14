import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { ChildBlockListComponent } from "./child-block-list.component";
import { ChildrenModule } from "../children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { Child } from "../model/child";
import { Note } from "../../notes/model/note";

describe("ChildBlockListComponent", () => {
  let component: ChildBlockListComponent;
  let fixture: ComponentFixture<ChildBlockListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [ChildrenModule, RouterTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set the children correctly", () => {
    const child1 = new Child("c1");
    const child2 = new Child("c2");
    const note = new Note("n1");
    note.addChild(child1.getId());
    note.addChild(child2.getId());
    const config = { entity: note, id: "children" };
    component.onInitFromDynamicConfig(config);
    expect(component.children.sort()).toEqual([child1.getId(), child2.getId()]);
  });
});
