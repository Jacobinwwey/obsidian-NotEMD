import type { TFile } from 'obsidian';

export interface BatchProgressEntry {
    filePath: string;
    completed: boolean;
    error?: string;
    completedAt?: number;
}

export interface BatchProgressState {
    batchId: string;
    batchType: string;
    folderPath: string;
    startedAt: number;
    entries: BatchProgressEntry[];
}

/**
 * Lightweight batch progress persistence.
 * Stores state in a vault-adjacent JSON file so interrupted batches can resume
 * across Obsidian restarts.
 */
export class BatchProgressStore {
    private state: BatchProgressState | null = null;
    private statePath: string;

    constructor(vaultRoot: string) {
        this.statePath = `${vaultRoot}/.obsidian/notemd-batch-progress.json`;
    }

    /** Load existing state from disk, if any */
    load(): BatchProgressState | null {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.statePath)) {
                const raw = fs.readFileSync(this.statePath, 'utf-8');
                const state = JSON.parse(raw) as BatchProgressState;
                if (state && state.entries && Array.isArray(state.entries)) {
                    this.state = state;
                    return state;
                }
            }
        } catch {
            // Corrupted or missing file — start fresh
        }
        this.state = null;
        return null;
    }

    /** Save current state to disk atomically */
    private save(): void {
        try {
            const fs = require('fs');
            const tmp = this.statePath + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf-8');
            fs.renameSync(tmp, this.statePath);
        } catch {
            // Non-critical — batch resumes on next save
        }
    }

    /** Initialize a new batch run */
    start(batchId: string, batchType: string, folderPath: string, files: TFile[]): BatchProgressState {
        this.state = {
            batchId,
            batchType,
            folderPath,
            startedAt: Date.now(),
            entries: files.map(f => ({
                filePath: f.path,
                completed: false,
            })),
        };
        this.save();
        return this.state;
    }

    /** Mark a file as completed successfully */
    markCompleted(filePath: string): void {
        if (!this.state) return;
        const entry = this.state.entries.find(e => e.filePath === filePath);
        if (entry) {
            entry.completed = true;
            entry.completedAt = Date.now();
            delete entry.error;
            this.save();
        }
    }

    /** Mark a file as failed with error */
    markFailed(filePath: string, error: string): void {
        if (!this.state) return;
        const entry = this.state.entries.find(e => e.filePath === filePath);
        if (entry) {
            entry.completed = true;
            entry.error = error;
            entry.completedAt = Date.now();
            this.save();
        }
    }

    /** Get files that haven't been processed yet */
    getPendingPaths(): string[] {
        if (!this.state) return [];
        return this.state.entries
            .filter(e => !e.completed)
            .map(e => e.filePath);
    }

    /** Check if an interrupted batch exists and can be resumed */
    canResume(batchId: string): boolean {
        if (!this.state) return false;
        return this.state.batchId === batchId && this.getPendingPaths().length > 0;
    }

    /** Complete the batch — remove state file */
    finish(): void {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.statePath)) {
                fs.unlinkSync(this.statePath);
            }
            // Also clean up tmp if it exists
            const tmp = this.statePath + '.tmp';
            if (fs.existsSync(tmp)) {
                fs.unlinkSync(tmp);
            }
        } catch {
            // Cleanup failure is non-critical
        }
        this.state = null;
    }

    /** Get completion stats */
    getStats(): { total: number; completed: number; failed: number } {
        if (!this.state) return { total: 0, completed: 0, failed: 0 };
        const total = this.state.entries.length;
        const completed = this.state.entries.filter(e => e.completed && !e.error).length;
        const failed = this.state.entries.filter(e => e.completed && e.error).length;
        return { total, completed, failed };
    }
}
