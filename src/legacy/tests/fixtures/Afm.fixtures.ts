import * as Afm from '../../../interfaces/Afm';
import * as Transformation from '../../../interfaces/Transformation';

interface IFixture {
    afm: Afm.IAfm;
    transformation: Transformation.ITransformation;
}

export const empty: IFixture = {
    afm: {},

    transformation: {}
};

export const METRIC_ID_URI = '/gdc/md/project/obj/metric.id';
export const ATTRIBUTE_DISPLAY_FORM_URI = '/gdc/md/project/obj/1';
export const ATTRIBUTE_URI = '/gdc/md/project/obj/11';
export const ATTRIBUTE_DISPLAY_FORM_URI_2 = '/gdc/md/project/obj/2';
export const ATTRIBUTE_URI_2 = '/gdc/md/project/obj/22';
export const DATE_DISPLAY_FORM_URI = '/gdc/md/project/obj/3';
export const DATE_URI = '/gdc/md/project/33';
export const DATE_DATA_SET_URI = '/gdc/md/project/333';

export const simpleMeasure: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    }
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            }
        ]
    }
};

export const filteredMeasure: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    },
                    filters: [
                        {
                            id: ATTRIBUTE_DISPLAY_FORM_URI,
                            type: 'attribute',
                            in: [
                                '1', '2'
                            ]
                        }
                    ]
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            }
        ]
    }
};

export const measureWithRelativeDate: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    },
                    filters: [
                        {
                            id: DATE_DATA_SET_URI,
                            type: 'date',
                            intervalType: 'relative',
                            granularity: 'date',
                            between: [-89, 0]
                        },
                        {
                            id: ATTRIBUTE_DISPLAY_FORM_URI,
                            type: 'attribute',
                            in: [
                                '1', '2'
                            ]
                        }
                    ]
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            }
        ]
    }
};

export const measureWithAbsoluteDate: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    },
                    filters: [
                        {
                            id: DATE_DATA_SET_URI,
                            type: 'date',
                            intervalType: 'absolute',
                            granularity: 'date',
                            between: ['2016-01-01', '2017-01-01']
                        },
                        {
                            id: ATTRIBUTE_DISPLAY_FORM_URI,
                            type: 'attribute',
                            in: [
                                '1', '2'
                            ]
                        }
                    ]
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            }
        ]
    }
};

export const popMeasure: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1_pop',
                definition: {
                    baseObject: {
                        lookupId: 'm1'
                    },
                    popAttribute: {
                        id: ATTRIBUTE_DISPLAY_FORM_URI
                    }
                }
            },
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    }
                }
            }
        ],
        attributes: [
            {
                id: ATTRIBUTE_DISPLAY_FORM_URI,
                type: 'date'
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            },
            {
                id: 'm1_pop',
                title: 'Measure M1 - previous year'
            }
        ],

        sorting: [
            { column: 'm1', direction: 'desc' }
        ]
    }
};

export const popMeasureWithSorting: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1_pop',
                definition: {
                    baseObject: {
                        lookupId: 'm1'
                    },
                    popAttribute: {
                        id: ATTRIBUTE_DISPLAY_FORM_URI
                    }
                }
            },
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    }
                }
            }
        ],
        attributes: [
            {
                id: ATTRIBUTE_DISPLAY_FORM_URI,
                type: 'date'
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            },
            {
                id: 'm1_pop',
                title: 'Measure M1 - previous year'
            }
        ],

        sorting: [
            {
                column: 'm1_pop',
                direction: 'desc'
            }
        ]
    }
};

export const showInPercent: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    },
                    showInPercent: true
                }
            }
        ],

        attributes: [
            {
                id: ATTRIBUTE_DISPLAY_FORM_URI,
                type: 'attribute'
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1',
                format: '#,##0.00%'
            }
        ]
    }
};

export const showInPercentWithDate: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    },
                    showInPercent: true
                }
            }
        ],

        attributes: [
            {
                id: DATE_DISPLAY_FORM_URI,
                type: 'date'
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1',
                format: '#,##0.00%'
            }
        ]
    }
};

export const measureWithSorting: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: METRIC_ID_URI
                    }
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'Measure M1'
            }
        ],
        sorting: [
            { column: 'm1', direction: 'desc' }
        ]
    }
};

export const categoryWithSorting: IFixture = {
    afm: {
        attributes: [
            {
                id: ATTRIBUTE_DISPLAY_FORM_URI,
                type: 'attribute'
            }
        ]
    },

    transformation: {
        sorting: [
            {
                column: ATTRIBUTE_DISPLAY_FORM_URI,
                direction: 'desc'
            }
        ]
    }
};

export const factBasedMeasure: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: '/gdc/md/project/obj/fact.id'
                    },
                    aggregation: 'sum'
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'SUM of Measure M1'
            }
        ]
    }
};

export const attributeBasedMeasure: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: ATTRIBUTE_DISPLAY_FORM_URI
                    },
                    aggregation: 'count'
                }
            }
        ]
    },

    transformation: {
        measures: [
            {
                id: 'm1',
                title: 'COUNT of Measure M1'
            }
        ]
    }
};

export const stackingAttribute: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    aggregation: 'sum',
                    baseObject: {
                        id: METRIC_ID_URI
                    }
                }
            }
        ],
        attributes: [
            {
                id: DATE_DISPLAY_FORM_URI,
                type: 'date'
            },
            {
                id: ATTRIBUTE_DISPLAY_FORM_URI,
                type: 'attribute'
            }
        ],
        filters: [
            {
                id: DATE_DATA_SET_URI,
                intervalType: 'relative',
                between: [-3, 0],
                granularity: 'quarter',
                type: 'date'
            },
            {
                id: ATTRIBUTE_DISPLAY_FORM_URI,
                type: 'attribute',
                notIn: ['1']
            }
        ]
    },

    transformation: {
        measures: [
            { id: 'm1', title: 'Sum of Bundle cost', format: '#,##0.00' }
        ],
        buckets: [
            {
                name: 'stacks',
                attributes: [
                    {
                        id: ATTRIBUTE_DISPLAY_FORM_URI
                    }
                ]
            }
        ]
    }
};

export const attributeFilter: IFixture = {
    afm: {
        filters: [{
            id: ATTRIBUTE_DISPLAY_FORM_URI,
            type: 'attribute',
            in: [
                '1', '2', '3'
            ]
        }, {
            id: ATTRIBUTE_DISPLAY_FORM_URI_2,
            type: 'attribute',
            in: ['a']
        }]
    },
    transformation: {}
};

export const attributeFilterWithAll: IFixture = {
    afm: {
        filters: [{
            id: ATTRIBUTE_DISPLAY_FORM_URI_2,
            type: 'attribute',
            in: ['a']
        }]
    },
    transformation: {}
};

export const dateFilter: IFixture = {
    afm: {
        filters: [{
            id: DATE_DATA_SET_URI,
            type: 'date',
            intervalType: 'relative',
            between: [-89, 0],
            granularity: 'date'
        }]
    },
    transformation: {}
};

export const dateFilterWithoutInterval: IFixture = {
    afm: {
        filters: [{
            id: DATE_DATA_SET_URI,
            type: 'date',
            intervalType: 'relative',
            between: [undefined, undefined],
            granularity: 'date'
        }]
    },
    transformation: {}
};

export const attributeWithIdentifier: IFixture = {
    afm: {
        measures: [
            {
                id: 'm1',
                definition: {
                    baseObject: {
                        id: 'foo'
                    }
                }
            }
        ],
        attributes: [
            {
                id: 'bar',
                type: 'attribute'
            }
        ]
    },

    transformation: {}
};
