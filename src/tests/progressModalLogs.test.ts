import { ProgressModal } from '../ui/ProgressModal';
import { mockApp } from './__mocks__/app';

test('records modal task logs before mounting and retains visible entries across subtask resets', () => {
    const modal = new ProgressModal(mockApp);
    modal.log('generation started');
    const logElement = { empty: jest.fn() };
    (modal as any).logEl = logElement;
    modal.clearDisplay();
    expect(modal.getLogs()).toContain('generation started');
    expect(logElement.empty).not.toHaveBeenCalled();
});
