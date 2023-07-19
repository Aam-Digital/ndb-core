import { Component } from "@angular/core";
import { AlertService } from "./alert.service";

@Component({
  selector: "app-alert-demo",
  template: `
    <button (click)="alertService.addWarning('warn')">warn</button>
    <button (click)="alertService.addDanger('danger')">danger</button>
    <button (click)="alertService.addInfo('info')">info</button>
  `,
})
export class AlertStoriesHelperComponent {
  constructor(public alertService: AlertService) {}
}
