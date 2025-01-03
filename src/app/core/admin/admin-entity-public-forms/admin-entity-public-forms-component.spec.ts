import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminEntityPublicFormsComponent } from "./admin-entity-public-forms-component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("AdminEntityPublicFormsComponent", () => {
  let component: AdminEntityPublicFormsComponent;
  let fixture: ComponentFixture<AdminEntityPublicFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminEntityPublicFormsComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityPublicFormsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestEntity;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });
});
