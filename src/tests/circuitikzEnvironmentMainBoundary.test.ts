const mockEnvironmentModalOpen = jest.fn();
const mockIsDesktopApp = jest.fn();

jest.mock('../ui/CircuitikzEnvironmentModal', () => ({
    CircuitikzEnvironmentModal: jest.fn().mockImplementation(() => ({
        open: mockEnvironmentModalOpen
    }))
}));

jest.mock('../slideExport/platformUtils', () => ({
    ...jest.requireActual('../slideExport/platformUtils'),
    isDesktopApp: () => mockIsDesktopApp()
}));

import NotemdPlugin from '../main';
import { CircuitikzEnvironmentModal } from '../ui/CircuitikzEnvironmentModal';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

describe('CircuitikZ environment main boundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('passes a positive desktop-runtime decision to the environment modal', () => {
        mockIsDesktopApp.mockReturnValue(false);
        const plugin = new NotemdPlugin(mockApp, {} as any);
        plugin.app = mockApp;
        plugin.settings = { ...mockSettings };

        plugin.openCircuitikzEnvironment();

        expect(mockIsDesktopApp).toHaveBeenCalledTimes(1);
        expect(CircuitikzEnvironmentModal).toHaveBeenCalledWith(mockApp, expect.objectContaining({
            isDesktop: false
        }));
        expect(mockEnvironmentModalOpen).toHaveBeenCalledTimes(1);
    });
});
