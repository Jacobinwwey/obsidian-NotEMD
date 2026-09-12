test('intentionally rejects the isolated CI negative acceptance branch', () => {
    expect('deliberate negative fixture').toBe('this branch must never merge');
});
