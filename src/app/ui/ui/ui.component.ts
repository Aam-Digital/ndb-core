import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css']
})
export class UiComponent implements OnInit {

  ngOnInit(): void {
  }

  /* TODO
   title = 'NDB';
   viewContainerRef: ViewContainerRef;

   constructor(private _sessionService: SessionService,
   viewContainerRef: ViewContainerRef,
   private _navigationItemsService: NavigationItemsService) {
   this.viewContainerRef = viewContainerRef;

   let menuItems = [
   new MenuItem('Dashboard', 'home', ['/']),
   new MenuItem('Test', 'child', ['/'])
   ];
   _navigationItemsService.setMenuItems(menuItems);
   }

   isLoggedIn() {
   return this._sessionService.isLoggedIn();
   }*/

}
