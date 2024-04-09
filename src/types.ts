export interface ICallData {
    isIncoming: boolean;
    name: string;
    date: string;
    number: string;
    success: boolean;
}

export interface IFormValues {
    login: string;
    server: string;
    password: string;
}

export interface IIncomingCallData {
    number: string;
    name: string;
}