import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MenuItemListEditorComponent } from "./menu-item-list-editor.component";
import { MatDialog } from "@angular/material/dialog";
import { MenuItemForAdminUi } from "../../admin/admin-menu/menu-item-for-admin-ui";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of } from "rxjs";

describe("MenuItemListEditorComponent", () => {
  let component: MenuItemListEditorComponent;
  let fixture: ComponentFixture<MenuItemListEditorComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    await TestBed.configureTestingModule({
      imports: [
        MenuItemListEditorComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuItemListEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add a new item when dialog returns result", () => {
    // Arrange
    const mockResult = {
      label: "Test Item",
      icon: "user",
      link: "/test",
    };
    const mockDialogRef = {
      afterClosed: () => of(mockResult),
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);
    spyOn(component.itemsChange, "emit");

    // Act
    component.items = [];
    component.addNewMenuItem();

    // Assert
    expect(component.items.length).toBe(1);
    expect(component.items[0].label).toBe("Test Item");
    expect(component.items[0].uniqueId).toBeDefined();
    expect(component.items[0].subMenu).toEqual([]);
    expect(component.itemsChange.emit).toHaveBeenCalledWith(jasmine.any(Array));
  });

  it("should not add item when dialog is cancelled", () => {
    // Arrange
    const mockDialogRef = {
      afterClosed: () => of(null),
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);
    spyOn(component.itemsChange, "emit");

    // Act
    component.items = [];
    component.addNewMenuItem();

    // Assert
    expect(component.items.length).toBe(0);
    expect(component.itemsChange.emit).not.toHaveBeenCalled();
  });

  it("should remove an item and emit changes", () => {
    // Arrange
    const item: MenuItemForAdminUi = {
      label: "Test Item",
      icon: "user",
      link: "/test",
      uniqueId: "test-id",
      subMenu: [],
    };
    const secondItem: MenuItemForAdminUi = {
      label: "Second Item",
      icon: "home",
      link: "/home",
      uniqueId: "second-id",
      subMenu: [],
    };
    component.items = [item, secondItem];
    spyOn(component.itemsChange, "emit");

    // Act
    component.removeItem(item);

    // Assert
    expect(component.items.length).toBe(1);
    expect(component.items[0]).toBe(secondItem);
    expect(component.itemsChange.emit).toHaveBeenCalledWith([secondItem]);
  });

  it("should convert entity menu item to plain format with toPlainMenuItem", () => {
    // Arrange
    const entityItem: MenuItemForAdminUi & { entityType: string } = {
      entityType: "Child",
      label: "Child",
      uniqueId: "test-id",
      subMenu: [],
    };

    // Act
    const result = MenuItemListEditorComponent.toPlainMenuItem(entityItem);

    // Assert
    expect(result).toEqual(
      jasmine.objectContaining({
        entityType: "Child",
      }),
    );
  });

  it("should convert regular menu item to plain format with toPlainMenuItem", () => {
    // Arrange
    const regularItem: MenuItemForAdminUi = {
      label: "Test Item",
      icon: "user",
      link: "/test",
      uniqueId: "test-id",
      subMenu: [],
    };

    // Act
    const result = MenuItemListEditorComponent.toPlainMenuItem(regularItem);

    // Assert
    expect(result).toEqual({
      label: "Test Item",
      icon: "user",
      link: "/test",
      subMenu: undefined,
    });
  });

  it("should convert menu item with subMenu to plain format with toPlainMenuItem", () => {
    // Arrange
    const itemWithSubMenu: MenuItemForAdminUi = {
      label: "Parent Item",
      icon: "folder",
      link: "/parent",
      uniqueId: "parent-id",
      subMenu: [
        {
          label: "Child Item",
          icon: "file",
          link: "/child",
          uniqueId: "child-id",
          subMenu: [],
        },
      ],
    };

    // Act
    const result = MenuItemListEditorComponent.toPlainMenuItem(itemWithSubMenu);

    // Assert
    expect(result).toEqual({
      label: "Parent Item",
      icon: "folder",
      link: "/parent",
      subMenu: [
        {
          label: "Child Item",
          icon: "file",
          link: "/child",
          subMenu: undefined,
        },
      ],
    });
  });

  it("should return null for entity item when forceLinkOnly is true in toPlainMenuItem", () => {
    // Arrange
    const entityItem: MenuItemForAdminUi & { entityType: string } = {
      entityType: "Child",
      label: "Child",
      uniqueId: "test-id",
      subMenu: [],
    };

    // Act
    const result = MenuItemListEditorComponent.toPlainMenuItem(entityItem, {
      forceLinkOnly: true,
    });

    // Assert
    expect(result).toBeNull();
  });

  it("should remove subMenu when forceLinkOnly is true in toPlainMenuItem", () => {
    // Arrange
    const itemWithSubMenu: MenuItemForAdminUi = {
      label: "Parent Item",
      icon: "folder",
      link: "/parent",
      uniqueId: "parent-id",
      subMenu: [
        {
          label: "Child Item",
          icon: "file",
          link: "/child",
          uniqueId: "child-id",
          subMenu: [],
        },
      ],
    };

    // Act
    const result = MenuItemListEditorComponent.toPlainMenuItem(
      itemWithSubMenu,
      {
        forceLinkOnly: true,
      },
    );

    // Assert
    expect(result).toEqual({
      label: "Parent Item",
      icon: "folder",
      link: "/parent",
      subMenu: undefined,
    });
  });

  it("should convert plain menu items to admin UI format with fromPlainMenuItems", () => {
    // Arrange
    const plainItems = [
      {
        label: "Test Item",
        icon: "user",
        link: "/test",
      },
      {
        label: "Entity Item",
        entityType: "Child",
      } as any, // Cast to handle EntityMenuItem type
    ];

    // Act
    const result = MenuItemListEditorComponent.fromPlainMenuItems(plainItems);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(
      jasmine.objectContaining({
        label: "Test Item",
        icon: "user",
        link: "/test",
        uniqueId: jasmine.any(String),
        subMenu: [],
      }),
    );
    expect(result[1]).toEqual(
      jasmine.objectContaining({
        label: "Entity Item",
        entityType: "Child",
        uniqueId: jasmine.any(String),
        subMenu: [],
      }),
    );
  });

  it("should preserve subMenu structure when allowSubMenu is true in fromPlainMenuItems", () => {
    // Arrange
    const plainItems = [
      {
        label: "Parent Item",
        icon: "folder",
        link: "/parent",
        subMenu: [
          {
            label: "Child Item",
            icon: "file",
            link: "/child",
          },
        ],
      },
    ];

    // Act
    const result = MenuItemListEditorComponent.fromPlainMenuItems(
      plainItems,
      true,
    );

    // Assert
    expect(result[0].subMenu?.length).toBe(1);
    expect(result[0].subMenu?.[0]).toEqual(
      jasmine.objectContaining({
        label: "Child Item",
        icon: "file",
        link: "/child",
        uniqueId: jasmine.any(String),
      }),
    );
  });

  it("should clear subMenu when allowSubMenu is false in fromPlainMenuItems", () => {
    // Arrange
    const plainItems = [
      {
        label: "Parent Item",
        icon: "folder",
        link: "/parent",
        subMenu: [
          {
            label: "Child Item",
            icon: "file",
            link: "/child",
          },
        ],
      },
    ];

    // Act
    const result = MenuItemListEditorComponent.fromPlainMenuItems(
      plainItems,
      false,
    );

    // Assert
    expect(result[0].subMenu).toEqual([]);
  });
});
