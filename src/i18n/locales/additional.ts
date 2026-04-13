import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type LocaleStrings = DeepPartial<NotemdEnglishStrings>;

export const STRINGS_AR: LocaleStrings = {
    common: { language: 'اللغة', cancel: 'إلغاء', close: 'إغلاق', copy: 'نسخ', ready: 'جاهز', standby: 'في وضع الاستعداد', unknownError: 'خطأ غير معروف' },
    plugin: { viewName: 'مساحة عمل Notemd', ribbonTooltip: 'فتح الشريط الجانبي لـ Notemd' },
    settings: { language: { heading: 'إعدادات اللغة', uiLocaleName: 'لغة الواجهة', uiLocaleAuto: 'مطابقة لغة Obsidian', outputName: 'لغة الإخراج' } },
    sidebar: {
        defaultWorkflowName: 'استخراج بنقرة واحدة',
        sectionTitles: { core: 'التدفق الأساسي', generation: 'التوليد وMermaid', knowledge: 'المعرفة', translation: 'الترجمة', utilities: 'الأدوات' },
        actions: {
            processCurrentAddLinks: { label: 'معالجة الملف (إضافة روابط)' },
            processFolderAddLinks: { label: 'معالجة المجلد (إضافة روابط)' },
            generateFromTitle: { label: 'إنشاء من العنوان' },
            batchGenerateFromTitles: { label: 'إنشاء جماعي من العناوين' },
            researchAndSummarize: { label: 'بحث وتلخيص' },
            summarizeAsMermaid: { label: 'تلخيص كمخطط Mermaid' },
            translateCurrentFile: { label: 'ترجمة الملف الحالي' },
            batchTranslateFolder: { label: 'ترجمة مجلد دفعة واحدة' },
            extractConceptsCurrent: { label: 'استخراج المفاهيم (الملف الحالي)' },
            extractConceptsFolder: { label: 'استخراج المفاهيم (المجلد)' },
            extractOriginalText: { label: 'استخراج النص الأصلي المحدد' },
            batchMermaidFix: { label: 'إصلاح Mermaid دفعة واحدة' },
            fixFormulaCurrent: { label: 'إصلاح صيغ المعادلات (الحالي)' },
            batchFixFormula: { label: 'إصلاح صيغ المعادلات دفعة واحدة' },
            checkDuplicatesCurrent: { label: 'فحص التكرارات (الملف الحالي)' },
            checkRemoveDuplicateConcepts: { label: 'فحص وإزالة التكرارات' },
            testLlmConnection: { label: 'اختبار اتصال LLM' }
        }
    },
    progressModal: { heading: 'معالجة Notemd', starting: 'جارٍ البدء...', cancelProgress: 'إلغاء', timeRemainingCalculating: 'الوقت المقدر المتبقي: جارٍ الحساب...', cancelledOrError: 'أُلغي/خطأ' }
};

export const STRINGS_DE: LocaleStrings = {
    common: { language: 'Sprache', cancel: 'Abbrechen', close: 'Schließen', copy: 'Kopieren', ready: 'Bereit', standby: 'Bereitschaft', unknownError: 'Unbekannter Fehler' },
    plugin: { viewName: 'Notemd-Arbeitsbereich', ribbonTooltip: 'Notemd-Seitenleiste öffnen' },
    settings: { language: { heading: 'Spracheinstellungen', uiLocaleName: 'UI-Sprache', uiLocaleAuto: 'Obsidian folgen', outputName: 'Ausgabesprache' } },
    sidebar: {
        defaultWorkflowName: 'Extraktion mit einem Klick',
        sectionTitles: { core: 'Kernablauf', generation: 'Generierung & Mermaid', knowledge: 'Wissen', translation: 'Übersetzung', utilities: 'Werkzeuge' },
        actions: {
            processCurrentAddLinks: { label: 'Datei verarbeiten (Links hinzufügen)' },
            processFolderAddLinks: { label: 'Ordner verarbeiten (Links hinzufügen)' },
            generateFromTitle: { label: 'Aus Titel generieren' },
            batchGenerateFromTitles: { label: 'Stapelweise aus Titeln generieren' },
            researchAndSummarize: { label: 'Recherchieren & zusammenfassen' },
            summarizeAsMermaid: { label: 'Als Mermaid-Diagramm zusammenfassen' },
            translateCurrentFile: { label: 'Aktuelle Datei übersetzen' },
            batchTranslateFolder: { label: 'Ordner stapelweise übersetzen' },
            extractConceptsCurrent: { label: 'Konzepte extrahieren (aktuelle Datei)' },
            extractConceptsFolder: { label: 'Konzepte extrahieren (Ordner)' },
            extractOriginalText: { label: 'Bestimmten Originaltext extrahieren' },
            batchMermaidFix: { label: 'Mermaid stapelweise reparieren' },
            fixFormulaCurrent: { label: 'Formelformate reparieren (aktuell)' },
            batchFixFormula: { label: 'Formelformate stapelweise reparieren' },
            checkDuplicatesCurrent: { label: 'Duplikate prüfen (aktuelle Datei)' },
            checkRemoveDuplicateConcepts: { label: 'Duplikate prüfen & entfernen' },
            testLlmConnection: { label: 'LLM-Verbindung testen' }
        }
    },
    progressModal: { heading: 'Notemd-Verarbeitung', starting: 'Wird gestartet...', cancelProgress: 'Abbrechen', timeRemainingCalculating: 'Geschätzte Restzeit: wird berechnet...', cancelledOrError: 'Abgebrochen/Fehler' }
};

export const STRINGS_ES: LocaleStrings = {
    common: { language: 'Idioma', cancel: 'Cancelar', close: 'Cerrar', copy: 'Copiar', ready: 'Listo', standby: 'En espera', unknownError: 'Error desconocido' },
    plugin: { viewName: 'Espacio de trabajo de Notemd', ribbonTooltip: 'Abrir la barra lateral de Notemd' },
    settings: { language: { heading: 'Configuración de idioma', uiLocaleName: 'Idioma de la interfaz', uiLocaleAuto: 'Seguir Obsidian', outputName: 'Idioma de salida' } },
    sidebar: {
        defaultWorkflowName: 'Extracción con un clic',
        sectionTitles: { core: 'Flujo principal', generation: 'Generación y Mermaid', knowledge: 'Conocimiento', translation: 'Traducción', utilities: 'Utilidades' },
        actions: {
            processCurrentAddLinks: { label: 'Procesar archivo (añadir enlaces)' },
            processFolderAddLinks: { label: 'Procesar carpeta (añadir enlaces)' },
            generateFromTitle: { label: 'Generar desde el título' },
            batchGenerateFromTitles: { label: 'Generación por lotes desde títulos' },
            researchAndSummarize: { label: 'Investigar y resumir' },
            summarizeAsMermaid: { label: 'Resumir como diagrama Mermaid' },
            translateCurrentFile: { label: 'Traducir archivo actual' },
            batchTranslateFolder: { label: 'Traducir carpeta por lotes' },
            extractConceptsCurrent: { label: 'Extraer conceptos (archivo actual)' },
            extractConceptsFolder: { label: 'Extraer conceptos (carpeta)' },
            extractOriginalText: { label: 'Extraer texto original específico' },
            batchMermaidFix: { label: 'Corregir Mermaid por lotes' },
            fixFormulaCurrent: { label: 'Corregir formatos de fórmulas (actual)' },
            batchFixFormula: { label: 'Corregir formatos de fórmulas por lotes' },
            checkDuplicatesCurrent: { label: 'Comprobar duplicados (archivo actual)' },
            checkRemoveDuplicateConcepts: { label: 'Comprobar y eliminar duplicados' },
            testLlmConnection: { label: 'Probar conexión LLM' }
        }
    },
    progressModal: { heading: 'Procesamiento de Notemd', starting: 'Iniciando...', cancelProgress: 'Cancelar', timeRemainingCalculating: 'Tiempo restante estimado: calculando...', cancelledOrError: 'Cancelado/Error' }
};

export const STRINGS_FA: LocaleStrings = {
    common: { language: 'زبان', cancel: 'لغو', close: 'بستن', copy: 'کپی', ready: 'آماده', standby: 'در انتظار', unknownError: 'خطای ناشناخته' },
    plugin: { viewName: 'میزکار Notemd', ribbonTooltip: 'باز کردن نوار کناری Notemd' },
    settings: { language: { heading: 'تنظیمات زبان', uiLocaleName: 'زبان رابط کاربری', uiLocaleAuto: 'همگام با Obsidian', outputName: 'زبان خروجی' } },
    sidebar: {
        defaultWorkflowName: 'استخراج تک‌کلیکی',
        sectionTitles: { core: 'جریان اصلی', generation: 'تولید و Mermaid', knowledge: 'دانش', translation: 'ترجمه', utilities: 'ابزارها' },
        actions: {
            processCurrentAddLinks: { label: 'پردازش فایل (افزودن پیوندها)' },
            processFolderAddLinks: { label: 'پردازش پوشه (افزودن پیوندها)' },
            generateFromTitle: { label: 'تولید از عنوان' },
            batchGenerateFromTitles: { label: 'تولید دسته‌ای از عنوان‌ها' },
            researchAndSummarize: { label: 'پژوهش و خلاصه‌سازی' },
            summarizeAsMermaid: { label: 'خلاصه‌سازی به صورت نمودار Mermaid' },
            translateCurrentFile: { label: 'ترجمه فایل فعلی' },
            batchTranslateFolder: { label: 'ترجمه دسته‌ای پوشه' },
            extractConceptsCurrent: { label: 'استخراج مفاهیم (فایل فعلی)' },
            extractConceptsFolder: { label: 'استخراج مفاهیم (پوشه)' },
            extractOriginalText: { label: 'استخراج متن اصلی مشخص' },
            batchMermaidFix: { label: 'اصلاح دسته‌ای Mermaid' },
            fixFormulaCurrent: { label: 'اصلاح قالب فرمول‌ها (فعلی)' },
            batchFixFormula: { label: 'اصلاح دسته‌ای قالب فرمول‌ها' },
            checkDuplicatesCurrent: { label: 'بررسی موارد تکراری (فایل فعلی)' },
            checkRemoveDuplicateConcepts: { label: 'بررسی و حذف موارد تکراری' },
            testLlmConnection: { label: 'آزمایش اتصال LLM' }
        }
    },
    progressModal: { heading: 'پردازش Notemd', starting: 'در حال شروع...', cancelProgress: 'لغو', timeRemainingCalculating: 'زمان تقریبی باقیمانده: در حال محاسبه...', cancelledOrError: 'لغو شد/خطا' }
};

export const STRINGS_FR: LocaleStrings = {
    common: { language: 'Langue', cancel: 'Annuler', close: 'Fermer', copy: 'Copier', ready: 'Prêt', standby: 'En attente', unknownError: 'Erreur inconnue' },
    plugin: { viewName: 'Espace de travail Notemd', ribbonTooltip: 'Ouvrir le panneau latéral Notemd' },
    settings: { language: { heading: 'Paramètres de langue', uiLocaleName: 'Langue de l’interface', uiLocaleAuto: 'Suivre Obsidian', outputName: 'Langue de sortie' } },
    sidebar: {
        defaultWorkflowName: 'Extraction en un clic',
        sectionTitles: { core: 'Flux principal', generation: 'Génération et Mermaid', knowledge: 'Connaissance', translation: 'Traduction', utilities: 'Outils' },
        actions: {
            processCurrentAddLinks: { label: 'Traiter le fichier (ajouter des liens)' },
            processFolderAddLinks: { label: 'Traiter le dossier (ajouter des liens)' },
            generateFromTitle: { label: 'Générer à partir du titre' },
            batchGenerateFromTitles: { label: 'Génération par lot à partir des titres' },
            researchAndSummarize: { label: 'Rechercher et résumer' },
            summarizeAsMermaid: { label: 'Résumer en diagramme Mermaid' },
            translateCurrentFile: { label: 'Traduire le fichier actuel' },
            batchTranslateFolder: { label: 'Traduire le dossier par lot' },
            extractConceptsCurrent: { label: 'Extraire les concepts (fichier actuel)' },
            extractConceptsFolder: { label: 'Extraire les concepts (dossier)' },
            extractOriginalText: { label: 'Extraire un texte original spécifique' },
            batchMermaidFix: { label: 'Corriger Mermaid par lot' },
            fixFormulaCurrent: { label: 'Corriger les formules (actuel)' },
            batchFixFormula: { label: 'Corriger les formules par lot' },
            checkDuplicatesCurrent: { label: 'Vérifier les doublons (fichier actuel)' },
            checkRemoveDuplicateConcepts: { label: 'Vérifier et supprimer les doublons' },
            testLlmConnection: { label: 'Tester la connexion LLM' }
        }
    },
    progressModal: { heading: 'Traitement Notemd', starting: 'Démarrage...', cancelProgress: 'Annuler', timeRemainingCalculating: 'Temps restant estimé : calcul en cours...', cancelledOrError: 'Annulé/Erreur' }
};

export const STRINGS_ID: LocaleStrings = {
    common: { language: 'Bahasa', cancel: 'Batal', close: 'Tutup', copy: 'Salin', ready: 'Siap', standby: 'Siaga', unknownError: 'Kesalahan tidak diketahui' },
    plugin: { viewName: 'Ruang kerja Notemd', ribbonTooltip: 'Buka bilah sisi Notemd' },
    settings: { language: { heading: 'Pengaturan bahasa', uiLocaleName: 'Bahasa UI', uiLocaleAuto: 'Ikuti Obsidian', outputName: 'Bahasa keluaran' } },
    sidebar: {
        defaultWorkflowName: 'Ekstraksi Sekali Klik',
        sectionTitles: { core: 'Alur Inti', generation: 'Generasi & Mermaid', knowledge: 'Pengetahuan', translation: 'Terjemahan', utilities: 'Utilitas' },
        actions: {
            processCurrentAddLinks: { label: 'Proses file (tambah tautan)' },
            processFolderAddLinks: { label: 'Proses folder (tambah tautan)' },
            generateFromTitle: { label: 'Buat dari judul' },
            batchGenerateFromTitles: { label: 'Pembuatan massal dari judul' },
            researchAndSummarize: { label: 'Riset & rangkum' },
            summarizeAsMermaid: { label: 'Ringkas sebagai diagram Mermaid' },
            translateCurrentFile: { label: 'Terjemahkan file saat ini' },
            batchTranslateFolder: { label: 'Terjemahkan folder secara massal' },
            extractConceptsCurrent: { label: 'Ekstrak konsep (file saat ini)' },
            extractConceptsFolder: { label: 'Ekstrak konsep (folder)' },
            extractOriginalText: { label: 'Ekstrak teks asli tertentu' },
            batchMermaidFix: { label: 'Perbaikan Mermaid massal' },
            fixFormulaCurrent: { label: 'Perbaiki format rumus (saat ini)' },
            batchFixFormula: { label: 'Perbaiki format rumus massal' },
            checkDuplicatesCurrent: { label: 'Periksa duplikat (file saat ini)' },
            checkRemoveDuplicateConcepts: { label: 'Periksa & hapus duplikat' },
            testLlmConnection: { label: 'Uji koneksi LLM' }
        }
    },
    progressModal: { heading: 'Pemrosesan Notemd', starting: 'Memulai...', cancelProgress: 'Batal', timeRemainingCalculating: 'Perkiraan sisa waktu: menghitung...', cancelledOrError: 'Dibatalkan/Kesalahan' }
};

export const STRINGS_IT: LocaleStrings = {
    common: { language: 'Lingua', cancel: 'Annulla', close: 'Chiudi', copy: 'Copia', ready: 'Pronto', standby: 'In attesa', unknownError: 'Errore sconosciuto' },
    plugin: { viewName: 'Area di lavoro Notemd', ribbonTooltip: 'Apri la barra laterale di Notemd' },
    settings: { language: { heading: 'Impostazioni lingua', uiLocaleName: 'Lingua dell’interfaccia', uiLocaleAuto: 'Segui Obsidian', outputName: 'Lingua di output' } },
    sidebar: {
        defaultWorkflowName: 'Estrazione con un clic',
        sectionTitles: { core: 'Flusso principale', generation: 'Generazione e Mermaid', knowledge: 'Conoscenza', translation: 'Traduzione', utilities: 'Utilità' },
        actions: {
            processCurrentAddLinks: { label: 'Elabora file (aggiungi link)' },
            processFolderAddLinks: { label: 'Elabora cartella (aggiungi link)' },
            generateFromTitle: { label: 'Genera dal titolo' },
            batchGenerateFromTitles: { label: 'Generazione batch dai titoli' },
            researchAndSummarize: { label: 'Ricerca e riassunto' },
            summarizeAsMermaid: { label: 'Riassumi come diagramma Mermaid' },
            translateCurrentFile: { label: 'Traduci file corrente' },
            batchTranslateFolder: { label: 'Traduci cartella in batch' },
            extractConceptsCurrent: { label: 'Estrai concetti (file corrente)' },
            extractConceptsFolder: { label: 'Estrai concetti (cartella)' },
            extractOriginalText: { label: 'Estrai testo originale specifico' },
            batchMermaidFix: { label: 'Correzione Mermaid in batch' },
            fixFormulaCurrent: { label: 'Correggi formati formule (corrente)' },
            batchFixFormula: { label: 'Correggi formati formule in batch' },
            checkDuplicatesCurrent: { label: 'Controlla duplicati (file corrente)' },
            checkRemoveDuplicateConcepts: { label: 'Controlla e rimuovi duplicati' },
            testLlmConnection: { label: 'Testa connessione LLM' }
        }
    },
    progressModal: { heading: 'Elaborazione Notemd', starting: 'Avvio...', cancelProgress: 'Annulla', timeRemainingCalculating: 'Tempo stimato rimanente: calcolo in corso...', cancelledOrError: 'Annullato/Errore' }
};

export const STRINGS_JA: LocaleStrings = {
    common: { language: '言語', cancel: 'キャンセル', close: '閉じる', copy: 'コピー', ready: '準備完了', standby: '待機中', unknownError: '不明なエラー' },
    plugin: { viewName: 'Notemd ワークベンチ', ribbonTooltip: 'Notemd サイドバーを開く' },
    settings: { language: { heading: '言語設定', uiLocaleName: 'UI 言語', uiLocaleAuto: 'Obsidian に合わせる', outputName: '出力言語' } },
    sidebar: {
        defaultWorkflowName: 'ワンクリック抽出',
        sectionTitles: { core: 'コアフロー', generation: '生成と Mermaid', knowledge: '知識', translation: '翻訳', utilities: 'ユーティリティ' },
        actions: {
            processCurrentAddLinks: { label: 'ファイルを処理（リンク追加）' },
            processFolderAddLinks: { label: 'フォルダーを処理（リンク追加）' },
            generateFromTitle: { label: 'タイトルから生成' },
            batchGenerateFromTitles: { label: 'タイトルから一括生成' },
            researchAndSummarize: { label: '調査して要約' },
            summarizeAsMermaid: { label: 'Mermaid 図として要約' },
            translateCurrentFile: { label: '現在のファイルを翻訳' },
            batchTranslateFolder: { label: 'フォルダーを一括翻訳' },
            extractConceptsCurrent: { label: '概念を抽出（現在のファイル）' },
            extractConceptsFolder: { label: '概念を抽出（フォルダー）' },
            extractOriginalText: { label: '特定の原文を抽出' },
            batchMermaidFix: { label: 'Mermaid を一括修正' },
            fixFormulaCurrent: { label: '数式形式を修正（現在）' },
            batchFixFormula: { label: '数式形式を一括修正' },
            checkDuplicatesCurrent: { label: '重複を確認（現在のファイル）' },
            checkRemoveDuplicateConcepts: { label: '重複を確認して削除' },
            testLlmConnection: { label: 'LLM 接続をテスト' }
        }
    },
    progressModal: { heading: 'Notemd 処理', starting: '開始中...', cancelProgress: 'キャンセル', timeRemainingCalculating: '推定残り時間: 計算中...', cancelledOrError: 'キャンセル/エラー' }
};

export const STRINGS_KO: LocaleStrings = {
    common: { language: '언어', cancel: '취소', close: '닫기', copy: '복사', ready: '준비됨', standby: '대기 중', unknownError: '알 수 없는 오류' },
    plugin: { viewName: 'Notemd 워크벤치', ribbonTooltip: 'Notemd 사이드바 열기' },
    settings: { language: { heading: '언어 설정', uiLocaleName: 'UI 언어', uiLocaleAuto: 'Obsidian 따르기', outputName: '출력 언어' } },
    sidebar: {
        defaultWorkflowName: '원클릭 추출',
        sectionTitles: { core: '핵심 흐름', generation: '생성 및 Mermaid', knowledge: '지식', translation: '번역', utilities: '유틸리티' },
        actions: {
            processCurrentAddLinks: { label: '파일 처리 (링크 추가)' },
            processFolderAddLinks: { label: '폴더 처리 (링크 추가)' },
            generateFromTitle: { label: '제목에서 생성' },
            batchGenerateFromTitles: { label: '제목에서 일괄 생성' },
            researchAndSummarize: { label: '조사 및 요약' },
            summarizeAsMermaid: { label: 'Mermaid 다이어그램으로 요약' },
            translateCurrentFile: { label: '현재 파일 번역' },
            batchTranslateFolder: { label: '폴더 일괄 번역' },
            extractConceptsCurrent: { label: '개념 추출 (현재 파일)' },
            extractConceptsFolder: { label: '개념 추출 (폴더)' },
            extractOriginalText: { label: '특정 원문 추출' },
            batchMermaidFix: { label: 'Mermaid 일괄 수정' },
            fixFormulaCurrent: { label: '수식 형식 수정 (현재)' },
            batchFixFormula: { label: '수식 형식 일괄 수정' },
            checkDuplicatesCurrent: { label: '중복 확인 (현재 파일)' },
            checkRemoveDuplicateConcepts: { label: '중복 확인 및 제거' },
            testLlmConnection: { label: 'LLM 연결 테스트' }
        }
    },
    progressModal: { heading: 'Notemd 처리', starting: '시작 중...', cancelProgress: '취소', timeRemainingCalculating: '예상 남은 시간: 계산 중...', cancelledOrError: '취소됨/오류' }
};

export const STRINGS_NL: LocaleStrings = {
    common: { language: 'Taal', cancel: 'Annuleren', close: 'Sluiten', copy: 'Kopiëren', ready: 'Gereed', standby: 'Stand-by', unknownError: 'Onbekende fout' },
    plugin: { viewName: 'Notemd-werkruimte', ribbonTooltip: 'Notemd-zijbalk openen' },
    settings: { language: { heading: 'Taalinstellingen', uiLocaleName: 'UI-taal', uiLocaleAuto: 'Obsidian volgen', outputName: 'Uitvoertaal' } },
    sidebar: {
        defaultWorkflowName: 'Extractie met één klik',
        sectionTitles: { core: 'Kernstroom', generation: 'Generatie en Mermaid', knowledge: 'Kennis', translation: 'Vertaling', utilities: 'Hulpmiddelen' },
        actions: {
            processCurrentAddLinks: { label: 'Bestand verwerken (links toevoegen)' },
            processFolderAddLinks: { label: 'Map verwerken (links toevoegen)' },
            generateFromTitle: { label: 'Genereren vanuit titel' },
            batchGenerateFromTitles: { label: 'Batch genereren vanuit titels' },
            researchAndSummarize: { label: 'Onderzoeken en samenvatten' },
            summarizeAsMermaid: { label: 'Samenvatten als Mermaid-diagram' },
            translateCurrentFile: { label: 'Huidig bestand vertalen' },
            batchTranslateFolder: { label: 'Map batchgewijs vertalen' },
            extractConceptsCurrent: { label: 'Concepten extraheren (huidig bestand)' },
            extractConceptsFolder: { label: 'Concepten extraheren (map)' },
            extractOriginalText: { label: 'Specifieke originele tekst extraheren' },
            batchMermaidFix: { label: 'Batch Mermaid-herstel' },
            fixFormulaCurrent: { label: 'Formuleopmaak herstellen (huidig)' },
            batchFixFormula: { label: 'Formuleopmaak batchgewijs herstellen' },
            checkDuplicatesCurrent: { label: 'Duplicaten controleren (huidig bestand)' },
            checkRemoveDuplicateConcepts: { label: 'Duplicaten controleren en verwijderen' },
            testLlmConnection: { label: 'LLM-verbinding testen' }
        }
    },
    progressModal: { heading: 'Notemd-verwerking', starting: 'Starten...', cancelProgress: 'Annuleren', timeRemainingCalculating: 'Geschatte resterende tijd: berekenen...', cancelledOrError: 'Geannuleerd/Fout' }
};

export const STRINGS_PL: LocaleStrings = {
    common: { language: 'Język', cancel: 'Anuluj', close: 'Zamknij', copy: 'Kopiuj', ready: 'Gotowe', standby: 'Gotowość', unknownError: 'Nieznany błąd' },
    plugin: { viewName: 'Panel roboczy Notemd', ribbonTooltip: 'Otwórz pasek boczny Notemd' },
    settings: { language: { heading: 'Ustawienia języka', uiLocaleName: 'Język interfejsu', uiLocaleAuto: 'Dopasuj do Obsidian', outputName: 'Język wyjściowy' } },
    sidebar: {
        defaultWorkflowName: 'Ekstrakcja jednym kliknięciem',
        sectionTitles: { core: 'Główny przepływ', generation: 'Generowanie i Mermaid', knowledge: 'Wiedza', translation: 'Tłumaczenie', utilities: 'Narzędzia' },
        actions: {
            processCurrentAddLinks: { label: 'Przetwórz plik (dodaj linki)' },
            processFolderAddLinks: { label: 'Przetwórz folder (dodaj linki)' },
            generateFromTitle: { label: 'Generuj z tytułu' },
            batchGenerateFromTitles: { label: 'Generowanie wsadowe z tytułów' },
            researchAndSummarize: { label: 'Badanie i podsumowanie' },
            summarizeAsMermaid: { label: 'Podsumuj jako diagram Mermaid' },
            translateCurrentFile: { label: 'Przetłumacz bieżący plik' },
            batchTranslateFolder: { label: 'Przetłumacz folder wsadowo' },
            extractConceptsCurrent: { label: 'Wyodrębnij pojęcia (bieżący plik)' },
            extractConceptsFolder: { label: 'Wyodrębnij pojęcia (folder)' },
            extractOriginalText: { label: 'Wyodrębnij wskazany tekst źródłowy' },
            batchMermaidFix: { label: 'Wsadowa naprawa Mermaid' },
            fixFormulaCurrent: { label: 'Napraw formaty wzorów (bieżący)' },
            batchFixFormula: { label: 'Wsadowa naprawa formatów wzorów' },
            checkDuplicatesCurrent: { label: 'Sprawdź duplikaty (bieżący plik)' },
            checkRemoveDuplicateConcepts: { label: 'Sprawdź i usuń duplikaty' },
            testLlmConnection: { label: 'Test połączenia LLM' }
        }
    },
    progressModal: { heading: 'Przetwarzanie Notemd', starting: 'Uruchamianie...', cancelProgress: 'Anuluj', timeRemainingCalculating: 'Szacowany pozostały czas: obliczanie...', cancelledOrError: 'Anulowano/Błąd' }
};

export const STRINGS_PT: LocaleStrings = {
    common: { language: 'Idioma', cancel: 'Cancelar', close: 'Fechar', copy: 'Copiar', ready: 'Pronto', standby: 'Em espera', unknownError: 'Erro desconhecido' },
    plugin: { viewName: 'Área de trabalho do Notemd', ribbonTooltip: 'Abrir barra lateral do Notemd' },
    settings: { language: { heading: 'Configurações de idioma', uiLocaleName: 'Idioma da interface', uiLocaleAuto: 'Seguir o Obsidian', outputName: 'Idioma de saída' } },
    sidebar: {
        defaultWorkflowName: 'Extração com um clique',
        sectionTitles: { core: 'Fluxo principal', generation: 'Geração e Mermaid', knowledge: 'Conhecimento', translation: 'Tradução', utilities: 'Utilitários' },
        actions: {
            processCurrentAddLinks: { label: 'Processar arquivo (adicionar links)' },
            processFolderAddLinks: { label: 'Processar pasta (adicionar links)' },
            generateFromTitle: { label: 'Gerar a partir do título' },
            batchGenerateFromTitles: { label: 'Gerar em lote a partir dos títulos' },
            researchAndSummarize: { label: 'Pesquisar e resumir' },
            summarizeAsMermaid: { label: 'Resumir como diagrama Mermaid' },
            translateCurrentFile: { label: 'Traduzir arquivo atual' },
            batchTranslateFolder: { label: 'Traduzir pasta em lote' },
            extractConceptsCurrent: { label: 'Extrair conceitos (arquivo atual)' },
            extractConceptsFolder: { label: 'Extrair conceitos (pasta)' },
            extractOriginalText: { label: 'Extrair texto original específico' },
            batchMermaidFix: { label: 'Correção em lote do Mermaid' },
            fixFormulaCurrent: { label: 'Corrigir formatos de fórmula (atual)' },
            batchFixFormula: { label: 'Corrigir formatos de fórmula em lote' },
            checkDuplicatesCurrent: { label: 'Verificar duplicados (arquivo atual)' },
            checkRemoveDuplicateConcepts: { label: 'Verificar e remover duplicados' },
            testLlmConnection: { label: 'Testar conexão LLM' }
        }
    },
    progressModal: { heading: 'Processamento do Notemd', starting: 'Iniciando...', cancelProgress: 'Cancelar', timeRemainingCalculating: 'Tempo restante estimado: calculando...', cancelledOrError: 'Cancelado/Erro' }
};

export const STRINGS_PT_BR: LocaleStrings = {
    common: { language: 'Idioma', cancel: 'Cancelar', close: 'Fechar', copy: 'Copiar', ready: 'Pronto', standby: 'Em espera', unknownError: 'Erro desconhecido' },
    plugin: { viewName: 'Área de trabalho do Notemd', ribbonTooltip: 'Abrir barra lateral do Notemd' },
    settings: { language: { heading: 'Configurações de idioma', uiLocaleName: 'Idioma da interface', uiLocaleAuto: 'Seguir o Obsidian', outputName: 'Idioma de saída' } },
    sidebar: {
        defaultWorkflowName: 'Extração com um clique',
        sectionTitles: { core: 'Fluxo principal', generation: 'Geração e Mermaid', knowledge: 'Conhecimento', translation: 'Tradução', utilities: 'Utilitários' },
        actions: {
            processCurrentAddLinks: { label: 'Processar arquivo (adicionar links)' },
            processFolderAddLinks: { label: 'Processar pasta (adicionar links)' },
            generateFromTitle: { label: 'Gerar a partir do título' },
            batchGenerateFromTitles: { label: 'Gerar em lote a partir dos títulos' },
            researchAndSummarize: { label: 'Pesquisar e resumir' },
            summarizeAsMermaid: { label: 'Resumir como diagrama Mermaid' },
            translateCurrentFile: { label: 'Traduzir arquivo atual' },
            batchTranslateFolder: { label: 'Traduzir pasta em lote' },
            extractConceptsCurrent: { label: 'Extrair conceitos (arquivo atual)' },
            extractConceptsFolder: { label: 'Extrair conceitos (pasta)' },
            extractOriginalText: { label: 'Extrair texto original específico' },
            batchMermaidFix: { label: 'Correção em lote do Mermaid' },
            fixFormulaCurrent: { label: 'Corrigir formatos de fórmula (atual)' },
            batchFixFormula: { label: 'Corrigir formatos de fórmula em lote' },
            checkDuplicatesCurrent: { label: 'Verificar duplicados (arquivo atual)' },
            checkRemoveDuplicateConcepts: { label: 'Verificar e remover duplicados' },
            testLlmConnection: { label: 'Testar conexão LLM' }
        }
    },
    progressModal: { heading: 'Processamento do Notemd', starting: 'Iniciando...', cancelProgress: 'Cancelar', timeRemainingCalculating: 'Tempo restante estimado: calculando...', cancelledOrError: 'Cancelado/Erro' }
};

export const STRINGS_RU: LocaleStrings = {
    common: { language: 'Язык', cancel: 'Отмена', close: 'Закрыть', copy: 'Копировать', ready: 'Готово', standby: 'Ожидание', unknownError: 'Неизвестная ошибка' },
    plugin: { viewName: 'Рабочее пространство Notemd', ribbonTooltip: 'Открыть боковую панель Notemd' },
    settings: { language: { heading: 'Настройки языка', uiLocaleName: 'Язык интерфейса', uiLocaleAuto: 'Следовать Obsidian', outputName: 'Язык вывода' } },
    sidebar: {
        defaultWorkflowName: 'Извлечение в один клик',
        sectionTitles: { core: 'Основной поток', generation: 'Генерация и Mermaid', knowledge: 'Знания', translation: 'Перевод', utilities: 'Утилиты' },
        actions: {
            processCurrentAddLinks: { label: 'Обработать файл (добавить ссылки)' },
            processFolderAddLinks: { label: 'Обработать папку (добавить ссылки)' },
            generateFromTitle: { label: 'Сгенерировать по заголовку' },
            batchGenerateFromTitles: { label: 'Пакетная генерация по заголовкам' },
            researchAndSummarize: { label: 'Исследовать и суммировать' },
            summarizeAsMermaid: { label: 'Суммировать как диаграмму Mermaid' },
            translateCurrentFile: { label: 'Перевести текущий файл' },
            batchTranslateFolder: { label: 'Пакетный перевод папки' },
            extractConceptsCurrent: { label: 'Извлечь концепции (текущий файл)' },
            extractConceptsFolder: { label: 'Извлечь концепции (папка)' },
            extractOriginalText: { label: 'Извлечь указанный исходный текст' },
            batchMermaidFix: { label: 'Пакетное исправление Mermaid' },
            fixFormulaCurrent: { label: 'Исправить формулы (текущий)' },
            batchFixFormula: { label: 'Пакетное исправление формул' },
            checkDuplicatesCurrent: { label: 'Проверить дубликаты (текущий файл)' },
            checkRemoveDuplicateConcepts: { label: 'Проверить и удалить дубликаты' },
            testLlmConnection: { label: 'Проверить подключение LLM' }
        }
    },
    progressModal: { heading: 'Обработка Notemd', starting: 'Запуск...', cancelProgress: 'Отмена', timeRemainingCalculating: 'Оценка оставшегося времени: вычисление...', cancelledOrError: 'Отменено/Ошибка' }
};

export const STRINGS_TH: LocaleStrings = {
    common: { language: 'ภาษา', cancel: 'ยกเลิก', close: 'ปิด', copy: 'คัดลอก', ready: 'พร้อม', standby: 'รอ', unknownError: 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ' },
    plugin: { viewName: 'พื้นที่ทำงาน Notemd', ribbonTooltip: 'เปิดแถบด้านข้าง Notemd' },
    settings: { language: { heading: 'การตั้งค่าภาษา', uiLocaleName: 'ภาษา UI', uiLocaleAuto: 'ตาม Obsidian', outputName: 'ภาษาผลลัพธ์' } },
    sidebar: {
        defaultWorkflowName: 'สกัดข้อมูลในคลิกเดียว',
        sectionTitles: { core: 'โฟลว์หลัก', generation: 'การสร้างและ Mermaid', knowledge: 'ความรู้', translation: 'การแปล', utilities: 'เครื่องมือ' },
        actions: {
            processCurrentAddLinks: { label: 'ประมวลผลไฟล์ (เพิ่มลิงก์)' },
            processFolderAddLinks: { label: 'ประมวลผลโฟลเดอร์ (เพิ่มลิงก์)' },
            generateFromTitle: { label: 'สร้างจากชื่อเรื่อง' },
            batchGenerateFromTitles: { label: 'สร้างแบบกลุ่มจากชื่อเรื่อง' },
            researchAndSummarize: { label: 'ค้นคว้าและสรุป' },
            summarizeAsMermaid: { label: 'สรุปเป็นแผนภาพ Mermaid' },
            translateCurrentFile: { label: 'แปลไฟล์ปัจจุบัน' },
            batchTranslateFolder: { label: 'แปลโฟลเดอร์แบบกลุ่ม' },
            extractConceptsCurrent: { label: 'ดึงแนวคิด (ไฟล์ปัจจุบัน)' },
            extractConceptsFolder: { label: 'ดึงแนวคิด (โฟลเดอร์)' },
            extractOriginalText: { label: 'ดึงข้อความต้นฉบับเฉพาะ' },
            batchMermaidFix: { label: 'แก้ Mermaid แบบกลุ่ม' },
            fixFormulaCurrent: { label: 'แก้รูปแบบสูตร (ปัจจุบัน)' },
            batchFixFormula: { label: 'แก้รูปแบบสูตรแบบกลุ่ม' },
            checkDuplicatesCurrent: { label: 'ตรวจหาซ้ำ (ไฟล์ปัจจุบัน)' },
            checkRemoveDuplicateConcepts: { label: 'ตรวจและลบรายการซ้ำ' },
            testLlmConnection: { label: 'ทดสอบการเชื่อมต่อ LLM' }
        }
    },
    progressModal: { heading: 'กำลังประมวลผล Notemd', starting: 'กำลังเริ่มต้น...', cancelProgress: 'ยกเลิก', timeRemainingCalculating: 'เวลาที่เหลือโดยประมาณ: กำลังคำนวณ...', cancelledOrError: 'ยกเลิก/ข้อผิดพลาด' }
};

export const STRINGS_TR: LocaleStrings = {
    common: { language: 'Dil', cancel: 'İptal', close: 'Kapat', copy: 'Kopyala', ready: 'Hazır', standby: 'Beklemede', unknownError: 'Bilinmeyen hata' },
    plugin: { viewName: 'Notemd çalışma alanı', ribbonTooltip: 'Notemd kenar çubuğunu aç' },
    settings: { language: { heading: 'Dil ayarları', uiLocaleName: 'Arayüz dili', uiLocaleAuto: 'Obsidian’ı takip et', outputName: 'Çıktı dili' } },
    sidebar: {
        defaultWorkflowName: 'Tek tıkla çıkarım',
        sectionTitles: { core: 'Temel akış', generation: 'Üretim ve Mermaid', knowledge: 'Bilgi', translation: 'Çeviri', utilities: 'Araçlar' },
        actions: {
            processCurrentAddLinks: { label: 'Dosyayı işle (bağlantı ekle)' },
            processFolderAddLinks: { label: 'Klasörü işle (bağlantı ekle)' },
            generateFromTitle: { label: 'Başlıktan üret' },
            batchGenerateFromTitles: { label: 'Başlıklardan toplu üretim' },
            researchAndSummarize: { label: 'Araştır ve özetle' },
            summarizeAsMermaid: { label: 'Mermaid diyagramı olarak özetle' },
            translateCurrentFile: { label: 'Geçerli dosyayı çevir' },
            batchTranslateFolder: { label: 'Klasörü toplu çevir' },
            extractConceptsCurrent: { label: 'Kavramları çıkar (geçerli dosya)' },
            extractConceptsFolder: { label: 'Kavramları çıkar (klasör)' },
            extractOriginalText: { label: 'Belirli özgün metni çıkar' },
            batchMermaidFix: { label: 'Toplu Mermaid düzeltmesi' },
            fixFormulaCurrent: { label: 'Formül biçimlerini düzelt (geçerli)' },
            batchFixFormula: { label: 'Formül biçimlerini toplu düzelt' },
            checkDuplicatesCurrent: { label: 'Yinelenenleri denetle (geçerli dosya)' },
            checkRemoveDuplicateConcepts: { label: 'Yinelenenleri denetle ve kaldır' },
            testLlmConnection: { label: 'LLM bağlantısını test et' }
        }
    },
    progressModal: { heading: 'Notemd işleniyor', starting: 'Başlatılıyor...', cancelProgress: 'İptal', timeRemainingCalculating: 'Tahmini kalan süre: hesaplanıyor...', cancelledOrError: 'İptal edildi/Hata' }
};

export const STRINGS_UK: LocaleStrings = {
    common: { language: 'Мова', cancel: 'Скасувати', close: 'Закрити', copy: 'Копіювати', ready: 'Готово', standby: 'Очікування', unknownError: 'Невідома помилка' },
    plugin: { viewName: 'Робочий простір Notemd', ribbonTooltip: 'Відкрити бічну панель Notemd' },
    settings: { language: { heading: 'Налаштування мови', uiLocaleName: 'Мова інтерфейсу', uiLocaleAuto: 'Наслідувати Obsidian', outputName: 'Мова виводу' } },
    sidebar: {
        defaultWorkflowName: 'Витяг одним кліком',
        sectionTitles: { core: 'Основний потік', generation: 'Генерація та Mermaid', knowledge: 'Знання', translation: 'Переклад', utilities: 'Утиліти' },
        actions: {
            processCurrentAddLinks: { label: 'Обробити файл (додати посилання)' },
            processFolderAddLinks: { label: 'Обробити теку (додати посилання)' },
            generateFromTitle: { label: 'Згенерувати з назви' },
            batchGenerateFromTitles: { label: 'Пакетна генерація з назв' },
            researchAndSummarize: { label: 'Дослідити й підсумувати' },
            summarizeAsMermaid: { label: 'Підсумувати як діаграму Mermaid' },
            translateCurrentFile: { label: 'Перекласти поточний файл' },
            batchTranslateFolder: { label: 'Пакетний переклад теки' },
            extractConceptsCurrent: { label: 'Витягти концепти (поточний файл)' },
            extractConceptsFolder: { label: 'Витягти концепти (тека)' },
            extractOriginalText: { label: 'Витягти конкретний оригінальний текст' },
            batchMermaidFix: { label: 'Пакетне виправлення Mermaid' },
            fixFormulaCurrent: { label: 'Виправити формули (поточний)' },
            batchFixFormula: { label: 'Пакетне виправлення формул' },
            checkDuplicatesCurrent: { label: 'Перевірити дублікати (поточний файл)' },
            checkRemoveDuplicateConcepts: { label: 'Перевірити й видалити дублікати' },
            testLlmConnection: { label: 'Перевірити з’єднання LLM' }
        }
    },
    progressModal: { heading: 'Обробка Notemd', starting: 'Запуск...', cancelProgress: 'Скасувати', timeRemainingCalculating: 'Оцінка часу, що залишився: обчислення...', cancelledOrError: 'Скасовано/Помилка' }
};

export const STRINGS_VI: LocaleStrings = {
    common: { language: 'Ngôn ngữ', cancel: 'Hủy', close: 'Đóng', copy: 'Sao chép', ready: 'Sẵn sàng', standby: 'Chờ', unknownError: 'Lỗi không xác định' },
    plugin: { viewName: 'Không gian làm việc Notemd', ribbonTooltip: 'Mở thanh bên Notemd' },
    settings: { language: { heading: 'Cài đặt ngôn ngữ', uiLocaleName: 'Ngôn ngữ giao diện', uiLocaleAuto: 'Theo Obsidian', outputName: 'Ngôn ngữ đầu ra' } },
    sidebar: {
        defaultWorkflowName: 'Trích xuất một chạm',
        sectionTitles: { core: 'Luồng chính', generation: 'Tạo nội dung & Mermaid', knowledge: 'Kiến thức', translation: 'Dịch', utilities: 'Tiện ích' },
        actions: {
            processCurrentAddLinks: { label: 'Xử lý tệp (thêm liên kết)' },
            processFolderAddLinks: { label: 'Xử lý thư mục (thêm liên kết)' },
            generateFromTitle: { label: 'Tạo từ tiêu đề' },
            batchGenerateFromTitles: { label: 'Tạo hàng loạt từ tiêu đề' },
            researchAndSummarize: { label: 'Nghiên cứu và tóm tắt' },
            summarizeAsMermaid: { label: 'Tóm tắt thành sơ đồ Mermaid' },
            translateCurrentFile: { label: 'Dịch tệp hiện tại' },
            batchTranslateFolder: { label: 'Dịch thư mục hàng loạt' },
            extractConceptsCurrent: { label: 'Trích xuất khái niệm (tệp hiện tại)' },
            extractConceptsFolder: { label: 'Trích xuất khái niệm (thư mục)' },
            extractOriginalText: { label: 'Trích xuất văn bản gốc cụ thể' },
            batchMermaidFix: { label: 'Sửa Mermaid hàng loạt' },
            fixFormulaCurrent: { label: 'Sửa định dạng công thức (hiện tại)' },
            batchFixFormula: { label: 'Sửa định dạng công thức hàng loạt' },
            checkDuplicatesCurrent: { label: 'Kiểm tra trùng lặp (tệp hiện tại)' },
            checkRemoveDuplicateConcepts: { label: 'Kiểm tra và xóa trùng lặp' },
            testLlmConnection: { label: 'Kiểm tra kết nối LLM' }
        }
    },
    progressModal: { heading: 'Đang xử lý Notemd', starting: 'Đang bắt đầu...', cancelProgress: 'Hủy', timeRemainingCalculating: 'Thời gian còn lại ước tính: đang tính...', cancelledOrError: 'Đã hủy/Lỗi' }
};
