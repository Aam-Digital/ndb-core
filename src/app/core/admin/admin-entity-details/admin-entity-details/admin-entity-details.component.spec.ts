import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

import { AdminEntityDetailsComponent } from "./admin-entity-details.component";
import { EntityDetailsConfig } from "../../../entity-details/EntityDetailsConfig";
import { Entity } from "../../../entity/model/entity";
import { MatTabsModule } from "@angular/material/tabs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";

describe("AdminEntityDetailsComponent", () => {
  let component: AdminEntityDetailsComponent;
  let fixture: ComponentFixture<AdminEntityDetailsComponent>;

  let viewConfig: EntityDetailsConfig;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  @DatabaseEntity("AdminDetailsTest")
  class AdminDetailsTestEntity extends Entity {
    static override readonly ENTITY_TYPE = "AdminDetailsTest";

    @DatabaseField({ label: "Name" }) name: string;
  }

  beforeEach(() => {
    viewConfig = {
      entityType: AdminDetailsTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }],
    };
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    TestBed.configureTestingModule({
      imports: [
        AdminEntityDetailsComponent,
        MatTabsModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        SyncStateSubject,
        CurrentUserSubject,
      ],
    }).overrideComponent(AdminEntityDetailsComponent, {
      set: {
        providers: [{ provide: MatDialog, useValue: mockDialog }],
      },
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

  it("should add new Default Section to config", () => {
    const defaultConfig = {
      title: "New Section",
      component: "Form",
      config: { fieldGroups: [] },
    };
    mockDialog.open.and.returnValue({
      afterClosed: () => of(defaultConfig),
    } as any);

    component.addComponent(component.config.panels[0]);

    expect(component.config.panels[0].components.length).toBe(1);
    expect(component.config.panels[0].components[0]).toEqual(defaultConfig);
  });
});
