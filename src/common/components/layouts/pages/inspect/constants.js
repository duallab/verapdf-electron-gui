import _ from 'lodash';

export const errorTags = {
    Severity: [
        {
            name: 'critical',
            description: 'Critical issues that prevent further accessibility checks, such as missing tagging',
        },
        {
            name: 'major',
            description:
                'Major accessibility issues such as broken document strucure, broken syntax requirements, missing text language and others',
        },
        {
            name: 'minor',
            description:
                'Minor issues such as document structure not matching the visual representation according to AI heuristics',
        },
        {
            name: 'cosmetic',
            description:
                'Optional accessibility requirements such as the use of non-recommended fonts, merged cells in tables or others',
        },
    ],
    How: [
        {
            name: 'machine',
            description: 'Checks vefiried by direct machine algorithms',
        },
        {
            name: 'human',
            description: 'Checks that might require human verification emulated by AI heuristic algorithms',
        },
    ],
    Category: [
        {
            name: 'structure',
            description: 'Validation errors related to the structure tree',
        },
        {
            name: 'syntax',
            description:
                'Missing or incorrect required entries in PDF dictionaries or other issues in low-level PDF syntax',
        },
        {
            name: 'contrast',
            description: 'Failed WCAG color contrast requirements',
        },
        {
            name: 'metadata',
            description: 'Missing or invalid document metadata',
        },
        {
            name: 'text',
            description: 'Validation errors related to textual content on the page',
        },
        {
            name: 'alt-text',
            description: 'Missing altlernative text for figures, interactive forms and formulas',
        },
        {
            name: 'annotation',
            description: 'Issues related to annotations on the page (links, forms, or others)',
        },
        {
            name: 'artifact',
            description: 'Invalid artifacts, or content outside of structure tree not maked as artifact',
        },
        {
            name: 'font',
            description: 'Issues related to embedded fonts',
        },
        {
            name: 'lang',
            description: 'Missing or invalid language identifiaction for some part of the document',
        },
        {
            name: 'page',
            description: 'Pages having different orientation or other page-related issues',
        },
    ],
    Structure: [
        {
            name: 'paragraph',
            description: '',
        },
        {
            name: 'span',
            description: '',
        },
        {
            name: 'table',
            description: '',
        },
        {
            name: 'toc',
            description: '',
        },
        {
            name: 'note',
            description: '',
        },
        {
            name: 'list',
            description: '',
        },
        {
            name: 'caption',
            description: '',
        },
        {
            name: 'figure',
            description: '',
        },
        {
            name: 'heading',
            description: '',
        },
    ],
};

export const GROUPS = _.keys(errorTags);
export const TAGS = _.chain(errorTags)
    .values()
    .flatten()
    .value();
export const TAGS_NAMES = _.map(TAGS, ({ name }) => name);
