export interface IScopeData {
    data: any;
    originalData: any;
    funcBackAfter: Function;
    funcBack: Function;
}

export declare type ScopeType = { [key: string]: IScopeData };
