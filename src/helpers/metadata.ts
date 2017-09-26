import first = require('lodash/first');
import get = require('lodash/get');
import set = require('lodash/set');
import {
    IMeasuresMap,
    IAttributesMap,
    IVisualizationObject
} from '../legacy/model/VisualizationObject';
import { IGoodDataSDK } from '../interfaces/GoodDataSDK';
import { IAttribute } from '../afmMap/model/gooddata/Attribute';
import { IMeasure } from '../interfaces/Afm';

const getYearAttributeDisplayForm = (item: IAttribute): string => {
    const dateType = get(item, 'attribute.content.type');
    if (dateType === 'GDC.time.year') {
        return get(item, 'attribute.content.displayForms.0.meta.uri');
    }
};

const getDateFilter = (visualizationObject: IVisualizationObject) => {
    let dateFilterItem = get(visualizationObject, 'content.buckets.categories', [])
        .find(category => get(category, 'category.type', {}) === 'date');
    const dateFilter = dateFilterItem ? dateFilterItem.category : undefined;

    if (dateFilter) {
        return dateFilter;
    }

    dateFilterItem = get(visualizationObject, 'content.buckets.filters', [])
        .find(item => item.dateFilter !== undefined);

    return dateFilterItem ? dateFilterItem.dateFilter : undefined;
};

export const getAttributesMap = (sdk: IGoodDataSDK, projectId: string, visualizationObject: IVisualizationObject):
    Promise<IAttributesMap> => {
    const dateFilter = getDateFilter(visualizationObject);
    if (!dateFilter) {
        return Promise.resolve({});
    }

    const attrUri = get(dateFilter, 'attribute') as string;
    return sdk.md.getObjects(projectId, [attrUri]).then((attr) => {
        return {
            [attrUri]: getYearAttributeDisplayForm(first(attr))
        };
    });
};

export const fetchMeasures = (sdk: IGoodDataSDK, projectId: string, visualizationObject: IVisualizationObject):
    Promise<IMeasuresMap> => {
    const measures = get(visualizationObject, 'content.buckets.measures', []);
    if (!measures.length) {
        return Promise.resolve({});
    }

    const uris = measures.map(measure => measure.measure.objectUri);
    return sdk.md.getObjects(projectId, uris).then((objects) => {
        return objects.reduce((acc: IMeasuresMap, metric: IMeasure) => {
            const uri = get(metric, 'metric.meta.uri');
            if (uri) {
                set(acc, uri, {
                    measure: {
                        format: get(metric, 'metric.content.format')
                    }
                });
            }

            return acc;
        }, {});
    });
};
