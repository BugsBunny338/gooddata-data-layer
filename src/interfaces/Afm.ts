export interface IBaseAttributeFilter {
    id: string; // dateDataSet URI or attribute displayForm URI
    type: 'attribute';
}

export interface IPositiveAttributeFilter extends IBaseAttributeFilter {
    in: string[]; // attribute elements IDs
}

export interface INegativeAttributeFilter extends IBaseAttributeFilter {
    notIn: string[]; // attribute elements IDs
}

export interface IDateFilter {
    id: string; // dateDataSet URI
    type: 'date';
    intervalType: 'absolute' | 'relative';
    between: [string, string] | [number, number];
    granularity: string;
}

export interface ISpecificObject {
    id: string;
}

export interface ILookupObject {
    lookupId: string; // search by ID in measures
}

export interface IMeasureDefinition {
    baseObject: ILookupObject | ISpecificObject;
    filters?: IFilter[];
    aggregation?: string;
    popAttribute?: {
        id: string // attribute displayForm URI
    };
    showInPercent?: boolean; // if true, take all from 'attributes',
}

export interface IMeasure {
    id: string;
    definition: IMeasureDefinition;
}

export interface IAttribute {
    id: string; // attribute displayForm URI
    type: 'date' | 'attribute';
}

export type IAttributeFilter = IPositiveAttributeFilter | INegativeAttributeFilter;

export type IFilter = IDateFilter | IAttributeFilter;

export interface IAfm {
    attributes?: IAttribute[];
    filters?: IFilter[];
    measures?: IMeasure[];
}
