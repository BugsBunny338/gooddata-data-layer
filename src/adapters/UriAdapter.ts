import { IAdapter } from '../interfaces/Adapter';
import { IDataSource } from '../interfaces/DataSource';
import { IAfm } from '../interfaces/Afm';
import { SimpleExecutorAdapter } from './SimpleExecutorAdapter';
import { toAFM } from '../legacy/converters';
import { appendFilters } from '../utils/AfmUtils';
import { getAttributesMap } from '../helpers/metadata';

export class UriAdapter implements IAdapter {
    private projectId: string;
    private sdk;
    private uri;
    private visObject;

    constructor(sdk, projectId: string) {
        this.sdk = sdk;
        this.projectId = projectId;
    }

    public createDataSource({ uri, attributeFilters, dateFilter }): Promise<IDataSource> {
        return this.fetchVisualizationObject(uri)
            .then((visObject) => {
                return getAttributesMap(this.sdk, this.projectId, visObject.visualization)
                    .then((attributesMap = {}) => {
                        const content = visObject.visualization.content;
                        const { afm } = toAFM(content, attributesMap);
                        const afmWithAttributeFilters: IAfm = appendFilters(afm, attributeFilters, dateFilter);
                        const simpleAdapter = new SimpleExecutorAdapter(this.sdk, this.projectId);

                        return simpleAdapter.createDataSource(afmWithAttributeFilters);
                    });
            });
    }

    private fetchVisualizationObject(uri: string)  {
        if (uri === this.uri) {
            return Promise.resolve(this.visObject);
        }
        return this.sdk.xhr.get(uri).then((visObject) => {
            this.uri = uri;
            return this.visObject = visObject;
        });
    }
}
