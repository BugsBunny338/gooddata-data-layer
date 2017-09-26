import { SimpleMetadataSource } from '../SimpleMetadataSource';
import { charts } from '../legacy/tests/fixtures/VisObj.fixtures';

describe('SimpleMetadataSource', () => {
    it('should return metadata object wrapped', () => {
        const visualizationObjectContent = charts.bar.simpleMeasure;
        const measuresMap = {};
        const source = new SimpleMetadataSource(visualizationObjectContent, measuresMap);
        return source.getVisualizationMetadata().then((result) => {
            expect(result).toEqual({
                measuresMap,
                metadata: {
                    content: visualizationObjectContent,
                    meta: {
                        title: 'Test'
                    }
                }
            });
        });
    });
});
