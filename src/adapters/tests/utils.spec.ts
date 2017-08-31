import {
    lookupAttributes,
    normalizeAfm,
    generateMetricExpression,
    generateFilters,
    getSorting,
    getMeasureAdditionalInfo,
    loadAttributesMap,
    generateMetricDefinition,
    getMeasureFormat
} from '../utils';
import { SHOW_IN_PERCENT_MEASURE_FORMAT } from '../../constants/formats';
import { IAfm, IMeasure } from '../../interfaces/Afm';
import { ITransformation } from '../../interfaces/Transformation';

describe('lookupAttributes', () => {
    it('should extract displayForm from showInPercent', () => {
        const showInPercentAfm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/close_bop'
                        },
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/date_display_form',
                    type: 'date'
                }
            ]
        };

        expect(lookupAttributes(showInPercentAfm)).toEqual([
            '/gdc/md/date_display_form'
        ]);
    });

    it('should extract displayForm from PoP', () => {
        const simplePopAfm: IAfm = {
            measures: [
                {
                    id: 'close_bop',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/close_bop'
                        }
                    }
                },
                {
                    id: 'close_bop_pop',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/close_bop'
                        },
                        popAttribute: {
                            id: '/gdc/md/date_display_form'
                        }
                    }
                }
            ]
        };

        expect(lookupAttributes(simplePopAfm)).toEqual([
            '/gdc/md/date_display_form'
        ]);
    });

    it('should extract displayForm from metric filters', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'measure_with_filter',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/close_bop'
                        },
                        filters: [{
                            id: '/gdc/md/attr_display_form',
                            type: 'attribute',
                            in: [
                                '/gdc/md/attr?id=1',
                                '/gdc/md/attr?id=2'
                            ]
                        }]
                    }
                }
            ]
        };

        expect(lookupAttributes(afm)).toEqual([
            '/gdc/md/attr_display_form'
        ]);
    });

    it('should extract displayForm from metric with filters & showInPercent and attribute', () => {
        const popAfm: IAfm = {
            measures: [
                {
                    id: 'measure_with_filter',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/close_bop'
                        },
                        filters: [{
                            id: '/gdc/md/filter_attr_display_form',
                            type: 'attribute',
                            in: [
                                '/gdc/md/attr?id=1',
                                '/gdc/md/attr?id=2'
                            ]
                        }],
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attr_display_form',
                    type: 'attribute'
                }
            ]
        };

        expect(lookupAttributes(popAfm)).toEqual([
            '/gdc/md/attr_display_form',
            '/gdc/md/filter_attr_display_form'
        ]);
    });

    it('should not extract displayForm for simple AFM', () => {
        const simpleAfm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/close_bop/percent'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/date_display_form',
                    type: 'date'
                }
            ]
        };

        expect(lookupAttributes(simpleAfm)).toEqual([]);
    });
});

describe('normalizeAfm', () => {
    it('should add optional arrays', () => {
        const afm: IAfm = {};
        expect(normalizeAfm(afm)).toEqual({
            measures: [],
            attributes: [],
            filters: []
        });

        expect(normalizeAfm({
            attributes: [
                {
                    id: '1',
                    type: 'date'
                }
            ]
        })).toEqual({
            attributes: [
                {
                    id: '1',
                    type: 'date'
                }
            ],
            measures: [],
            filters: []
        });

        expect(normalizeAfm({
            measures: [
                {
                    id: '1',
                    definition: {
                        baseObject: {
                            id: '/uri'
                        }
                    }
                }
            ]
        })).toEqual({
            measures: [
                {
                    id: '1',
                    definition: {
                        baseObject: {
                            id: '/uri'
                        }
                    }
                }
            ],
            attributes: [],
            filters: []
        });

        expect(normalizeAfm({
            filters: [
                {
                    id: '1',
                    type: 'date',
                    intervalType: 'relative',
                    between: [0, 1],
                    granularity: 'year'
                }
            ]
        })).toEqual({
            attributes: [],
            measures: [],
            filters: [
                {
                    id: '1',
                    type: 'date',
                    intervalType: 'relative',
                    between: [0, 1],
                    granularity: 'year'
                }
            ]
        });
    });
});

describe('generateMetricExpressionn', () => {
    it('should generate metric with aggregation and uri', () => {
        const afm: IAfm = {
            measures: [{
                id: 'metric_sum',
                definition: {
                    baseObject: {
                        id: '/gdc/md/measure/obj/1'
                    },
                    aggregation: 'sum'
                }
            }]
        };
        expect(generateMetricExpression(afm.measures[0], afm, [])).toEqual(
            'SELECT SUM([/gdc/md/measure/obj/1])'
        );
    });

    it('should generate metric with aggregation and identifier', () => {
        const afm: IAfm = {
            measures: [{
                id: 'metric_sum',
                definition: {
                    baseObject: {
                        id: 'identifier'
                    },
                    aggregation: 'sum'
                }
            }]
        };
        expect(generateMetricExpression(afm.measures[0], afm, [])).toEqual(
            'SELECT SUM({identifier})'
        );
    });

    it('should generate metric with empty filter and uri', () => {
        const afm: IAfm = {
            measures: [{
                id: 'metric_empty_filter',
                definition: {
                    baseObject: {
                        id: '/gdc/md/measure/obj/1'
                    },
                    filters: [
                        {
                            id: '/uri',
                            type: 'attribute',
                            in: []
                        }
                    ]
                }
            }]
        };
        expect(generateMetricExpression(afm.measures[0], afm, [])).toEqual(
            'SELECT [/gdc/md/measure/obj/1]'
        );
    });

    it('should generate metric with empty filter and identifier', () => {
        const afm: IAfm = {
            measures: [{
                id: 'metric_empty_filter',
                definition: {
                    baseObject: {
                        id: 'identifier'
                    },
                    filters: [
                        {
                            id: '/uri',
                            type: 'attribute',
                            in: []
                        }
                    ]
                }
            }]
        };
        expect(generateMetricExpression(afm.measures[0], afm, [])).toEqual(
            'SELECT {identifier}'
        );
    });

    it('should generate metric with filters and uris', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'metric_with_filters',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/1'
                        },
                        filters: [{
                            id: '/gdc/md/filter_attr_display_form1/obj/1',
                            type: 'attribute',
                            in: [
                                '1',
                                '2'
                            ]
                        }, {
                            id: '/gdc/md/filter_attr_display_form2/obj/1',
                            type: 'attribute',
                            in: [
                                '1',
                                '2'
                            ]
                        }]
                    }
                }
            ]
        };
        const mapping = [
            {
                attribute: '/gdc/md/filter_attr1/obj/1',
                attributeDisplayForm: '/gdc/md/filter_attr_display_form1/obj/1'
            },
            {
                attribute: '/gdc/md/filter_attr2/obj/1',
                attributeDisplayForm: '/gdc/md/filter_attr_display_form2/obj/1'
            }
        ];
        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT [/gdc/md/measure/obj/1] ' +
            'WHERE [/gdc/md/filter_attr1/obj/1] ' +
            'IN ([/gdc/md/filter_attr1/obj/1/elements?id=1],[/gdc/md/filter_attr1/obj/1/elements?id=2]) ' +
            'AND [/gdc/md/filter_attr2/obj/1] ' +
            'IN ([/gdc/md/filter_attr2/obj/1/elements?id=1],[/gdc/md/filter_attr2/obj/1/elements?id=2])'
        );
    });

    it('should generate metric with filters and identifiers', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'metric_with_filters',
                    definition: {
                        baseObject: {
                            id: 'measureIdentifier'
                        },
                        filters: [{
                            id: 'attribute_display_form_identifier_1',
                            type: 'attribute',
                            in: [
                                '1',
                                '2'
                            ]
                        }, {
                            id: 'attribute_display_form_identifier_2',
                            type: 'attribute',
                            in: [
                                '1',
                                '2'
                            ]
                        }]
                    }
                }
            ]
        };
        const mapping = [
            {
                attribute: 'attribute_identifier_1',
                attributeDisplayForm: 'attribute_display_form_identifier_1'
            },
            {
                attribute: 'attribute_identifier_2',
                attributeDisplayForm: 'attribute_display_form_identifier_2'
            }
        ];
        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT {measureIdentifier} ' +
            'WHERE {attribute_identifier_1} ' +
            'IN ({attribute_identifier_1?1},{attribute_identifier_1?2}) ' +
            'AND {attribute_identifier_2} ' +
            'IN ({attribute_identifier_2?1},{attribute_identifier_2?2})'
        );
    });

    it('should generate PoP with uris', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'm1',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/1'
                        }
                    }
                },
                {
                    id: 'close_bop_pop',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/1'
                        },
                        popAttribute: {
                            id: '/gdc/md/date_display_form/obj/1'
                        }
                    }
                }
            ],
            attributes: [

            ]
        };
        const mapping = [
            {
                attribute: '/gdc/md/date_attribute/obj/1',
                attributeDisplayForm: '/gdc/md/date_display_form/obj/1'
            }
        ];
        expect(generateMetricExpression(afm.measures[1], afm, mapping)).toEqual(
            'SELECT [/gdc/md/measure/obj/1] FOR PREVIOUS ([/gdc/md/date_attribute/obj/1])'
        );
    });

    it('should generate PoP with identifiers', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'm1',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        }
                    }
                },
                {
                    id: 'close_bop_pop',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        },
                        popAttribute: {
                            id: 'attribute_display_form_identifier'
                        }
                    }
                }
            ],
            attributes: [

            ]
        };
        const mapping = [
            {
                attribute: 'attribute_identifier',
                attributeDisplayForm: 'attribute_display_form_identifier'
            }
        ];
        expect(generateMetricExpression(afm.measures[1], afm, mapping)).toEqual(
            'SELECT {measure_identifier} FOR PREVIOUS ({attribute_identifier})'
        );
    });

    it('should generate showInPercent with uris', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/1'
                        },
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const mapping = [
            {
                attribute: '/gdc/md/attribute/obj/1',
                attributeDisplayForm: '/gdc/md/attribute_display_form/obj/1'
            }
        ];

        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT (SELECT [/gdc/md/measure/obj/1]) / (SELECT [/gdc/md/measure/obj/1] ' +
            'BY ALL [/gdc/md/attribute/obj/1])'
        );
    });

    it('should generate showInPercent with identifiers', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        },
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: 'attribute_display_form_identifier',
                    type: 'attribute'
                }
            ]
        };

        const mapping = [
            {
                attribute: 'attribute_identifier',
                attributeDisplayForm: 'attribute_display_form_identifier'
            }
        ];

        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT (SELECT {measure_identifier}) / (SELECT {measure_identifier} ' +
            'BY ALL {attribute_identifier})'
        );
    });

    it('should generate showInPercent with filters and uris', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/1'
                        },
                        filters: [{
                            id: '/gdc/md/filter_attr_display_form/obj/1',
                            type: 'attribute',
                            in: [
                                '1',
                                '2'
                            ]
                        }],
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const mapping = [
            {
                attribute: '/gdc/md/attribute/obj/1',
                attributeDisplayForm: '/gdc/md/attribute_display_form/obj/1'
            },
            {
                attribute: '/gdc/md/filter_attr/obj/1',
                attributeDisplayForm: '/gdc/md/filter_attr_display_form/obj/1'
            }
        ];

        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT ' +
            '(SELECT [/gdc/md/measure/obj/1] ' +
                'WHERE [/gdc/md/filter_attr/obj/1] ' +
                'IN ([/gdc/md/filter_attr/obj/1/elements?id=1],[/gdc/md/filter_attr/obj/1/elements?id=2])) ' +
            '/ ' +
            '(SELECT [/gdc/md/measure/obj/1] ' +
                'BY ALL [/gdc/md/attribute/obj/1] ' +
                'WHERE [/gdc/md/filter_attr/obj/1] ' +
                'IN ([/gdc/md/filter_attr/obj/1/elements?id=1],[/gdc/md/filter_attr/obj/1/elements?id=2]))'
        );
    });

    it('should generate showInPercent with filters and identifiers', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        },
                        filters: [{
                            id: 'filter_attr_display_form_identifier',
                            type: 'attribute',
                            in: [
                                '1',
                                '2'
                            ]
                        }],
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: 'attribute_display_form_identifier',
                    type: 'attribute'
                }
            ]
        };

        const mapping = [
            {
                attribute: 'attribute_identifier',
                attributeDisplayForm: 'attribute_display_form_identifier'
            },
            {
                attribute: 'filter_attribute_identifier',
                attributeDisplayForm: 'filter_attr_display_form_identifier'
            }
        ];

        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT ' +
            '(SELECT {measure_identifier} ' +
            'WHERE {filter_attribute_identifier} ' +
            'IN ({filter_attribute_identifier?1},{filter_attribute_identifier?2})) ' +
            '/ ' +
            '(SELECT {measure_identifier} ' +
            'BY ALL {attribute_identifier} ' +
            'WHERE {filter_attribute_identifier} ' +
            'IN ({filter_attribute_identifier?1},{filter_attribute_identifier?2}))'
        );
    });

    it('should generate PoP & showInPercent (referenced definitions) with uris', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'measure_in_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/1'
                        },
                        showInPercent: true
                    }
                },
                {
                    id: 'measure_pop',
                    definition: {
                        baseObject: {
                            lookupId: 'measure_in_percent'
                        },
                        popAttribute: {
                            id: '/gdc/md/attribute_display_form/obj/1'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'date'
                }
            ]
        };

        const mapping = [
            {
                attribute: '/gdc/md/attribute/obj/1',
                attributeDisplayForm: '/gdc/md/attribute_display_form/obj/1'
            }
        ];

        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT (SELECT [/gdc/md/measure/obj/1]) / (SELECT [/gdc/md/measure/obj/1] ' +
            'BY ALL [/gdc/md/attribute/obj/1])'
        );
        expect(generateMetricExpression(afm.measures[1], afm, mapping)).toEqual(
            'SELECT (SELECT (SELECT [/gdc/md/measure/obj/1]) ' +
            '/ (SELECT [/gdc/md/measure/obj/1] BY ALL [/gdc/md/attribute/obj/1])) ' +
            'FOR PREVIOUS ([/gdc/md/attribute/obj/1])'
        );
    });

    it('should generate PoP & showInPercent (referenced definitions) with identifiers', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'measure_in_percent',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        },
                        showInPercent: true
                    }
                },
                {
                    id: 'measure_pop',
                    definition: {
                        baseObject: {
                            lookupId: 'measure_in_percent'
                        },
                        popAttribute: {
                            id: 'attribute_display_form_identifier'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: 'attribute_display_form_identifier',
                    type: 'attribute'
                }
            ]
        };

        const mapping = [
            {
                attribute: 'attribute_identifier',
                attributeDisplayForm: 'attribute_display_form_identifier'
            }
        ];

        expect(generateMetricExpression(afm.measures[0], afm, mapping)).toEqual(
            'SELECT (SELECT {measure_identifier}) / (SELECT {measure_identifier} ' +
            'BY ALL {attribute_identifier})'
        );
        expect(generateMetricExpression(afm.measures[1], afm, mapping)).toEqual(
            'SELECT (SELECT (SELECT {measure_identifier}) ' +
            '/ (SELECT {measure_identifier} BY ALL {attribute_identifier})) ' +
            'FOR PREVIOUS ({attribute_identifier})'
        );
    });
});

describe('getSorting', () => {
    it('should generate sorting from transformation', () => {
        const transformation: ITransformation = {
            sorting: [
                {
                    column: '/gdc/md/column1',
                    direction: 'desc'
                },
                {
                    column: '/gdc/md/column2',
                    direction: 'asc'
                }
            ]
        };

        expect(getSorting(transformation)).toEqual([
            {
                column: '/gdc/md/column1',
                direction: 'desc'
            }, {
                column: '/gdc/md/column2',
                direction: 'asc'
            }
        ]);
    });
});

describe('getMeasureAdditionalInfo', () => {
    it('should generate measure info with titles and formats', () => {
        const transformation: ITransformation = {
            measures: [
                {
                    id: 'a',
                    title: 'A',
                    format: 'fA'
                },
                {
                    id: 'b',
                    title: 'B',
                    format: 'fB'
                }
            ]
        };

        expect(getMeasureAdditionalInfo(transformation, 'a')).toEqual({
            title: 'A',
            format: 'fA'
        });

        expect(getMeasureAdditionalInfo(transformation, 'b')).toEqual({
            title: 'B',
            format: 'fB'
        });
    });
});

describe('generateMetricDefinition', () => {
    it('should generate metric definition with given format for normal measure', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/2'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const transformation: ITransformation = {
            measures: [
                { id: 'close_bop', title: 'Measure', format: '#,##0.00' }
            ]
        };

        const mapping = [
            {
                attribute: '/gdc/md/attribute/obj/123',
                attributeDisplayForm: '/gdc/md/attribute_display_form/obj/1'
            }
        ];

        expect(generateMetricDefinition(afm, transformation, mapping, afm.measures[0])).toEqual({
            expression: 'SELECT [/gdc/md/measure/obj/2]',
            format: '#,##0.00',
            identifier: 'close_bop',
            title: 'Measure'
        });
    });

    it('should generate metric definition with special format for show in percent measure', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/2'
                        },
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const transformation: ITransformation = {
            measures: [
                { id: 'close_bop_percent', title: '% Measure', format: '#,##0.00' }
            ]
        };

        const mapping = [
            {
                attribute: '/gdc/md/attribute/obj/123',
                attributeDisplayForm: '/gdc/md/attribute_display_form/obj/1'
            }
        ];

        expect(generateMetricDefinition(afm, transformation, mapping, afm.measures[0])).toEqual({
            expression: 'SELECT (SELECT [/gdc/md/measure/obj/2]) / '
                + '(SELECT [/gdc/md/measure/obj/2] BY ALL [/gdc/md/attribute/obj/123])',
            format: SHOW_IN_PERCENT_MEASURE_FORMAT,
            identifier: 'close_bop_percent',
            title: '% Measure'
        });
    });
});

describe('generateFilters', () => {
    it('should generate date and attribute filters', () => {
        const afm: IAfm = {
            filters: [
                {
                    id: '/gdc/md/datefilter/obj/1',
                    type: 'date',
                    intervalType: 'relative',
                    between: [0, 12],
                    granularity: 'year'
                },
                {
                    id: '/gdc/md/attribute1/obj/1',
                    type: 'attribute',
                    in: [
                        'a',
                        'b'
                    ]
                },
                {
                    id: '/gdc/md/attribute2/obj/1',
                    type: 'attribute',
                    notIn: [
                        'c',
                        'd'
                    ]
                },
                {
                    id: '/gdc/attribute2',
                    type: 'attribute',
                    notIn: []
                }
            ]
        };

        expect(generateFilters(afm)).toEqual(
            {
                $and: [{
                    '/gdc/md/attribute1/obj/1': {
                        $in: [{
                            id: 'a'
                        }, {
                            id: 'b'
                        }]
                    }
                }, {
                    '/gdc/md/attribute2/obj/1': {
                        $not: {
                            $in: [{
                                id: 'c'
                            }, {
                                id: 'd'
                            }]
                        }
                    }
                }],
                '/gdc/md/datefilter/obj/1': {
                    $between: [0, 12],
                    $granularity: 'GDC.time.year'
                }
            }
        );
    });
});

describe('loadAttributesMap', () => {
    const getObjectsResponse = [
        {
            attributeDisplayForm: {
                content: {
                    formOf: '/gdc/md/project/obj/11'
                },
                meta: {
                    uri: '/gdc/md/project/obj/1',
                    identifier: 'abcd1'
                }
            }
        }
    ];

    const getUrisFromIdentifiersResponse = [
        {
            uri: '/gdc/md/project/obj/1'
        }
    ];

    const projectId = 'project';

    function createSdkMock() {
        return {
            md: {
                getUrisFromIdentifiers: jest.fn(() => Promise.resolve(getUrisFromIdentifiersResponse)),
                getObjects: jest.fn(() => Promise.resolve(getObjectsResponse))
            }
        };
    }

    it('should return array with attributes and display forms for AFM with uris', () => {
        const sdk = createSdkMock();
        const afm: IAfm = {
            measures: [
                {
                    id: 'measure_in_percent',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        },
                        showInPercent: true
                    }
                },
                {
                    id: 'measure_pop',
                    definition: {
                        baseObject: {
                            lookupId: 'measure_in_percent'
                        },
                        popAttribute: {
                            id: '/gdc/md/project/obj/11'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/project/obj/11',
                    type: 'attribute'
                }
            ]
        };
        return loadAttributesMap(afm, sdk, projectId).then((attributesMap) => {
            expect(sdk.md.getObjects).toHaveBeenCalled();
            expect(sdk.md.getUrisFromIdentifiers).not.toHaveBeenCalled();
            expect(attributesMap).toEqual([
                {
                    attribute: '/gdc/md/project/obj/11',
                    attributeDisplayForm: '/gdc/md/project/obj/1'
                }
            ]);
        });
    });

    it('should return array with attributes and display forms for AFM with identifiers', () => {
        const sdk = createSdkMock();
        const afm: IAfm = {
            measures: [
                {
                    id: 'measure_in_percent',
                    definition: {
                        baseObject: {
                            id: 'measure_identifier'
                        },
                        showInPercent: true
                    }
                },
                {
                    id: 'measure_pop',
                    definition: {
                        baseObject: {
                            lookupId: 'measure_in_percent'
                        },
                        popAttribute: {
                            id: 'attrDfIdentifier'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: 'attrDfIdentifier',
                    type: 'attribute'
                }
            ]
        };
        return loadAttributesMap(afm, sdk, projectId).then((attributesMap) => {
            expect(sdk.md.getObjects).toHaveBeenCalled();
            expect(sdk.md.getUrisFromIdentifiers).toHaveBeenCalled();
            expect(attributesMap).toEqual([
                {
                    attribute: '/gdc/md/project/obj/11',
                    attributeDisplayForm: 'abcd1'
                }
            ]);
        });
    });
});

describe('getMeasureFormat', () => {
    it('should return default format', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/2'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const measure: IMeasure = afm.measures[0];
        const defaultFormat = '#,##0.00000';
        expect(getMeasureFormat(measure, defaultFormat, afm)).toEqual('#,##0.00000');
    });

    it('should return default format for PoP metric', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/2'
                        }
                    }
                },
                {
                    id: 'close_bop_pop',
                    definition: {
                        baseObject: {
                            lookupId: 'close_bop'
                        },
                        popAttribute: {
                            id: '/gdc/md/date_display_form'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const measure: IMeasure = afm.measures[1];
        const defaultFormat = '#,##0.00000';
        expect(getMeasureFormat(measure, defaultFormat, afm)).toEqual('#,##0.00000');
    });

    it('should return % format for metric with showInPercent: true', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/2'
                        },
                        showInPercent: true
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const measure: IMeasure = afm.measures[0];
        const defaultFormat = '#,##0.00000';
        expect(getMeasureFormat(measure, defaultFormat, afm)).toEqual(SHOW_IN_PERCENT_MEASURE_FORMAT);
    });

    it('should return % format for PoP derived from metric with showInPercent: true', () => {
        const afm: IAfm = {
            measures: [
                {
                    id: 'close_bop_percent',
                    definition: {
                        baseObject: {
                            id: '/gdc/md/measure/obj/2'
                        },
                        showInPercent: true
                    }
                },
                {
                    id: 'close_bop_percent_pop',
                    definition: {
                        baseObject: {
                            lookupId: 'close_bop_percent'
                        },
                        popAttribute: {
                            id: '/gdc/md/date_display_form'
                        }
                    }
                }
            ],
            attributes: [
                {
                    id: '/gdc/md/attribute_display_form/obj/1',
                    type: 'attribute'
                }
            ]
        };

        const measure: IMeasure = afm.measures[1];
        const defaultFormat = '#,##0.00000';
        expect(getMeasureFormat(measure, defaultFormat, afm)).toEqual(SHOW_IN_PERCENT_MEASURE_FORMAT);
    });
});
