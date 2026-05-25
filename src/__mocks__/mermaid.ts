export default {
    initialize: jest.fn(),
    parse: jest.fn(async () => {
        // Default: no errors
        return true;
    }),
    render: jest.fn(async (_id: string, source: string) => ({
        svg: `<svg data-source="${source.replace(/"/g, '&quot;')}"></svg>`
    }))
};
