import { Component, OnInit } from '@angular/core';
import { MenuItem } from '../menu-item';
import { SessionService } from '../../session/session.service';
import { NavigationItemsService } from '../navigation-items.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {

  public menu_main: MenuItem[];

  constructor(private _sessionService: SessionService,
              private _navigationItemService: NavigationItemsService) {

    this.menu_main = this._navigationItemService.getMenuItems();
  }

  ngOnInit(): void {
  }

  logout() {
    this._sessionService.logout();
  }

}
