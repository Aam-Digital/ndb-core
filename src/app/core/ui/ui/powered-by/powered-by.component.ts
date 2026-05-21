import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * Small "Powered by Aam Digital" branding shown in the sidebar footer.
 */
@Component({
  selector: "app-powered-by",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./powered-by.component.html",
  styleUrl: "./powered-by.component.scss",
})
export class PoweredByComponent {}
