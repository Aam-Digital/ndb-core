/**
 * Converts a timestamp into a human-readable time format,
 * such as "Just Now", "5m", "2h", "Yesterday", "3d", or "Jan 2024".
 */
import { OnDestroy, Pipe, PipeTransform } from "@angular/core";
import { Observable, Subject, timer } from "rxjs";
import { map, shareReplay, takeUntil } from "rxjs/operators";

@Pipe({
  name: "notificationTime",
  standalone: true,
})
export class NotificationTimePipe implements PipeTransform, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly timeUpdate$ = timer(0, 60000).pipe(
    map(() => new Date()),
    shareReplay(1),
    takeUntil(this.destroy$),
  );

  transform(value: any): Observable<string> {
    return this.timeUpdate$.pipe(
      map((currentTime) => this.formatTime(value, currentTime)),
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private formatTime(value: any, currentTime: Date): string {
    if (!value) return "";

    const notificationTime = new Date(value);
    if (
      !(notificationTime instanceof Date) ||
      isNaN(notificationTime.getTime())
    ) {
      return "";
    }

    const timeDifference = currentTime.getTime() - notificationTime.getTime();
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return $localize`Just Now`;
    } else if (minutes < 60) {
      return $localize`${minutes}m`;
    } else if (hours < 24) {
      return $localize`${hours}h ago`;
    } else if (days === 1) {
      return $localize`Yesterday`;
    } else if (days < 7) {
      return $localize`${days}d ago`;
    } else if (days >= 7 && days < 30) {
      return $localize`${days}d ago`;
    } else {
      const monthYear = notificationTime.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      return monthYear;
    }
  }
}
