import {Alert} from './alert';

export class AlertService {

    alerts: Alert[] = [];

    addAlert(alert: Alert) {
        this.alerts.push(alert);
        this.setAutoRemoveTimeout(alert);
    }

    removeAlert(alert: Alert) {
        let index = this.alerts.indexOf(alert, 0);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
    }

    public addInfo(message: string) {
        this.addAlert(new Alert(message, Alert.INFO));
    }

    public addSuccess(message: string) {
        this.addAlert(new Alert(message, Alert.SUCCESS));
    }

    public addWarning(message: string) {
        this.addAlert(new Alert(message, Alert.WARNING));
    }

    public addDanger(message: string) {
        this.addAlert(new Alert(message, Alert.DANGER));
    }

    private setAutoRemoveTimeout(alert: Alert) {
        if (alert.type === Alert.SUCCESS ||
            alert.type === Alert.INFO) {
            setTimeout(( () => this.removeAlert(alert) ), 5000);
        }
    }
}
