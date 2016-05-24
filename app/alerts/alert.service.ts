import { Alert } from './alert';

export class AlertService {

    alerts: Alert[] = [];

    addAlert(alert: Alert) {
        this.alerts.push(alert);
        this.setAutoRemoveTimeout(alert);
    }

    private setAutoRemoveTimeout(alert: Alert) {
        if (alert.type === Alert.SUCCESS ||
                alert.type === Alert.INFO) {
            setTimeout(( () => this.removeAlert(alert) ), 5000);
        }
    }

    removeAlert(alert: Alert) {
        let index = this.alerts.indexOf(alert, 0);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
    }
}
