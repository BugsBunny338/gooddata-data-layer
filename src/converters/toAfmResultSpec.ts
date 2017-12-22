import flatten = require('lodash/flatten');
import compact = require('lodash/compact');
import isEmpty = require('lodash/isEmpty');
import flatMap = require('lodash/flatMap');
import { AFM } from '@gooddata/typings';
import { get } from 'lodash';

import { TABLE, PIE } from '../constants/visualizationTypes';
import { normalizeAfm } from '../utils/AfmUtils';
import * as VisObj from './model/VisualizationObject';

function getMeasureId(n: number, measure: VisObj.IMeasure): string {
    return measure.measure.localIdentifier || `m${n + 1}`;
}

function convertAttribute(attribute: VisObj.ICategory, idx: number): AFM.IAttribute {
    return {
        displayForm: {
            uri: attribute.category.displayForm
        },
        localIdentifier: attribute.category.localIdentifier || `a${idx + 1}`
    };
}

function convertRelativeDateFilter(
    filter: VisObj.IEmbeddedDateFilter,
    dateDataSetUri: string
): AFM.IRelativeDateFilter {
    const granularity = filter.dateFilter.granularity;
    const relativeDateFilter: AFM.IRelativeDateFilter = {
        relativeDateFilter: {
            dataSet: {
                uri: dateDataSetUri
            },
            granularity,
            from: Number(filter.dateFilter.from),
            to: Number(filter.dateFilter.to)
        }
    };
    return relativeDateFilter;
}

function convertAbsoluteDateFilter(
    filter: VisObj.IEmbeddedDateFilter,
    dateDataSetUri: string
): AFM.IAbsoluteDateFilter {
    const absoluteDateFilter: AFM.IAbsoluteDateFilter = {
        absoluteDateFilter: {
            dataSet: {
                uri: dateDataSetUri
            },
            from: String(filter.dateFilter.from),
            to: String(filter.dateFilter.to)
        }
    };
    return absoluteDateFilter;
}

function convertDateFilter(filter: VisObj.IEmbeddedDateFilter): AFM.DateFilterItem {
    // skip All time date filters or broken filters with one of from/to undefined
    const { dateFilter } = filter;
    if (dateFilter.from === undefined || dateFilter.to === undefined) {
        return null;
    }
    const dateDataSetUri = filter.dateFilter.dataset;

    if (filter.dateFilter.type === 'relative') {
        return convertRelativeDateFilter(filter, dateDataSetUri);
    }
    return convertAbsoluteDateFilter(filter, dateDataSetUri);
}

function convertNegativeAttributeFilter(
    filter: VisObj.IEmbeddedListAttributeFilter
): AFM.INegativeAttributeFilter {
    const negativeFilter: AFM.INegativeAttributeFilter = {
        negativeAttributeFilter: {
            displayForm: {
                uri: filter.listAttributeFilter.displayForm
            },
            notIn: filter.listAttributeFilter.default.attributeElements
        }
    };
    return negativeFilter;
}

function convertPositiveAttributeFilter(
    filter: VisObj.IEmbeddedListAttributeFilter
): AFM.IPositiveAttributeFilter {
    const positiveFilter: AFM.IPositiveAttributeFilter = {
        positiveAttributeFilter: {
            displayForm: {
                uri: filter.listAttributeFilter.displayForm
            },
            in: filter.listAttributeFilter.default.attributeElements
        }
    };
    return positiveFilter;
}

function convertAttributeFilter(filter: VisObj.IEmbeddedListAttributeFilter): AFM.AttributeFilterItem {
    const items: string[] = filter.listAttributeFilter.default.attributeElements;
    // skip filters with ALL
    if (items.length === 0) {
        return null;
    }
    if (filter.listAttributeFilter.default.negativeSelection) {
        return convertNegativeAttributeFilter(filter);
    }
    return convertPositiveAttributeFilter(filter);
}

function convertFilter(filter: VisObj.EmbeddedFilter): AFM.FilterItem {
    if ((filter as VisObj.IEmbeddedDateFilter).dateFilter) {
        return convertDateFilter(filter as VisObj.IEmbeddedDateFilter);
    }

    return convertAttributeFilter(filter as VisObj.IEmbeddedListAttributeFilter);
}

function convertMeasureFilters(measure: VisObj.IMeasure): AFM.AttributeFilterItem[] {
    return measure.measure.measureFilters.map(convertFilter) as AFM.AttributeFilterItem[];
}

function convertMeasureAfm(
    measure: VisObj.IMeasure,
    index: number,
    popAttribute: string,
    translatedPopSuffix: string
): AFM.IMeasure[] {
    const aggregationProp = measure.measure.aggregation ? { aggregation: measure.measure.aggregation } : {};
    const filters = compact(convertMeasureFilters(measure));
    const filtersProp = filters.length ? { filters } : {};
    const aliasProp = measure.measure.alias
        ? { alias: measure.measure.alias }
        : (measure.measure.title ? { alias: measure.measure.title } : {});
    const computeRatioProp = measure.measure.showInPercent ? { computeRatio: true } : {};
    const formatProp = measure.measure.showInPercent
        ? { format: '#,##0.00%' }
        : (measure.measure.aggregation === 'count' ? { format: '#,##0' } : {});
    const afmMeasure: AFM.IMeasure = {
        localIdentifier: getMeasureId(index, measure),
        definition: {
            measure: {
                item: {
                    uri: measure.measure.objectUri
                },
                ...aggregationProp,
                ...computeRatioProp,
                ...filtersProp
            }
        },
        ...aliasProp,
        ...formatProp
    };

    const measures: AFM.IMeasure[] = [afmMeasure];

    if (measure.measure.showPoP) {
        const aliasPopProp = measure.measure.title
            ? { alias: `${measure.measure.title}${translatedPopSuffix}` }
            : {};
        const popMeasure: AFM.IMeasure = {
            localIdentifier: `${afmMeasure.localIdentifier}_pop`,
            definition: {
                popMeasure: {
                    measureIdentifier: afmMeasure.localIdentifier,
                    popAttribute: {
                        uri: popAttribute
                    }
                }
            },
            ...aliasPopProp
        };

        measures.unshift(popMeasure);
    }

    return measures;
}

function isChartStackedOrSegmented(visObj: VisObj.IVisualizationObjectContent): boolean {
    return visObj.buckets.categories.some(
        c => c.category.collection === 'stack' || c.category.collection === 'segment'
    );
}

function convertSorting(visObj: VisObj.IVisualizationObjectContent): AFM.SortItem[] {
    const measureSorting = visObj.buckets.measures.map((measure, index) => {
        if (!measure.measure.sort) {
            return null;
        }

        const baseIdentifier = getMeasureId(index, measure);

        const measureSort: AFM.IMeasureSortItem = {
            measureSortItem: {
                direction: measure.measure.sort.direction,
                locators: [
                    {
                        measureLocatorItem: {
                            measureIdentifier: `${baseIdentifier}${measure.measure.sort.sortByPoP ? '_pop' : ''}`
                        }
                    }
                ]
            }
        };
        return measureSort;
    });

    const attributesSorting = visObj.buckets.categories.map((category, index) => {
        if (!category.category.sort) {
            return null;
        }

        const attributeSort: AFM.IAttributeSortItem = {
            attributeSortItem: {
                direction: category.category.sort,
                attributeIdentifier: category.category.localIdentifier || `a${index + 1}`
           }
        };
        return attributeSort;
    });

    return compact([...measureSorting, ...attributesSorting]);
}

function getPoPAttribute(visObj: VisObj.IVisualizationObjectContent): string {
    const category = visObj.buckets.categories[0];

    if (category && category.category.type === 'date') {
        return category.category.attribute;
    }

    const filter: VisObj.IEmbeddedDateFilter = (visObj.buckets.filters as VisObj.IEmbeddedDateFilter[])
        .find((f: VisObj.IEmbeddedDateFilter) => {
            return !!f.dateFilter;
        });

    if (filter) {
        return filter.dateFilter.attribute;
    }

    return null;
}

function convertNativeTotals(visObj: VisObj.IVisualizationObjectContent, measures: AFM.IMeasure[]
): AFM.INativeTotalItem[] {
    if (isEmpty(visObj.buckets.totals)) {
        return [];
    }

    const visNativeTotals = visObj.buckets.totals.filter(visTotal => visTotal.total.type === 'nat');
    const nativeTotals = flatMap(visNativeTotals, (visTotal) => {
        return visTotal.total.outputMeasureIndexes.map((measureIndex) => {
            return {
                measureIdentifier: measures[measureIndex].localIdentifier,
                // Currently supports only Grand Totals.
                // TODO Update this once new Visualization Object is available
                attributeIdentifiers: []
            };
        });
    });

    return compact(nativeTotals);
}

function convertAFM(visObj: VisObj.IVisualizationObjectContent, translatedPopSuffix: string): AFM.IAfm {
    const attributes = visObj.buckets.categories.map(convertAttribute);
    const attributesProp = attributes.length ? { attributes } : {};

    const popAttribute = getPoPAttribute(visObj);
    const measures = flatten(visObj.buckets.measures.map((measure, index) => {
        return convertMeasureAfm(measure, index, popAttribute, translatedPopSuffix);
    }));
    const measuresProp = measures.length ? { measures } : {};

    const filters = compact(visObj.buckets.filters.map(convertFilter));
    const filtersProp = filters.length ? { filters } : {};

    const nativeTotals = convertNativeTotals(visObj, measures);
    const nativeTotalsProp = nativeTotals.length ? { nativeTotals } : {};

    return {
        ...measuresProp,
        ...attributesProp,
        ...filtersProp,
        ...nativeTotalsProp
    };
}

type ICategoryToStringFunc = (category: VisObj.ICategory) => string;

function categoryToIdentFunc(afmAttributes: AFM.IAttribute[]): ICategoryToStringFunc  {
    return (category: VisObj.ICategory) => {
        const df = category.category.displayForm;
        const attribute = afmAttributes.find(a => (a.displayForm as AFM.IObjUriQualifier).uri === df);
        return get(attribute, 'localIdentifier');
    };
}

const attributesToDimensionsMapping = {
    table: {
        0: 'attribute'
    },
    column: {
        0: 'stack',
        1: 'view'
    },
    bar: {
        0: 'stack',
        1: 'view'
    },
    line: {
        0: 'segment',
        1: 'trend'
    },
    pie: {
        1: 'view'
    }
};

function shouldGenerateDimensions(afm: AFM.IAfm): boolean {
    const normalizedAfm = normalizeAfm(afm);
    return normalizedAfm.measures.length > 0 || normalizedAfm.attributes.length > 0;
}

/**
 * Table - 0. attributes, 1. measureGroup
 * Basic charts - 0. measureGroup, 1. attributes
 * Stacked chart - 0. stacking attribute, 1. measureGroup + attributes
 * Pie chart metrics only - 0. empty, 1. measureGroup
 */
function generateDimensions(
    visObj: VisObj.IVisualizationObjectContent,
    afm: AFM.IAfm): AFM.IDimension[] {
    if (!shouldGenerateDimensions(afm)) {
        return [];
    }

    const { categories, measures } = visObj.buckets;
    const attributesMapping = attributesToDimensionsMapping[visObj.type];

    const afmAttributes = afm.attributes;
    const itemIdentifiersList = [
        categories.filter(c => c.category.collection === attributesMapping[0]).map(categoryToIdentFunc(afmAttributes)),
        categories.filter(c => c.category.collection === attributesMapping[1]).map(categoryToIdentFunc(afmAttributes))
    ];

    if (measures.length > 0) {
        const pieOnlyMeasures = visObj.type === PIE && categories.length === 0;
        const stackedChart = isChartStackedOrSegmented(visObj);

        const measureGroupIndex = pieOnlyMeasures || stackedChart || visObj.type === TABLE ? 1 : 0;
        itemIdentifiersList[measureGroupIndex].push('measureGroup');
    }

    return itemIdentifiersList.map(itemIdentifiers => generateDimension(itemIdentifiers, visObj, afm));
}

function shouldConvertTotals(itemIdentifiers: AFM.Identifier[], visObj: VisObj.IVisualizationObjectContent): boolean {
    if (!isEmpty(itemIdentifiers)) {
        const hasTotals = !isEmpty(visObj.buckets.totals);
        const containsMeasureGroup = itemIdentifiers.some(item => item === 'measureGroup');
        return hasTotals && !containsMeasureGroup;
    }

    return false;
}

function convertTotals(itemIdentifiers: AFM.Identifier[], visObj: VisObj.IVisualizationObjectContent,
                       afm: AFM.IAfm): AFM.ITotalItem[] {
    if (!shouldConvertTotals(itemIdentifiers, visObj)) {
        return [];
    }

    const totals = flatMap(visObj.buckets.totals, (visTotal) => {
        return visTotal.total.outputMeasureIndexes.map((measureIndex) => {
            return {
                measureIdentifier: afm.measures[measureIndex].localIdentifier,
                type: visTotal.total.type,
                // Currently supports only Grand Totals.
                // TODO Update this once new Visualization Object is available
                attributeIdentifier: itemIdentifiers[0]
            };
        });
    });

    return compact(totals);
}

function generateDimension(itemIdentifiers: string[], visObj: VisObj.IVisualizationObjectContent,
                           afm: AFM.IAfm): AFM.IDimension {
    const totals = convertTotals(itemIdentifiers, visObj, afm);
    const totalsProp = totals.length ? { totals } : {};

    return {
        itemIdentifiers,
        ...totalsProp
    };
}

function convertResultSpec(
    visObj: VisObj.IVisualizationObjectContent,
    afm: AFM.IAfm
): AFM.IResultSpec {
    const sorts = convertSorting(visObj);
    // Workaround because we can handle only 1 sort item for now
    const sortsProp = sorts.length ? { sorts: sorts.slice(0, 1) } : {};

    const dimensions = generateDimensions(visObj, afm);
    const dimensionsProp = dimensions.length ? { dimensions } : {};

    return {
        ...dimensionsProp,
        ...sortsProp
    };
}

export interface IConvertedAFM {
    afm: AFM.IAfm;
    resultSpec: AFM.IResultSpec;
    type: VisObj.VisualizationType;
}

export function toAfmResultSpec(
    visObj: VisObj.IVisualizationObjectContent,
    translatedPopSuffix: string
): IConvertedAFM {
    const afm = convertAFM(visObj, translatedPopSuffix);

    return {
        type: visObj.type,
        afm,
        resultSpec: convertResultSpec(visObj, afm)
    };
}
