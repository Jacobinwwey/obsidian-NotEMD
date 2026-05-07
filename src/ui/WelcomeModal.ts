import { App, Modal } from 'obsidian';
import { getI18nStrings } from '../i18n';
import { getWelcomeReleaseNotes } from './welcomeReleaseNotes';

export class WelcomeModal extends Modal {
    private uiLocale: string;

    constructor(app: App, uiLocale: string) {
        super(app);
        this.uiLocale = uiLocale;
    }

    onOpen(): void {
        const i18n = getI18nStrings({ uiLocale: this.uiLocale });
        const w = i18n.settings?.welcome;
        if (!w) {
            this.close();
            return;
        }

        this.modalEl.addClass('notemd-welcome-modal');
        this.titleEl.setText(w.title);
        this.contentEl.empty();

        const body = this.contentEl.createDiv({ cls: 'notemd-welcome-body' });

        body.createEl('p', { text: w.introText, cls: 'notemd-welcome-text' });
        body.createEl('p', { text: w.setupHint, cls: 'notemd-welcome-text' });

        const releaseNotesCard = body.createDiv({ cls: 'notemd-welcome-release-notes' });
        releaseNotesCard.createEl('h3', {
            text: w.releaseNotesHeading,
            cls: 'notemd-welcome-release-notes-heading'
        });
        releaseNotesCard.createEl('p', {
            text: w.releaseNotesIntro,
            cls: 'notemd-welcome-release-notes-intro'
        });

        const releaseNotesScroll = releaseNotesCard.createDiv({
            cls: 'notemd-welcome-release-notes-scroll'
        });
        const releaseNotes = getWelcomeReleaseNotes(this.uiLocale);
        for (const release of releaseNotes) {
            const section = releaseNotesScroll.createDiv({
                cls: 'notemd-welcome-release-note'
            });
            section.createEl('h4', {
                text: `v${release.version}`,
                cls: 'notemd-welcome-release-note-title'
            });
            const list = section.createEl('ul', {
                cls: 'notemd-welcome-release-note-list'
            });
            for (const highlight of release.highlights) {
                list.createEl('li', {
                    text: highlight,
                    cls: 'notemd-welcome-release-note-item'
                });
            }
        }

        body.createEl('p', { text: w.sponsorText, cls: 'notemd-welcome-sponsor' });

        if (w.closingText) {
            body.createEl('p', { text: w.closingText, cls: 'notemd-welcome-closing' });
        }

        const buttonContainer = this.contentEl.createDiv({ cls: 'notemd-welcome-buttons' });

        const configureBtn = buttonContainer.createEl('button', {
            text: w.configureButton,
            cls: 'mod-cta'
        });
        configureBtn.setAttr('type', 'button');
        configureBtn.addEventListener('click', () => {
            this.close();
            (this.app as any).setting?.openTabById?.('notemd');
        });

        const sponsorBtn = buttonContainer.createEl('button', {
            text: w.sponsorButton,
        });
        sponsorBtn.setAttr('type', 'button');
        sponsorBtn.addEventListener('click', () => {
            window.open('https://github.com/Jacobinwwey/obsidian-NotEMD', '_blank');
        });

        if (w.coffeeButton) {
            const coffeeBtn = buttonContainer.createEl('button', {
                text: w.coffeeButton,
            });
            coffeeBtn.setAttr('type', 'button');
            coffeeBtn.addEventListener('click', () => {
                window.open('https://ko-fi.com/jacobinwwey', '_blank');
            });
        }

        const closeBtn = buttonContainer.createEl('button', {
            text: w.closeButton,
        });
        closeBtn.setAttr('type', 'button');
        closeBtn.addEventListener('click', () => {
            this.close();
        });

        requestAnimationFrame(() => {
            configureBtn.focus();
        });
    }

    onClose(): void {
        this.contentEl.empty();
        this.modalEl.removeClass('notemd-welcome-modal');
    }
}
