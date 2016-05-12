export class Alert {
    static ALERT_SUCCESS = 'alert-success';
    static ALERT_INFO = 'alert-info';
    static ALERT_WARNING = 'alert-warning';
    static ALERT_DANGER = 'alert-danger';

    constructor(
        public message: string,
        public type: string
    ) {}
}
