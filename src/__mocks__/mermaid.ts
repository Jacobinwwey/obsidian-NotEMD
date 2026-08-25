export default {
    initialize: jest.fn(),
    parse: jest.fn(async () => {
        // Default: no errors
        return true;
    }),
    render: jest.fn(async (_id: string, source: string) => ({
        svg: `<svg viewBox="0 0 100 100" data-source="${source.replace(/"/g, '&quot;')}"><rect width="100" height="100" fill="none" /></svg>`
    }))
};
