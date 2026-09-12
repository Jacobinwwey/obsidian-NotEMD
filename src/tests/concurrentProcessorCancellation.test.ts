import { cancellableDelay, createConcurrentProcessor } from '../utils';
import { ProgressReporter } from '../types';

function createReporter(): ProgressReporter {
    let cancelled = false;
    return {
        log: jest.fn(), updateStatus: jest.fn(), clearDisplay: jest.fn(),
        get cancelled() { return cancelled; },
        requestCancel() { cancelled = true; this.abortController?.abort(); },
        abortController: new AbortController(), activeTasks: 0,
        updateActiveTasks(delta) { this.activeTasks += delta; }
    };
}

describe('concurrent processor cancellation', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('settles cancellation before any scheduled worker starts', async () => {
        const reporter = createReporter();
        const task = jest.fn().mockResolvedValue('unused');
        let outcome: unknown;
        const running = createConcurrentProcessor(2, 100, reporter)([task, task])
            .then(result => { outcome = result; });
        reporter.requestCancel();
        reporter.requestCancel();
        await jest.runAllTimersAsync();
        expect(outcome).toEqual([]);
        await running;
        expect(task).not.toHaveBeenCalled();
        expect(reporter.activeTasks).toBe(0);
        expect(jest.getTimerCount()).toBe(0);
    });

    test('retains completed work and cancels staggered workers without leaving timers', async () => {
        const reporter = createReporter();
        let finish!: (value: string) => void;
        const first = jest.fn(() => new Promise<string>(resolve => { finish = resolve; }));
        const queued = jest.fn().mockResolvedValue('unused');
        const running = createConcurrentProcessor(3, 1000, reporter)([first, queued, queued]);
        await jest.advanceTimersByTimeAsync(0);
        expect(first).toHaveBeenCalledTimes(1);
        reporter.requestCancel();
        finish('completed');
        await jest.advanceTimersByTimeAsync(100);
        expect(jest.getTimerCount()).toBe(0);
        await expect(running).resolves.toEqual(['completed']);
        expect(queued).not.toHaveBeenCalled();
        expect(reporter.activeTasks).toBe(0);
    });

    test('preserves input order while tasks finish out of order', async () => {
        const reporter = createReporter();
        const tasks = [300, 50, 20].map((duration, index) => () => new Promise<number>(resolve => {
            setTimeout(() => resolve(index), duration);
        }));
        const running = createConcurrentProcessor(2, 100, reporter)(tasks);
        await jest.runAllTimersAsync();
        await expect(running).resolves.toEqual([0, 1, 2]);
        expect(reporter.activeTasks).toBe(0);
        expect(jest.getTimerCount()).toBe(0);
    });

    test.each([0, -1, 1.5, Infinity, NaN])('rejects invalid concurrency %s instead of leaving work pending', concurrency => {
        expect(() => createConcurrentProcessor(concurrency, 0, createReporter())).toThrow(RangeError);
    });

    test('rejects an already cancelled delay even when its duration is zero', async () => {
        const reporter = createReporter();
        reporter.requestCancel();
        const running = cancellableDelay(0, reporter);
        const rejection = expect(running).rejects.toThrow(/cancelled/i);
        await jest.runAllTimersAsync();
        await rejection;
        expect(jest.getTimerCount()).toBe(0);
    });

    test('aborts a delay with the supplied signal and releases its timers', async () => {
        const reporter = createReporter();
        const controller = new AbortController();
        const running = cancellableDelay(30000, reporter, controller.signal);
        const rejection = expect(running).rejects.toThrow(/cancelled/i);
        controller.abort();
        await jest.advanceTimersByTimeAsync(0);
        expect(jest.getTimerCount()).toBe(0);
        await rejection;
    });
});
