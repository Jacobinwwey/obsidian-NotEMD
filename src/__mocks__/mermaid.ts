export default {
    initialize: jest.fn(),
    parse: jest.fn(async () => {
        // Default: no errors
        return true;
    }),
};
