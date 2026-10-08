import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { EmailClientService } from "#src/app/features/email-client/email-client.service";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayEmail")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-email",
  template: `<a
    class="clickable"
    [href]="'mailto:' + value()"
    (click)="openEmailDialog($event)"
    >{{ value() }}</a
  >`,
})
export class DisplayEmailComponent extends ViewDirective<string> {
  private readonly emailClientService = inject(EmailClientService);

  /**
   * Open the email dialog for the current entity instead of directly
   * triggering the browser's default mailto handling.
   */
  openEmailDialog(event: Event) {
    const entity = this.entity();
    if (!entity) {
      // fall back to the default mailto link behavior
      return;
    }

    event.preventDefault();
    this.emailClientService.executeMailto(entity);
  }
}
