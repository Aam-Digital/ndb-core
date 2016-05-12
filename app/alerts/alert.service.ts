import { Alert } from './alert';

export class AlertService {

    alerts: Alert[] = [];

    addAlert(alert: Alert) {
        this.alerts.push(alert);
        let that = this;
        if (alert.type === Alert.ALERT_SUCCESS ||
            alert.type === Alert.ALERT_INFO) {
            setTimeout(function () {
                that.removeAlert(alert);
            }, 3000);
        } else if (alert.type === Alert.ALERT_WARNING) {
            setTimeout(function () {
                that.removeAlert(alert);
            }, 5000);
        }
    }

    removeAlert(alert: Alert) {
        let index = this.alerts.indexOf(alert, 0);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
    }
}
