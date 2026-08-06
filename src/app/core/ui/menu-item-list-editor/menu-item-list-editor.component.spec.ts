import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { MenuItemListEditorComponent } from "./menu-item-list-editor.component";
import { MatDialog } from "@angular/material/dialog";
import { MenuItemForAdminUi } from "../../admin/admin-menu/menu-item-for-admin-ui";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of } from "rxjs";
import type { Mock } from "vitest";
import { EntityMenuItem } from "../../ui/navigation/menu-item";

type MatDialogMock = Pick<MatDialog, "open"> & {
  open: Mock;
};

type DialogRefMock = {
  afterClosed: () => ReturnType<typeof of>;
};

describe("MenuItemListEditorComponent", () => {
  let component: MenuItemListEditorComponent;
  let fixture: ComponentFixture<MenuItemListEditorComponent>;
  let mockDialog: MatDialogMock;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockName("MatDialog.open"),
    };
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
    mockDialog.open.mockReturnValue(mockDialogRef as DialogRefMock);
    const emittedValues: MenuItemForAdminUi[][] = [];
    component.items.subscribe((val) => emittedValues.push(val));

    // Act
    component.items.set([]);
    component.addNewMenuItem();

    // Assert
    const items = component.items();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe("Test Item");
    expect(items[0].uniqueId).toBeDefined();
    expect(items[0].subMenu).toEqual([]);
    expect(emittedValues.length).toBeGreaterThan(0);
  });

  it("should not add item when dialog is cancelled", () => {
    // Arrange
    const mockDialogRef = {
      afterClosed: () => of(null),
    };
    mockDialog.open.mockReturnValue(mockDialogRef as DialogRefMock);
    const emittedValues: MenuItemForAdminUi[][] = [];
    component.items.subscribe((val) => emittedValues.push(val));

    // Act
    component.items.set([]);
    emittedValues.length = 0; // reset after set()
    component.addNewMenuItem();

    // Assert
    expect(component.items().length).toBe(0);
    expect(emittedValues.length).toBe(0);
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
    component.items.set([item, secondItem]);
    const emittedValues: MenuItemForAdminUi[][] = [];
    component.items.subscribe((val) => emittedValues.push(val));

    // Act
    component.removeItem(0);

    // Assert
    expect(component.items()).toEqual([secondItem]);
    expect(emittedValues).toEqual([[secondItem]]);
  });

  describe("drag & drop of the flat, indented list", () => {
    /** a menu item with the given id and (optional) sub-items */
    const menuItem = (
      uniqueId: string,
      subMenu: MenuItemForAdminUi[] = [],
    ): MenuItemForAdminUi => ({ uniqueId, label: uniqueId, subMenu });

    /** simulate a drop, `draggedLevels` being how far the item was dragged sideways */
    const drop = (
      previousIndex: number,
      currentIndex: number,
      draggedLevels = 0,
    ) =>
      component.onDrop({
        previousIndex,
        currentIndex,
        distance: { x: draggedLevels * component.indentPerLevel, y: 0 },
      } as CdkDragDrop<unknown>);

    it("flattens nested items into indented rows", () => {
      component.items.set([menuItem("a", [menuItem("a1")]), menuItem("b")]);

      expect(component.rows().map((r) => [r.id, r.level])).toEqual([
        ["a", 0],
        ["a1", 1],
        ["b", 0],
      ]);
      expect(component.hasSubItems(0)).toBe(true);
      expect(component.hasSubItems(1)).toBe(false);
    });

    it("moves an item together with its sub-items", () => {
      component.items.set([menuItem("a", [menuItem("a1")]), menuItem("b")]);

      drop(0, 2); // drag "a" to the end; cdk counts the dragged row only

      expect(component.items()).toEqual([
        menuItem("b"),
        menuItem("a", [menuItem("a1")]),
      ]);
    });

    it("nests an item into the item above when dragged to the right", () => {
      component.items.set([menuItem("a"), menuItem("b")]);

      drop(1, 1, 1);

      expect(component.items()).toEqual([menuItem("a", [menuItem("b")])]);
    });

    it("does not re-nest on slight sideways drift while dragging", () => {
      component.items.set([menuItem("a"), menuItem("b")]);

      component.onDrop({
        previousIndex: 1,
        currentIndex: 1,
        distance: { x: component.indentPerLevel / 2, y: 0 },
      } as CdkDragDrop<unknown>);

      expect(component.items()).toEqual([menuItem("a"), menuItem("b")]);
    });

    it("lifts a sub-item out of its parent when dragged to the left", () => {
      component.items.set([menuItem("a", [menuItem("a1")])]);

      drop(1, 1, -1);

      expect(component.items()).toEqual([menuItem("a"), menuItem("a1")]);
    });

    it("does not nest items when sub-menus are not allowed", () => {
      fixture.componentRef.setInput("allowSubMenu", false);
      component.items.set([menuItem("a"), menuItem("b")]);

      drop(1, 1, 1);

      expect(component.items()).toEqual([menuItem("a"), menuItem("b")]);
    });

    it("removes an item together with its sub-items", () => {
      component.items.set([menuItem("a", [menuItem("a1")]), menuItem("b")]);

      component.removeItem(0);

      expect(component.items()).toEqual([menuItem("b")]);
    });

    it("keeps the sub-items when an item itself is edited", () => {
      component.items.set([menuItem("a", [menuItem("a1")])]);

      // the edit dialog returns the item without its (separately rendered) sub-items
      component.onItemChange({ ...menuItem("a"), label: "renamed" }, 0);

      expect(component.items()).toEqual([
        { ...menuItem("a", [menuItem("a1")]), label: "renamed" },
      ]);
    });
  });

  it("should convert entity menu item to plain format with toPlainMenuItem", () => {
    // Arrange
    const entityItem: MenuItemForAdminUi & {
      entityType: string;
    } = {
      entityType: "Child",
      label: "Child",
      uniqueId: "test-id",
      subMenu: [],
    };

    // Act
    const result = MenuItemListEditorComponent.toPlainMenuItem(entityItem);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
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
    const entityItem: MenuItemForAdminUi & {
      entityType: string;
    } = {
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
      } satisfies EntityMenuItem,
    ];

    // Act
    const result = MenuItemListEditorComponent.fromPlainMenuItems(plainItems);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        label: "Test Item",
        icon: "user",
        link: "/test",
        uniqueId: expect.any(String),
        subMenu: [],
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        label: "Entity Item",
        entityType: "Child",
        uniqueId: expect.any(String),
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
      expect.objectContaining({
        label: "Child Item",
        icon: "file",
        link: "/child",
        uniqueId: expect.any(String),
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
