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
    } else if (days >= 7) {
      const dayOfWeek = notificationTime.toLocaleString("en-US", {
        weekday: "short",
      });
      return dayOfWeek;
    }

    return "";
  }
}
