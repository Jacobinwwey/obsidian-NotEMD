import { checkMermaidErrors } from '../mermaidProcessor';
import mermaid from 'mermaid';

// Mock mermaid
jest.mock('mermaid', () => {
  return {
    __esModule: true,
    default: {
      initialize: jest.fn(),
      parse: jest.fn(),
    },
  };
});

describe('checkMermaidErrors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when there are no mermaid blocks', async () => {
    const content = 'Just some markdown text.';
    const errors = await checkMermaidErrors(content);
    expect(errors).toBe(0);
    // mermaid is the default export object
    expect(mermaid.parse).not.toHaveBeenCalled();
  });

  it('should return 0 when mermaid block is valid', async () => {
    const content = '```mermaid\ngraph TD\nA-->B\n```';
    (mermaid.parse as jest.Mock).mockResolvedValue(true);
    
    const errors = await checkMermaidErrors(content);
    expect(errors).toBe(0);
    expect(mermaid.parse).toHaveBeenCalledTimes(1);
  });

  it('should return 1 when one mermaid block is invalid', async () => {
    const content = '```mermaid\ngraph TD\nA-->\n```';
    (mermaid.parse as jest.Mock).mockRejectedValue(new Error('Parse error'));
    
    const errors = await checkMermaidErrors(content);
    expect(errors).toBe(1);
    expect(mermaid.parse).toHaveBeenCalledTimes(1);
  });

  it('should count multiple errors', async () => {
    const content = "```mermaid\ngraph TD\nA-->\n```\n\nSome text\n\n```mermaid\ngraph TD\nC-->D\n```\n\n```mermaid\ngraph TD\nE-->\n```";
    
    // First call fails, second succeeds, third fails
    (mermaid.parse as jest.Mock)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Error 2'));
    
    const errors = await checkMermaidErrors(content);
    expect(errors).toBe(2);
    expect(mermaid.parse).toHaveBeenCalledTimes(3);
  });
});
