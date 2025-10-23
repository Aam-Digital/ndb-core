import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, NgControl } from "@angular/forms";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../../demo-data/create-entity-of-type";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { LoginState } from "../../../session/session-states/login-state.enum";
import { EditEntityComponent } from "./edit-entity.component";

describe("EditEntityComponent", () => {
  let component: EditEntityComponent;
  let fixture: ComponentFixture<EditEntityComponent<any>>;
  let test1Entities: TestEntity[];
  let test2Entities: Test2Entity[];
  let formControl: FormControl;

  @DatabaseEntity("Test2Entity")
  class Test2Entity extends TestEntity {}

  beforeEach(() => {
    formControl = new FormControl();

    test1Entities = ["Abc", "Bcd", "Abd", "Aba"].map((s) => {
      return new TestEntity(s);
    });
    test2Entities = [new Test2Entity(), new Test2Entity()];
    const otherEntities: Entity[] = [createEntityOfType("OtherEntityType")];

    TestBed.configureTestingModule({
      imports: [
        EditEntityComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          ...test1Entities,
          ...test2Entities,
          ...otherEntities,
        ]),
      ],
      providers: [{ provide: NgControl, useValue: { control: formControl } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntityComponent);
    component = fixture.componentInstance;

    //setupCustomFormControlEditComponent(component, "testProperty", {
    //  additional: TestEntity.ENTITY_TYPE,
    //});
    //component.ngControl = { control: formControl } as any;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
