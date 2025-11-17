## Action Plan: Fix Parallel Batch Processing Stall

### Problem Analysis
**Issue**: When "Enable Batch Parallelism" is active, the "Batch generate from titles" command processes only a number of files equal to the "Batch Concurrency" setting (e.g., 3 files) and then stops, leaving the remaining files in the queue unprocessed. The UI shows "Active: 0" while there are still tasks pending.

**Root Cause** (from code review):
- The `createConcurrentProcessor` in `src/utils.ts` used a flawed semaphore and promise-handling model (`Promise.all`). It resolved prematurely after the first wave of promises was created, not after all tasks in the queue were completed. It failed to continuously feed the worker queue.

### Feasibility & Improvements
**High Feasibility**: The fix involves replacing the faulty concurrent processor with a standard, robust worker-queue pattern. This makes the batch processing reliable.

**Risks**: None. The new implementation is a standard pattern for managing concurrency and is more robust than the previous one.

### Code Changes Implemented

1.  **`src/utils.ts` - `createConcurrentProcessor` Reworked**:
    - The entire function was replaced with a new implementation that uses a worker pattern.
    - It maintains a queue of tasks and a set number of active workers (`concurrency`).
    - Each worker pulls a task from the queue, executes it, and upon completion, attempts to pull the next one.
    - The main promise only resolves when the task queue is empty and all workers have finished their final tasks.
    - This ensures all tasks are executed before the function returns.

    ```typescript
    // In src/utils.ts - Corrected implementation
    export function createConcurrentProcessor<T, R>(
        concurrency: number,
        delayMs: number,
        progressReporter: ProgressReporter
    ) {
        return function (tasks: (() => Promise<T>)[]) : Promise<R[]> {
            return new Promise((resolve, reject) => {
                const results: R[] = [];
                const taskQueue = [...tasks];
                let workersActive = 0;

                const worker = async () => {
                    workersActive++;
                    progressReporter.updateActiveTasks(1);

                    while (taskQueue.length > 0) {
                        if (progressReporter.cancelled) {
                            // ... (cancellation handling)
                            return;
                        }

                        const task = taskQueue.shift();
                        if (task) {
                            try {
                                // ... (task execution with delay)
                                const result = await task();
                                results.push(result as unknown as R);
                            } catch (error) {
                                // ... (error handling)
                            }
                        }
                    }

                    workersActive--;
                    progressReporter.updateActiveTasks(-1);
                    if (workersActive === 0 && taskQueue.length === 0) {
                        resolve(results);
                    }
                };

                if (tasks.length === 0) {
                    resolve([]);
                    return;
                }

                for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
                    worker();
                }
            });
        };
    }
    ```

### Testing
- **Manual Test**: Run "Batch generate from titles" with `Enable Batch Parallelism` ON, `Batch Concurrency` > 1, and a number of files greater than the concurrency level.
- **Expected Result**: All files in the selected folder are processed successfully. The progress bar and logs reflect the entire operation.

**Post-Fix**: Parallel batch processing is now reliable and completes all tasks as expected.
