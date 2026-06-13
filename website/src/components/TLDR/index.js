import React from 'react';
import styles from './styles.module.css';

/**
 * TLDR (Too Long; Didn't Read) component
 * Provides high-density summary optimized for AI/LLM crawlers
 * Should be placed immediately after the H1 title
 */
export default function TLDR({children}) {
  return (
    <div className={styles.tldr} itemScope itemType="https://schema.org/Summary">
      <div className={styles.tldrHeader}>
        <span className={styles.tldrIcon}>💡</span>
        <strong>TL;DR</strong>
      </div>
      <div className={styles.tldrContent} itemProp="text">
        {children}
      </div>
    </div>
  );
}
