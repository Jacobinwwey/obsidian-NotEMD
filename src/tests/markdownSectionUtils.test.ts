import {
    parseMarkdownSections,
    planMarkdownChapterSections,
    resolveChapterSplitHeadingLevel
} from '../markdownSectionUtils';

describe('markdownSectionUtils', () => {
    test('parses heading sections with breadcrumbs and ignores headings inside code fences', () => {
        const markdown = [
            'Intro paragraph.',
            '',
            '# Root',
            'Root body.',
            '',
            '## Overview',
            'Overview body.',
            '',
            '```md',
            '# Not a real heading',
            '```',
            '',
            '### Details',
            'Detail body.',
            '',
            '## Appendix',
            'Appendix body.'
        ].join('\n');

        const sections = parseMarkdownSections(markdown, 'Sample Note');

        expect(sections.map(section => ({
            title: section.title,
            level: section.level,
            breadcrumb: section.breadcrumb
        }))).toEqual([
            {
                title: 'Sample Note',
                level: 0,
                breadcrumb: ['Sample Note']
            },
            {
                title: 'Root',
                level: 1,
                breadcrumb: ['Root']
            },
            {
                title: 'Overview',
                level: 2,
                breadcrumb: ['Root', 'Overview']
            },
            {
                title: 'Details',
                level: 3,
                breadcrumb: ['Root', 'Overview', 'Details']
            },
            {
                title: 'Appendix',
                level: 2,
                breadcrumb: ['Root', 'Appendix']
            }
        ]);

        expect(sections.some(section => section.title === 'Not a real heading')).toBe(false);
    });

    test('splits by h2 when the note has a single h1 with h2 chapters', () => {
        const markdown = [
            '# Platform',
            'Intro',
            '',
            '## Overview',
            'Overview body',
            '',
            '### Details',
            'Details body',
            '',
            '## Appendix',
            'Appendix body'
        ].join('\n');

        const sections = parseMarkdownSections(markdown, 'Platform');
        const splitLevel = resolveChapterSplitHeadingLevel(sections);
        const plan = planMarkdownChapterSections(markdown, 'Notes/Platform.md', 'Platform');

        expect(splitLevel).toBe(2);
        expect(plan.splitLevel).toBe(2);
        expect(plan.chapters).toHaveLength(2);
        expect(plan.chapters[0].title).toBe('Overview');
        expect(plan.chapters[0].markdown).toContain('# Platform');
        expect(plan.chapters[0].markdown).toContain('## Overview');
        expect(plan.chapters[0].markdown).toContain('### Details');
        expect(plan.chapters[0].nestedHeadings.map(heading => heading.text)).toEqual(['Details']);
        expect(plan.chapters[1].title).toBe('Appendix');
        expect(plan.chapters[1].markdown).toContain('## Appendix');
        expect(plan.chapters[1].markdown).not.toContain('## Overview');
    });

    test('preserves unicode chapter titles in generated file names', () => {
        const markdown = [
            '# 架构路线图',
            '',
            '## 系统设计',
            '设计内容',
            '',
            '## 发布计划',
            '发布内容'
        ].join('\n');

        const plan = planMarkdownChapterSections(markdown, 'Notes/架构路线图.md', '架构路线图');

        expect(plan.chapters[0].outputFileName).toBe('01-系统设计.md');
        expect(plan.chapters[1].outputFileName).toBe('02-发布计划.md');
    });

    test('honors an explicit split heading level override when configured', () => {
        const markdown = [
            '# Platform',
            'Intro',
            '',
            '## Overview',
            'Overview body',
            '',
            '### Scope',
            'Scope body',
            '',
            '### Delivery',
            'Delivery body'
        ].join('\n');

        const plan = planMarkdownChapterSections(markdown, 'Notes/Platform.md', 'Platform', {
            splitHeadingLevel: 'h3'
        });

        expect(plan.splitLevel).toBe(3);
        expect(plan.chapters).toHaveLength(2);
        expect(plan.chapters[0].title).toBe('Scope');
        expect(plan.chapters[0].markdown).toContain('### Scope');
        expect(plan.chapters[0].markdown).toContain('## Overview');
        expect(plan.chapters[1].title).toBe('Delivery');
    });

    test('fails fast when an explicit split heading level is configured but not present', () => {
        const markdown = [
            '# Platform',
            '',
            '## Overview',
            'Overview body'
        ].join('\n');

        expect(() => planMarkdownChapterSections(markdown, 'Notes/Platform.md', 'Platform', {
            splitHeadingLevel: 'h3'
        })).toThrow('Configured chapter split heading level H3 was not found in the note.');
    });

    test('falls back to a single section when no markdown headings exist', () => {
        const markdown = [
            'Paragraph one.',
            '',
            'Paragraph two.'
        ].join('\n');

        const sections = parseMarkdownSections(markdown, 'Plain Note');
        const plan = planMarkdownChapterSections(markdown, 'Notes/Plain Note.md', 'Plain Note');

        expect(resolveChapterSplitHeadingLevel(sections)).toBeNull();
        expect(plan.splitLevel).toBeNull();
        expect(plan.chapters).toHaveLength(1);
        expect(plan.chapters[0].title).toBe('Plain Note');
        expect(plan.chapters[0].markdown).toContain('Paragraph one.');
        expect(plan.chapters[0].nestedHeadings).toEqual([]);
    });
});
