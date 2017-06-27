import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { SessionService } from '../../session/session.service';
import { NavigationItemsService } from '../../navigation/navigation-items.service';
import { MenuItem } from '../../navigation/menu-item';

@Component({
  moduleId: module.id,
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css']
})
export class UiComponent implements OnInit {

  title = 'NDB';
  viewContainerRef: ViewContainerRef;

  constructor(private _sessionService: SessionService,
              viewContainerRef: ViewContainerRef,
              private _navigationItemsService: NavigationItemsService) {
    this.viewContainerRef = viewContainerRef;

    const menuItems = [
      new MenuItem('Dashboard', 'home', ['/']),
      new MenuItem('Test', 'child', ['/'])
    ];
    _navigationItemsService.setMenuItems(menuItems);
  }

  ngOnInit(): void {
  }

  isLoggedIn() {
    return this._sessionService.isLoggedIn();
  }

}
