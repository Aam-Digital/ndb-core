import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ChildBlockListComponent } from "./child-block-list.component";
import { ChildrenModule } from "../children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { Child } from "../model/child";
import { Note } from "../../notes/model/note";
import { ChildrenService } from "../children.service";
import { of } from "rxjs";

describe("ChildBlockListComponent", () => {
  let component: ChildBlockListComponent;
  let fixture: ComponentFixture<ChildBlockListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [],
        imports: [ChildrenModule, RouterTestingModule],
        providers: [
          {
            provide: ChildrenService,
            useValue: { getChild: () => of(new Child()) },
          },
        ],
      }).compileComponents();
    })
  );

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
    fixture.detectChanges();

    expect(component.children.sort()).toEqual([child1.getId(), child2.getId()]);
  });

  it("should only display count if larger group of children is linked", () => {
    const note = new Note("n1");
    note.addChild("c1");
    note.addChild("c2");
    note.addChild("c3");
    note.addChild("c4");
    note.addChild("c5");
    const config = { entity: note, id: "children" };

    component.onInitFromDynamicConfig(config);
    fixture.detectChanges();

    expect(fixture.nativeElement.innerText).toEqual(
      jasmine.stringMatching(/5 /) // starts with count
    );
  });
});
