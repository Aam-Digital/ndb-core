import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  Input,
  signal,
} from "@angular/core";

import { UntypedFormControl } from "@angular/forms";
import { KeyValuePipe } from "@angular/common";
import { merge, Subscription } from "rxjs";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-error-hint",
  templateUrl: "./error-hint.component.html",
  styleUrls: ["./error-hint.component.scss"],
  imports: [KeyValuePipe],
})
export class ErrorHintComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formSignal = signal<UntypedFormControl | undefined>(
    undefined,
  );

  @Input() set form(form: UntypedFormControl) {
    this.formSignal.set(form);
    this.cdr.markForCheck();
  }

  get form(): UntypedFormControl | undefined {
    return this.formSignal();
  }

  constructor() {
    effect((onCleanup) => {
      const form = this.formSignal();
      if (!form) {
        return;
      }

      const sub: Subscription = merge(
        form.valueChanges,
        form.statusChanges,
      ).subscribe(() => this.cdr.markForCheck());
      onCleanup(() => sub.unsubscribe());
    });
  }
}
