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
});
