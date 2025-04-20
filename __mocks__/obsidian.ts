export const App = jest.fn();
export const Editor = jest.fn();
export const MarkdownView = jest.fn();
export const Modal = jest.fn();
export const Notice = jest.fn();
export const Plugin = jest.fn();
export const PluginSettingTab = jest.fn();
export const Setting = jest.fn().mockImplementation(() => ({
	setName: jest.fn().mockReturnThis(),
	setDesc: jest.fn().mockReturnThis(),
	addText: jest.fn().mockReturnThis(),
	addToggle: jest.fn().mockReturnThis(),
	addSlider: jest.fn().mockReturnThis(),
	addButton: jest.fn().mockReturnThis(),
	addDropdown: jest.fn().mockReturnThis(),
}));
export const TFile = jest.fn();
export const TFolder = jest.fn();

// Basic mock for ItemView to allow extension
export class ItemView {
	app: any;
	leaf: any;
	containerEl: { children: any[] }; // Mock basic structure

	constructor(leaf: any) {
		this.leaf = leaf;
		// Mock containerEl structure needed by the view's onOpen
		this.containerEl = {
			children: [
				null, // Placeholder for header or other elements
				{ // Placeholder for the content container
					empty: jest.fn(),
					createEl: jest.fn().mockImplementation((tag, options) => {
						// Return a mock element with an onclick property if it's a button
						const el = {
							onclick: jest.fn(),
							setText: jest.fn(),
							addClass: jest.fn(),
							setAttribute: jest.fn(),
							disabled: false, // Add disabled property for buttons
						};
						return el;
					}),
					addClass: jest.fn(),
					createDiv: jest.fn().mockImplementation(() => ({ // Mock createDiv for buttonGroup
						createEl: jest.fn().mockImplementation((tag, options) => ({
							onclick: jest.fn(),
							disabled: false,
							setText: jest.fn(), // Add setText for button text changes
						})),
					})),
				}
			]
		};
	}
	getViewType() { return 'mock-view'; }
	getDisplayText() { return 'Mock View'; }
	getIcon() { return 'mock-icon'; }
	async onOpen() {}
	async onClose() {}
}

// Basic mock for WorkspaceLeaf
export const WorkspaceLeaf = jest.fn().mockImplementation(() => ({
	// Add any methods or properties your code interacts with
}));
