import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";

import { AdminEntityDetailsComponent } from "./admin-entity-details.component";
import { EntityDetailsConfig } from "../../../entity-details/EntityDetailsConfig";
import { Entity } from "../../../entity/model/entity";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("AdminEntityDetailsComponent", () => {
  let component: AdminEntityDetailsComponent;
  let fixture: ComponentFixture<AdminEntityDetailsComponent>;

  let viewConfig: EntityDetailsConfig;
  let mockDialog: any;

  @DatabaseEntity("AdminDetailsTest")
  class AdminDetailsTestEntity extends Entity {
    static override readonly ENTITY_TYPE = "AdminDetailsTest";

    @DatabaseField({ label: "Name" })
    name: string;
  }

  beforeEach(() => {
    viewConfig = {
      entityType: AdminDetailsTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }],
    };
    mockDialog = {
      open: vi.fn().mockName("MatDialog.open"),
    };

    TestBed.configureTestingModule({
      imports: [AdminEntityDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        SyncStateSubject,
      ],
    }).overrideComponent(AdminEntityDetailsComponent, {
      set: {
        providers: [{ provide: MatDialog, useValue: mockDialog }],
      },
    });
    fixture = TestBed.createComponent(AdminEntityDetailsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entityConstructor", AdminDetailsTestEntity);
    fixture.componentRef.setInput(
      "config",
      JSON.parse(JSON.stringify(viewConfig)),
    );

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
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(defaultConfig),
    } as any);

    component.addComponent(component.panels()[0]);

    expect(component.panels()[0].components.length).toBe(1);
    expect(component.panels()[0].components[0]).toEqual(defaultConfig);
  });

  it("should sync panels changes back to config object", () => {
    const defaultConfig = {
      title: "New Section",
      component: "Form",
      config: { fieldGroups: [] },
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(defaultConfig),
    } as any);

    component.addComponent(component.panels()[0]);
    TestBed.flushEffects();

    expect(component.config().panels[0].components[0]).toEqual(defaultConfig);
  });
});
