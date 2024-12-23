/**
 * Converts a timestamp into a human-readable time format,
 * such as "Just Now", "5m", "2h", "Yesterday", "3d", or "Jan 2024".
 */
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "NotificationTime",
  standalone: true,
})
export class NotificationTimePipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return "";

    const currentTime = new Date();
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
      return "Just Now";
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days}d`;
    } else if (days >= 7 && days < 30) {
      return `${days}d`;
    } else {
      const monthYear = notificationTime.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      return monthYear;
    }
  }
}
