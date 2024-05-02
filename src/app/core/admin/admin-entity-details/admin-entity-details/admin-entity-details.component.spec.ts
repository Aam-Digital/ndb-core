import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityDetailsComponent } from "./admin-entity-details.component";
import { EntityDetailsConfig } from "../../../entity-details/EntityDetailsConfig";
import { Entity } from "../../../entity/model/entity";
import { MatTabsModule } from "@angular/material/tabs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminEntityDetailsComponent", () => {
  let component: AdminEntityDetailsComponent;
  let fixture: ComponentFixture<AdminEntityDetailsComponent>;

  let viewConfig: EntityDetailsConfig;
  let viewConfigId, entityConfigId;

  @DatabaseEntity("AdminDetailsTest")
  class AdminDetailsTestEntity extends Entity {
    static readonly ENTITY_TYPE = "AdminDetailsTest";

    @DatabaseField({ label: "Name" }) name: string;
  }

  beforeEach(() => {
    viewConfigId = `view:${AdminDetailsTestEntity.route.substring(1)}/:id`;
    entityConfigId = `entity:${AdminDetailsTestEntity.ENTITY_TYPE}`;
    viewConfig = {
      entityType: AdminDetailsTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }],
    };

    TestBed.configureTestingModule({
      imports: [
        AdminEntityDetailsComponent,
        MatTabsModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    });
    fixture = TestBed.createComponent(AdminEntityDetailsComponent);
    component = fixture.componentInstance;

    component.entityConstructor = AdminDetailsTestEntity;
    component.config = JSON.parse(JSON.stringify(viewConfig));

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add new section (component in panel) to config", () => {
    component.addComponent(component.config.panels[0]);

    expect(component.config.panels[0].components.length).toBe(1);
  });
});
