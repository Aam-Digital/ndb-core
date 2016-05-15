export class Alert {
    static SUCCESS = 'alert-success';
    static INFO = 'alert-info';
    static WARNING = 'alert-warning';
    static DANGER = 'alert-danger';

    constructor(
        public message: string,
        public type: string
    ) {}
}
