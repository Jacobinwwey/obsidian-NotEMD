import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';

function KeyboardScrollableTable(props) {
  // Infima tables are horizontal scroll containers; keyboard users need a focus target.
  return <table {...props} tabIndex={0} />;
}

export default {...MDXComponents, table: KeyboardScrollableTable};
