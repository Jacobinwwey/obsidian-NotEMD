import mermaid from 'mermaid';

// Mock browser environment if necessary, but let's try raw first.
// Often mermaid needs 'document' or 'window' even for parse.
// We might need to supply a config or look for a specific core import.

async function test() {
  try {
    // mermaid.initialize({ startOnLoad: false }); // Optional
    await mermaid.parse('graph TD; A-->B;');
    console.log('Valid mermaid parsed successfully.');
  } catch (e) {
    console.error('Error parsing valid mermaid:', e);
  }

  try {
    await mermaid.parse('graph TD; A-->;'); // Invalid
    console.log('Invalid mermaid parsed successfully (unexpected).');
  } catch (e) {
    console.log('Invalid mermaid caught error as expected:', e.message);
  }
}

test();
