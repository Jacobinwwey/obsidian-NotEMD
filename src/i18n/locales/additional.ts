import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type LocaleStrings = DeepPartial<NotemdEnglishStrings>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeLocaleExtension(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(source)) {
        if (isPlainObject(value)) {
            const current = target[key];
            if (isPlainObject(current)) {
                mergeLocaleExtension(current, value);
            } else {
                const nested: Record<string, unknown> = {};
                target[key] = nested;
                mergeLocaleExtension(nested, value);
            }
            continue;
        }

        target[key] = value;
    }
}

function extendLocale(base: LocaleStrings, extension: LocaleStrings): void {
    mergeLocaleExtension(base as Record<string, unknown>, extension as Record<string, unknown>);
}

export const STRINGS_AR: LocaleStrings = {
    common: { language: 'اللغة', cancel: 'إلغاء', close: 'إغلاق', copy: 'نسخ', ready: 'جاهز', standby: 'في وضع الاستعداد', unknownError: 'خطأ غير معروف' },
    plugin: { viewName: 'مساحة عمل Notemd', ribbonTooltip: 'فتح الشريط الجانبي لـ Notemd' },
    folderPicker: { title: 'اختر مجلدًا', vaultRoot: '(جذر المستودع)', selectAction: 'اختيار' },
    settings: {
        language: {
            heading: 'إعدادات اللغة',
            uiLocaleName: 'لغة الواجهة',
            uiLocaleDesc: 'اختر اللغة المستخدمة لواجهة الإضافة. يتبع خيار "تلقائي" لغة Obsidian الحالية.',
            uiLocaleAuto: 'مطابقة لغة Obsidian',
            outputName: 'لغة الإخراج',
            outputDesc: 'اختر لغة الإخراج المطلوبة لردود LLM.',
            perTaskName: 'اختر لغات مختلفة للمهام المختلفة.',
            perTaskDesc: 'تشغيل: اختر لغة محددة لكل مهمة أدناه. إيقاف: استخدم "لغة الإخراج" الواحدة.',
            disableAutoTranslationName: 'تعطيل الترجمة التلقائية (باستثناء مهمة "الترجمة")',
            disableAutoTranslationDesc: 'تشغيل: المهام غير الخاصة بالترجمة لا تفرض لغة هدف ولا تترجم المخرجات تلقائيًا. مهمة "الترجمة" الصريحة تستمر بالعمل كما هو مضبوط.',
            taskLanguageLabel: 'لغة {task}',
            taskLanguageDesc: 'اختر لغة الإخراج لـ "{task}".'
        }
    },
    notices: {
        processingComplete: 'اكتملت معالجة Notemd!',
        batchProcessingSuccess: 'تمت معالجة {count} ملفًا بنجاح.',
        contentGenerationSuccess: 'تم إنشاء المحتوى بنجاح لـ {file}!',
        researchSummaryAppended: 'تم إلحاق ملخص البحث للموضوع "{topic}".',
        batchGenerationSuccess: 'تم إنشاء المحتوى بنجاح للملفات المؤهلة في "{folderPath}".',
        mermaidSummarizationComplete: 'اكتمل تلخيص مخطط Mermaid!',
        conceptExtractionSuccess: 'اكتمل استخراج المفاهيم! تم العثور على {count} ملاحظة مفهوم وإنشاؤها.',
        noConceptsFoundToExtract: 'لم يتم العثور على مفاهيم لاستخراجها.',
        batchExtractionSuccess: 'اكتمل الاستخراج الدفعي! تم العثور على {concepts} مفهومًا عبر {files} ملفًا.'
    },
    errorModal: {
        copyDetails: 'نسخ تفاصيل الخطأ',
        copied: 'تم النسخ!',
        copySuccessNotice: 'تم نسخ تفاصيل الخطأ إلى الحافظة!',
        copyFailedNotice: 'تعذر نسخ تفاصيل الخطأ. راجع وحدة التحكم.',
        titles: { research: 'خطأ في البحث', batchTranslation: 'خطأ في الترجمة الدُفعية' }
    },
    sidebar: {
        heroTitle: 'مساحة عمل Notemd',
        heroDesc: 'شغّل إجراءات منفردة أو مهام بنقرة واحدة مع تقدم حيّ وسجلات.',
        defaultWorkflowName: 'استخراج بنقرة واحدة',
        quickWorkflowTitle: 'مهام سريعة',
        quickWorkflowDesc: 'أزرار مخصصة مجمعة من الإجراءات المضمنة.',
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
        },
        status: {
            runningAction: 'جارٍ تشغيل "{label}"...',
            actionComplete: 'اكتمل "{label}"',
            actionFailed: 'فشل الإجراء: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'فشلت الخطوة: {message}',
            processingStopped: 'تم إيقاف المعالجة.',
            cancelling: 'جارٍ الإلغاء...',
            userRequestedCancellation: 'طلب المستخدم الإلغاء.'
        },
        logOutputTitle: 'مخرجات السجل',
        copyLog: 'نسخ السجل',
        copyLogSuccess: 'تم نسخ السجل!',
        copyLogFailed: 'تعذر نسخ السجل.',
        logEmpty: 'السجل فارغ.',
        cancelProcessing: 'إلغاء المعالجة',
        languageChangedNotice: 'تم تغيير اللغة إلى {language}'
    },
    progressModal: {
        heading: 'معالجة Notemd',
        starting: 'جارٍ البدء...',
        cancelProgress: 'إلغاء',
        timeRemaining: 'الوقت المقدر المتبقي: {time}',
        timeRemainingCalculating: 'الوقت المقدر المتبقي: جارٍ الحساب...',
        cancelledOrError: 'أُلغي/خطأ',
        processingStopped: 'تم إيقاف المعالجة.',
        cancelling: 'جارٍ الإلغاء...',
        userRequestedCancellation: 'طلب المستخدم الإلغاء.'
    }
};

export const STRINGS_DE: LocaleStrings = {
    common: { language: 'Sprache', cancel: 'Abbrechen', close: 'Schließen', copy: 'Kopieren', ready: 'Bereit', standby: 'Bereitschaft', unknownError: 'Unbekannter Fehler' },
    plugin: { viewName: 'Notemd-Arbeitsbereich', ribbonTooltip: 'Notemd-Seitenleiste öffnen' },
    folderPicker: { title: 'Ordner auswählen', vaultRoot: '(Tresorwurzel)', selectAction: 'Auswählen' },
    settings: {
        language: {
            heading: 'Spracheinstellungen',
            uiLocaleName: 'UI-Sprache',
            uiLocaleDesc: 'Wählen Sie die Sprache für die Plugin-Oberfläche. "Auto" folgt der aktuellen Obsidian-Sprache.',
            uiLocaleAuto: 'Obsidian folgen',
            outputName: 'Ausgabesprache',
            outputDesc: 'Wählen Sie die gewünschte Ausgabesprache für LLM-Antworten.',
            perTaskName: 'Für verschiedene Aufgaben unterschiedliche Sprachen auswählen.',
            perTaskDesc: 'An: Wählen Sie unten für jede Aufgabe eine eigene Sprache. Aus: Verwenden Sie die einzelne "Ausgabesprache".',
            disableAutoTranslationName: 'Automatische Übersetzung deaktivieren (außer für Aufgabe "Übersetzen")',
            disableAutoTranslationDesc: 'An: Nicht-Übersetzungsaufgaben erzwingen keine Zielsprache und übersetzen Ausgaben nicht automatisch. Die ausdrückliche Aufgabe "Übersetzen" arbeitet weiterhin wie konfiguriert.',
            taskLanguageLabel: 'Sprache für {task}',
            taskLanguageDesc: 'Wählen Sie die Ausgabesprache für "{task}".'
        }
    },
    notices: {
        processingComplete: 'Notemd-Verarbeitung abgeschlossen!',
        batchProcessingSuccess: '{count} Dateien erfolgreich verarbeitet.',
        contentGenerationSuccess: 'Inhalt für {file} erfolgreich generiert!',
        researchSummaryAppended: 'Recherche-Zusammenfassung für "{topic}" angehängt.',
        batchGenerationSuccess: 'Inhalt für geeignete Dateien in "{folderPath}" erfolgreich generiert.',
        mermaidSummarizationComplete: 'Mermaid-Diagramm-Zusammenfassung abgeschlossen!',
        conceptExtractionSuccess: 'Konzeptextraktion abgeschlossen! {count} Konzeptnotizen wurden gefunden und erstellt.',
        noConceptsFoundToExtract: 'Keine Konzepte zum Extrahieren gefunden.',
        batchExtractionSuccess: 'Stapelextraktion abgeschlossen! {concepts} Konzepte in {files} Dateien gefunden.'
    },
    errorModal: {
        copyDetails: 'Fehlerdetails kopieren',
        copied: 'Kopiert!',
        copySuccessNotice: 'Fehlerdetails in die Zwischenablage kopiert!',
        copyFailedNotice: 'Fehlerdetails konnten nicht kopiert werden. Siehe Konsole.',
        titles: { research: 'Recherchefehler', batchTranslation: 'Fehler bei Stapelübersetzung' }
    },
    sidebar: {
        heroTitle: 'Notemd-Arbeitsbereich',
        heroDesc: 'Führen Sie Einzelaktionen oder benutzerdefinierte Ein-Klick-Workflows mit Live-Fortschritt und Protokollen aus.',
        defaultWorkflowName: 'Extraktion mit einem Klick',
        quickWorkflowTitle: 'Schnelle Workflows',
        quickWorkflowDesc: 'Benutzerdefinierte Schaltflächen aus integrierten Aktionen.',
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
        },
        status: {
            runningAction: '"{label}" wird ausgeführt...',
            actionComplete: '"{label}" abgeschlossen',
            actionFailed: 'Aktion fehlgeschlagen: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Schritt fehlgeschlagen: {message}',
            processingStopped: 'Verarbeitung gestoppt.',
            cancelling: 'Wird abgebrochen...',
            userRequestedCancellation: 'Abbruch vom Benutzer angefordert.'
        },
        logOutputTitle: 'Protokollausgabe',
        copyLog: 'Protokoll kopieren',
        copyLogSuccess: 'Protokoll kopiert!',
        copyLogFailed: 'Protokoll konnte nicht kopiert werden.',
        logEmpty: 'Protokoll ist leer.',
        cancelProcessing: 'Verarbeitung abbrechen',
        languageChangedNotice: 'Sprache geändert zu {language}'
    },
    progressModal: {
        heading: 'Notemd-Verarbeitung',
        starting: 'Wird gestartet...',
        cancelProgress: 'Abbrechen',
        timeRemaining: 'Geschätzte Restzeit: {time}',
        timeRemainingCalculating: 'Geschätzte Restzeit: wird berechnet...',
        cancelledOrError: 'Abgebrochen/Fehler',
        processingStopped: 'Verarbeitung gestoppt.',
        cancelling: 'Wird abgebrochen...',
        userRequestedCancellation: 'Abbruch vom Benutzer angefordert.'
    }
};

export const STRINGS_ES: LocaleStrings = {
    common: { language: 'Idioma', cancel: 'Cancelar', close: 'Cerrar', copy: 'Copiar', ready: 'Listo', standby: 'En espera', unknownError: 'Error desconocido' },
    plugin: { viewName: 'Espacio de trabajo de Notemd', ribbonTooltip: 'Abrir la barra lateral de Notemd' },
    folderPicker: { title: 'Seleccionar carpeta', vaultRoot: '(Raíz del vault)', selectAction: 'Seleccionar' },
    settings: {
        language: {
            heading: 'Configuración de idioma',
            uiLocaleName: 'Idioma de la interfaz',
            uiLocaleDesc: 'Selecciona el idioma usado por la interfaz del plugin. "Auto" sigue el idioma actual de Obsidian.',
            uiLocaleAuto: 'Seguir Obsidian',
            outputName: 'Idioma de salida',
            outputDesc: 'Selecciona el idioma de salida deseado para las respuestas del LLM.',
            perTaskName: 'Seleccionar distintos idiomas para distintas tareas.',
            perTaskDesc: 'Activado: selecciona un idioma específico para cada tarea de abajo. Desactivado: usa el único "Idioma de salida".',
            disableAutoTranslationName: 'Desactivar la traducción automática (excepto para la tarea "Traducir")',
            disableAutoTranslationDesc: 'Activado: las tareas que no son de traducción no fuerzan un idioma de destino ni traducen automáticamente las salidas. La tarea explícita "Traducir" sigue funcionando según lo configurado.',
            taskLanguageLabel: 'Idioma de {task}',
            taskLanguageDesc: 'Selecciona el idioma de salida para "{task}".'
        }
    },
    notices: {
        processingComplete: '¡Procesamiento de Notemd completado!',
        batchProcessingSuccess: 'Se procesaron correctamente {count} archivos.',
        contentGenerationSuccess: '¡Contenido generado correctamente para {file}!',
        researchSummaryAppended: 'Se añadió el resumen de investigación para "{topic}".',
        batchGenerationSuccess: 'Se generó contenido correctamente para los archivos elegibles en "{folderPath}".',
        mermaidSummarizationComplete: '¡Se completó el resumen del diagrama Mermaid!',
        conceptExtractionSuccess: '¡Extracción de conceptos completada! Se encontraron y crearon {count} notas de concepto.',
        noConceptsFoundToExtract: 'No se encontraron conceptos para extraer.',
        batchExtractionSuccess: '¡Extracción por lotes completada! Se encontraron {concepts} conceptos en {files} archivos.'
    },
    errorModal: {
        copyDetails: 'Copiar detalles del error',
        copied: '¡Copiado!',
        copySuccessNotice: '¡Detalles del error copiados al portapapeles!',
        copyFailedNotice: 'No se pudieron copiar los detalles del error. Consulta la consola.',
        titles: { research: 'Error de investigación', batchTranslation: 'Error de traducción por lotes' }
    },
    sidebar: {
        heroTitle: 'Espacio de trabajo de Notemd',
        heroDesc: 'Ejecuta acciones individuales o flujos personalizados de un clic con progreso y registros en vivo.',
        defaultWorkflowName: 'Extracción con un clic',
        quickWorkflowTitle: 'Flujos rápidos',
        quickWorkflowDesc: 'Botones personalizados montados a partir de acciones integradas.',
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
        },
        status: {
            runningAction: 'Ejecutando "{label}"...',
            actionComplete: '"{label}" completado',
            actionFailed: 'Acción fallida: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Paso fallido: {message}',
            processingStopped: 'Procesamiento detenido.',
            cancelling: 'Cancelando...',
            userRequestedCancellation: 'El usuario solicitó la cancelación.'
        },
        logOutputTitle: 'Salida del registro',
        copyLog: 'Copiar registro',
        copyLogSuccess: '¡Registro copiado!',
        copyLogFailed: 'No se pudo copiar el registro.',
        logEmpty: 'El registro está vacío.',
        cancelProcessing: 'Cancelar procesamiento',
        languageChangedNotice: 'Idioma cambiado a {language}'
    },
    progressModal: {
        heading: 'Procesamiento de Notemd',
        starting: 'Iniciando...',
        cancelProgress: 'Cancelar',
        timeRemaining: 'Tiempo restante estimado: {time}',
        timeRemainingCalculating: 'Tiempo restante estimado: calculando...',
        cancelledOrError: 'Cancelado/Error',
        processingStopped: 'Procesamiento detenido.',
        cancelling: 'Cancelando...',
        userRequestedCancellation: 'El usuario solicitó la cancelación.'
    }
};

export const STRINGS_FA: LocaleStrings = {
    common: { language: 'زبان', cancel: 'لغو', close: 'بستن', copy: 'کپی', ready: 'آماده', standby: 'در انتظار', unknownError: 'خطای ناشناخته' },
    plugin: { viewName: 'میزکار Notemd', ribbonTooltip: 'باز کردن نوار کناری Notemd' },
    folderPicker: { title: 'انتخاب پوشه', vaultRoot: '(ریشه خزانه)', selectAction: 'انتخاب' },
    settings: {
        language: {
            heading: 'تنظیمات زبان',
            uiLocaleName: 'زبان رابط کاربری',
            uiLocaleDesc: 'زبانی را که برای رابط افزونه استفاده می‌شود انتخاب کنید. گزینهٔ «خودکار» از زبان فعلی Obsidian پیروی می‌کند.',
            uiLocaleAuto: 'همگام با Obsidian',
            outputName: 'زبان خروجی',
            outputDesc: 'زبان خروجی موردنظر برای پاسخ‌های LLM را انتخاب کنید.',
            perTaskName: 'برای کارهای مختلف زبان‌های متفاوت انتخاب کنید.',
            perTaskDesc: 'روشن: برای هر کار در پایین یک زبان مشخص انتخاب کنید. خاموش: فقط از «زبان خروجی» استفاده شود.',
            disableAutoTranslationName: 'غیرفعال کردن ترجمه خودکار (به‌جز کار «ترجمه»)',
            disableAutoTranslationDesc: 'روشن: کارهای غیر از ترجمه، زبان هدف را تحمیل نمی‌کنند و خروجی‌ها را خودکار ترجمه نمی‌کنند. کار صریح «ترجمه» همچنان طبق تنظیمات عمل می‌کند.',
            taskLanguageLabel: 'زبان {task}',
            taskLanguageDesc: 'زبان خروجی برای "{task}" را انتخاب کنید.'
        }
    },
    notices: {
        processingComplete: 'پردازش Notemd کامل شد!',
        batchProcessingSuccess: 'پردازش {count} فایل با موفقیت انجام شد.',
        contentGenerationSuccess: 'محتوا برای {file} با موفقیت تولید شد!',
        researchSummaryAppended: 'خلاصهٔ پژوهش برای "{topic}" افزوده شد.',
        batchGenerationSuccess: 'محتوا برای فایل‌های واجد شرایط در "{folderPath}" با موفقیت تولید شد.',
        mermaidSummarizationComplete: 'خلاصه‌سازی نمودار Mermaid کامل شد!',
        conceptExtractionSuccess: 'استخراج مفاهیم کامل شد! {count} یادداشت مفهوم پیدا و ایجاد شد.',
        noConceptsFoundToExtract: 'مفهومی برای استخراج پیدا نشد.',
        batchExtractionSuccess: 'استخراج دسته‌ای کامل شد! {concepts} مفهوم در {files} فایل پیدا شد.'
    },
    errorModal: {
        copyDetails: 'کپی جزئیات خطا',
        copied: 'کپی شد!',
        copySuccessNotice: 'جزئیات خطا در کلیپ‌بورد کپی شد!',
        copyFailedNotice: 'کپی جزئیات خطا ناموفق بود. کنسول را بررسی کنید.',
        titles: { research: 'خطای پژوهش', batchTranslation: 'خطای ترجمه دسته‌ای' }
    },
    sidebar: {
        heroTitle: 'میزکار Notemd',
        heroDesc: 'اقدام‌های تکی یا گردش‌کارهای سفارشی تک‌کلیکی را با پیشرفت زنده و گزارش‌ها اجرا کنید.',
        defaultWorkflowName: 'استخراج تک‌کلیکی',
        quickWorkflowTitle: 'گردش‌کارهای سریع',
        quickWorkflowDesc: 'دکمه‌های سفارشی ساخته‌شده از اقدام‌های داخلی.',
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
        },
        status: {
            runningAction: 'در حال اجرای "{label}"...',
            actionComplete: '"{label}" کامل شد',
            actionFailed: 'اقدام ناموفق بود: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'مرحله ناموفق بود: {message}',
            processingStopped: 'پردازش متوقف شد.',
            cancelling: 'در حال لغو...',
            userRequestedCancellation: 'کاربر درخواست لغو کرد.'
        },
        logOutputTitle: 'خروجی گزارش',
        copyLog: 'کپی گزارش',
        copyLogSuccess: 'گزارش کپی شد!',
        copyLogFailed: 'کپی گزارش ناموفق بود.',
        logEmpty: 'گزارش خالی است.',
        cancelProcessing: 'لغو پردازش',
        languageChangedNotice: 'زبان به {language} تغییر کرد'
    },
    progressModal: {
        heading: 'پردازش Notemd',
        starting: 'در حال شروع...',
        cancelProgress: 'لغو',
        timeRemaining: 'زمان تقریبی باقی‌مانده: {time}',
        timeRemainingCalculating: 'زمان تقریبی باقیمانده: در حال محاسبه...',
        cancelledOrError: 'لغو شد/خطا',
        processingStopped: 'پردازش متوقف شد.',
        cancelling: 'در حال لغو...',
        userRequestedCancellation: 'کاربر درخواست لغو کرد.'
    }
};

export const STRINGS_FR: LocaleStrings = {
    common: { language: 'Langue', cancel: 'Annuler', close: 'Fermer', copy: 'Copier', ready: 'Prêt', standby: 'En attente', unknownError: 'Erreur inconnue' },
    plugin: { viewName: 'Espace de travail Notemd', ribbonTooltip: 'Ouvrir le panneau latéral Notemd' },
    folderPicker: { title: 'Sélectionner un dossier', vaultRoot: '(Racine du coffre)', selectAction: 'Sélectionner' },
    settings: {
        language: {
            heading: 'Paramètres de langue',
            uiLocaleName: 'Langue de l’interface',
            uiLocaleDesc: 'Choisissez la langue utilisée pour l’interface du plugin. "Auto" suit la langue actuelle d’Obsidian.',
            uiLocaleAuto: 'Suivre Obsidian',
            outputName: 'Langue de sortie',
            outputDesc: 'Choisissez la langue de sortie souhaitée pour les réponses du LLM.',
            perTaskName: 'Sélectionner des langues différentes selon les tâches.',
            perTaskDesc: 'Activé : choisissez ci-dessous une langue spécifique pour chaque tâche. Désactivé : utilisez la seule "Langue de sortie".',
            disableAutoTranslationName: 'Désactiver la traduction automatique (sauf pour la tâche "Traduire")',
            disableAutoTranslationDesc: 'Activé : les tâches autres que Traduire n’imposent pas de langue cible et ne traduisent pas automatiquement les sorties. La tâche explicite "Traduire" continue de fonctionner selon la configuration.',
            taskLanguageLabel: 'Langue de {task}',
            taskLanguageDesc: 'Choisissez la langue de sortie pour "{task}".'
        }
    },
    notices: {
        processingComplete: 'Traitement Notemd terminé !',
        batchProcessingSuccess: '{count} fichiers traités avec succès.',
        contentGenerationSuccess: 'Contenu généré avec succès pour {file} !',
        researchSummaryAppended: 'Résumé de recherche ajouté pour "{topic}".',
        batchGenerationSuccess: 'Contenu généré avec succès pour les fichiers admissibles dans "{folderPath}".',
        mermaidSummarizationComplete: 'Résumé Mermaid terminé !',
        conceptExtractionSuccess: 'Extraction des concepts terminée ! {count} notes de concept ont été trouvées et créées.',
        noConceptsFoundToExtract: 'Aucun concept à extraire.',
        batchExtractionSuccess: 'Extraction par lot terminée ! {concepts} concepts trouvés dans {files} fichiers.'
    },
    errorModal: {
        copyDetails: 'Copier les détails de l’erreur',
        copied: 'Copié !',
        copySuccessNotice: 'Détails de l’erreur copiés dans le presse-papiers !',
        copyFailedNotice: 'Impossible de copier les détails de l’erreur. Voir la console.',
        titles: { research: 'Erreur de recherche', batchTranslation: 'Erreur de traduction par lot' }
    },
    sidebar: {
        heroTitle: 'Espace de travail Notemd',
        heroDesc: 'Exécutez des actions simples ou des workflows personnalisés en un clic avec progression et journaux en direct.',
        defaultWorkflowName: 'Extraction en un clic',
        quickWorkflowTitle: 'Workflows rapides',
        quickWorkflowDesc: 'Boutons personnalisés assemblés à partir des actions intégrées.',
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
        },
        status: {
            runningAction: 'Exécution de "{label}"...',
            actionComplete: '"{label}" terminé',
            actionFailed: 'Échec de l’action : {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Échec de l’étape : {message}',
            processingStopped: 'Traitement arrêté.',
            cancelling: 'Annulation...',
            userRequestedCancellation: 'L’utilisateur a demandé l’annulation.'
        },
        logOutputTitle: 'Sortie du journal',
        copyLog: 'Copier le journal',
        copyLogSuccess: 'Journal copié !',
        copyLogFailed: 'Impossible de copier le journal.',
        logEmpty: 'Le journal est vide.',
        cancelProcessing: 'Annuler le traitement',
        languageChangedNotice: 'Langue changée en {language}'
    },
    progressModal: {
        heading: 'Traitement Notemd',
        starting: 'Démarrage...',
        cancelProgress: 'Annuler',
        timeRemaining: 'Temps restant estimé : {time}',
        timeRemainingCalculating: 'Temps restant estimé : calcul en cours...',
        cancelledOrError: 'Annulé/Erreur',
        processingStopped: 'Traitement arrêté.',
        cancelling: 'Annulation...',
        userRequestedCancellation: 'L’utilisateur a demandé l’annulation.'
    }
};

export const STRINGS_ID: LocaleStrings = {
    common: { language: 'Bahasa', cancel: 'Batal', close: 'Tutup', copy: 'Salin', ready: 'Siap', standby: 'Siaga', unknownError: 'Kesalahan tidak diketahui' },
    plugin: { viewName: 'Ruang kerja Notemd', ribbonTooltip: 'Buka bilah sisi Notemd' },
    folderPicker: { title: 'Pilih folder', vaultRoot: '(Akar vault)', selectAction: 'Pilih' },
    settings: {
        language: {
            heading: 'Pengaturan bahasa',
            uiLocaleName: 'Bahasa UI',
            uiLocaleDesc: 'Pilih bahasa yang digunakan untuk antarmuka plugin. "Otomatis" mengikuti bahasa Obsidian saat ini.',
            uiLocaleAuto: 'Ikuti Obsidian',
            outputName: 'Bahasa keluaran',
            outputDesc: 'Pilih bahasa keluaran yang diinginkan untuk respons LLM.',
            perTaskName: 'Pilih bahasa berbeda untuk tugas yang berbeda.',
            perTaskDesc: 'Nyala: pilih bahasa khusus untuk setiap tugas di bawah. Mati: gunakan satu "Bahasa keluaran".',
            disableAutoTranslationName: 'Nonaktifkan terjemahan otomatis (kecuali untuk tugas "Terjemahkan")',
            disableAutoTranslationDesc: 'Nyala: tugas non-Terjemahkan tidak memaksa bahasa target atau menerjemahkan keluaran secara otomatis. Tugas "Terjemahkan" yang eksplisit tetap berjalan sesuai pengaturan.',
            taskLanguageLabel: 'Bahasa {task}',
            taskLanguageDesc: 'Pilih bahasa keluaran untuk "{task}".'
        }
    },
    notices: {
        processingComplete: 'Pemrosesan Notemd selesai!',
        batchProcessingSuccess: 'Berhasil memproses {count} file.',
        contentGenerationSuccess: 'Konten berhasil dibuat untuk {file}!',
        researchSummaryAppended: 'Ringkasan riset untuk "{topic}" telah ditambahkan.',
        batchGenerationSuccess: 'Berhasil membuat konten untuk file yang memenuhi syarat di "{folderPath}".',
        mermaidSummarizationComplete: 'Peringkasan diagram Mermaid selesai!',
        conceptExtractionSuccess: 'Ekstraksi konsep selesai! Ditemukan dan dibuat {count} catatan konsep.',
        noConceptsFoundToExtract: 'Tidak ada konsep yang ditemukan untuk diekstrak.',
        batchExtractionSuccess: 'Ekstraksi batch selesai! Ditemukan {concepts} konsep di {files} file.'
    },
    errorModal: {
        copyDetails: 'Salin detail kesalahan',
        copied: 'Tersalin!',
        copySuccessNotice: 'Detail kesalahan disalin ke clipboard!',
        copyFailedNotice: 'Gagal menyalin detail kesalahan. Lihat konsol.',
        titles: { research: 'Kesalahan Riset', batchTranslation: 'Kesalahan Terjemahan Batch' }
    },
    sidebar: {
        heroTitle: 'Ruang kerja Notemd',
        heroDesc: 'Jalankan aksi tunggal atau alur satu klik kustom dengan progres dan log langsung.',
        defaultWorkflowName: 'Ekstraksi Sekali Klik',
        quickWorkflowTitle: 'Alur Cepat',
        quickWorkflowDesc: 'Tombol kustom yang dirakit dari aksi bawaan.',
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
        },
        status: {
            runningAction: 'Menjalankan "{label}"...',
            actionComplete: '"{label}" selesai',
            actionFailed: 'Aksi gagal: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Langkah gagal: {message}',
            processingStopped: 'Pemrosesan dihentikan.',
            cancelling: 'Membatalkan...',
            userRequestedCancellation: 'Pengguna meminta pembatalan.'
        },
        logOutputTitle: 'Keluaran log',
        copyLog: 'Salin log',
        copyLogSuccess: 'Log tersalin!',
        copyLogFailed: 'Gagal menyalin log.',
        logEmpty: 'Log kosong.',
        cancelProcessing: 'Batalkan pemrosesan',
        languageChangedNotice: 'Bahasa diubah ke {language}'
    },
    progressModal: {
        heading: 'Pemrosesan Notemd',
        starting: 'Memulai...',
        cancelProgress: 'Batal',
        timeRemaining: 'Perkiraan sisa waktu: {time}',
        timeRemainingCalculating: 'Perkiraan sisa waktu: menghitung...',
        cancelledOrError: 'Dibatalkan/Kesalahan',
        processingStopped: 'Pemrosesan dihentikan.',
        cancelling: 'Membatalkan...',
        userRequestedCancellation: 'Pengguna meminta pembatalan.'
    }
};

export const STRINGS_IT: LocaleStrings = {
    common: { language: 'Lingua', cancel: 'Annulla', close: 'Chiudi', copy: 'Copia', ready: 'Pronto', standby: 'In attesa', unknownError: 'Errore sconosciuto' },
    plugin: { viewName: 'Area di lavoro Notemd', ribbonTooltip: 'Apri la barra laterale di Notemd' },
    folderPicker: { title: 'Seleziona cartella', vaultRoot: '(Radice del vault)', selectAction: 'Seleziona' },
    settings: {
        language: {
            heading: 'Impostazioni lingua',
            uiLocaleName: 'Lingua dell’interfaccia',
            uiLocaleDesc: 'Seleziona la lingua usata dall’interfaccia del plugin. "Auto" segue la lingua corrente di Obsidian.',
            uiLocaleAuto: 'Segui Obsidian',
            outputName: 'Lingua di output',
            outputDesc: 'Seleziona la lingua di output desiderata per le risposte dell’LLM.',
            perTaskName: 'Seleziona lingue diverse per compiti diversi.',
            perTaskDesc: 'Attivo: seleziona una lingua specifica per ogni attività qui sotto. Disattivo: usa la sola "Lingua di output".',
            disableAutoTranslationName: 'Disabilita la traduzione automatica (tranne per l’attività "Traduci")',
            disableAutoTranslationDesc: 'Attivo: le attività diverse da Traduci non impongono una lingua di destinazione né traducono automaticamente gli output. L’attività esplicita "Traduci" continua a funzionare come configurato.',
            taskLanguageLabel: 'Lingua di {task}',
            taskLanguageDesc: 'Seleziona la lingua di output per "{task}".'
        }
    },
    notices: {
        processingComplete: 'Elaborazione Notemd completata!',
        batchProcessingSuccess: 'Elaborati con successo {count} file.',
        contentGenerationSuccess: 'Contenuto generato con successo per {file}!',
        researchSummaryAppended: 'Riepilogo della ricerca per "{topic}" aggiunto.',
        batchGenerationSuccess: 'Contenuto generato con successo per i file idonei in "{folderPath}".',
        mermaidSummarizationComplete: 'Riepilogo del diagramma Mermaid completato!',
        conceptExtractionSuccess: 'Estrazione dei concetti completata! Trovate e create {count} note concetto.',
        noConceptsFoundToExtract: 'Nessun concetto da estrarre.',
        batchExtractionSuccess: 'Estrazione batch completata! Trovati {concepts} concetti in {files} file.'
    },
    errorModal: {
        copyDetails: 'Copia dettagli errore',
        copied: 'Copiato!',
        copySuccessNotice: 'Dettagli dell’errore copiati negli appunti!',
        copyFailedNotice: 'Impossibile copiare i dettagli dell’errore. Controlla la console.',
        titles: { research: 'Errore di ricerca', batchTranslation: 'Errore di traduzione batch' }
    },
    sidebar: {
        heroTitle: 'Area di lavoro Notemd',
        heroDesc: 'Esegui singole azioni o workflow personalizzati con progresso e log in tempo reale.',
        defaultWorkflowName: 'Estrazione con un clic',
        quickWorkflowTitle: 'Workflow rapidi',
        quickWorkflowDesc: 'Pulsanti personalizzati assemblati dalle azioni integrate.',
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
        },
        status: {
            runningAction: 'Esecuzione di "{label}"...',
            actionComplete: '"{label}" completata',
            actionFailed: 'Azione non riuscita: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Passaggio non riuscito: {message}',
            processingStopped: 'Elaborazione interrotta.',
            cancelling: 'Annullamento in corso...',
            userRequestedCancellation: 'L’utente ha richiesto l’annullamento.'
        },
        logOutputTitle: 'Output del log',
        copyLog: 'Copia log',
        copyLogSuccess: 'Log copiato!',
        copyLogFailed: 'Impossibile copiare il log.',
        logEmpty: 'Il log è vuoto.',
        cancelProcessing: 'Annulla elaborazione',
        languageChangedNotice: 'Lingua cambiata in {language}'
    },
    progressModal: {
        heading: 'Elaborazione Notemd',
        starting: 'Avvio...',
        cancelProgress: 'Annulla',
        timeRemaining: 'Tempo stimato rimanente: {time}',
        timeRemainingCalculating: 'Tempo stimato rimanente: calcolo in corso...',
        cancelledOrError: 'Annullato/Errore',
        processingStopped: 'Elaborazione interrotta.',
        cancelling: 'Annullamento in corso...',
        userRequestedCancellation: 'L’utente ha richiesto l’annullamento.'
    }
};

export const STRINGS_JA: LocaleStrings = {
    common: { language: '言語', cancel: 'キャンセル', close: '閉じる', copy: 'コピー', ready: '準備完了', standby: '待機中', unknownError: '不明なエラー' },
    plugin: { viewName: 'Notemd ワークベンチ', ribbonTooltip: 'Notemd サイドバーを開く' },
    folderPicker: { title: 'フォルダーを選択', vaultRoot: '(Vault ルート)', selectAction: '選択' },
    settings: {
        language: {
            heading: '言語設定',
            uiLocaleName: 'UI 言語',
            uiLocaleDesc: 'プラグインのインターフェースで使う言語を選択します。"Auto" は現在の Obsidian 言語に従います。',
            uiLocaleAuto: 'Obsidian に合わせる',
            outputName: '出力言語',
            outputDesc: 'LLM 応答に使用する出力言語を選択します。',
            perTaskName: 'タスクごとに異なる言語を選択する。',
            perTaskDesc: 'オン: 下の各タスクに個別の言語を設定します。オフ: 単一の「出力言語」を使います。',
            disableAutoTranslationName: '自動翻訳を無効化（"翻訳" タスクを除く）',
            disableAutoTranslationDesc: 'オン: 翻訳以外のタスクは対象言語を強制せず、出力も自動翻訳しません。明示的な「翻訳」タスクは設定どおりに動作します。',
            taskLanguageLabel: '{task} の言語',
            taskLanguageDesc: '"{task}" の出力言語を選択します。'
        }
    },
    notices: {
        processingComplete: 'Notemd の処理が完了しました！',
        batchProcessingSuccess: '{count} 件のファイルを正常に処理しました。',
        contentGenerationSuccess: '{file} のコンテンツを正常に生成しました！',
        researchSummaryAppended: '"{topic}" の調査要約を追加しました。',
        batchGenerationSuccess: '"{folderPath}" 内の対象ファイルのコンテンツを正常に生成しました。',
        mermaidSummarizationComplete: 'Mermaid 図の要約が完了しました！',
        conceptExtractionSuccess: '概念抽出が完了しました！ {count} 件の概念ノートを見つけて作成しました。',
        noConceptsFoundToExtract: '抽出する概念は見つかりませんでした。',
        batchExtractionSuccess: '一括抽出が完了しました！ {files} 件のファイルから {concepts} 件の概念を見つけました。'
    },
    errorModal: {
        copyDetails: 'エラー詳細をコピー',
        copied: 'コピーしました！',
        copySuccessNotice: 'エラー詳細をクリップボードにコピーしました！',
        copyFailedNotice: 'エラー詳細をコピーできませんでした。コンソールを確認してください。',
        titles: { research: '調査エラー', batchTranslation: '一括翻訳エラー' }
    },
    sidebar: {
        heroTitle: 'Notemd ワークベンチ',
        heroDesc: '単体アクションやカスタムのワンクリックワークフローを、進行状況とログ付きで実行します。',
        defaultWorkflowName: 'ワンクリック抽出',
        quickWorkflowTitle: 'クイックワークフロー',
        quickWorkflowDesc: '組み込みアクションから組み立てたカスタムボタン。',
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
        },
        status: {
            runningAction: '"{label}" を実行中...',
            actionComplete: '"{label}" が完了しました',
            actionFailed: 'アクションに失敗しました: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'ステップに失敗しました: {message}',
            processingStopped: '処理を停止しました。',
            cancelling: 'キャンセル中...',
            userRequestedCancellation: 'ユーザーがキャンセルを要求しました。'
        },
        logOutputTitle: 'ログ出力',
        copyLog: 'ログをコピー',
        copyLogSuccess: 'ログをコピーしました！',
        copyLogFailed: 'ログをコピーできませんでした。',
        logEmpty: 'ログは空です。',
        cancelProcessing: '処理をキャンセル',
        languageChangedNotice: '言語を {language} に変更しました'
    },
    progressModal: {
        heading: 'Notemd 処理',
        starting: '開始中...',
        cancelProgress: 'キャンセル',
        timeRemaining: '推定残り時間: {time}',
        timeRemainingCalculating: '推定残り時間: 計算中...',
        cancelledOrError: 'キャンセル/エラー',
        processingStopped: '処理を停止しました。',
        cancelling: 'キャンセル中...',
        userRequestedCancellation: 'ユーザーがキャンセルを要求しました。'
    }
};

export const STRINGS_KO: LocaleStrings = {
    common: { language: '언어', cancel: '취소', close: '닫기', copy: '복사', ready: '준비됨', standby: '대기 중', unknownError: '알 수 없는 오류' },
    plugin: { viewName: 'Notemd 워크벤치', ribbonTooltip: 'Notemd 사이드바 열기' },
    folderPicker: { title: '폴더 선택', vaultRoot: '(Vault 루트)', selectAction: '선택' },
    settings: {
        language: {
            heading: '언어 설정',
            uiLocaleName: 'UI 언어',
            uiLocaleDesc: '플러그인 인터페이스에 사용할 언어를 선택합니다. "자동"은 현재 Obsidian 언어를 따릅니다.',
            uiLocaleAuto: 'Obsidian 따르기',
            outputName: '출력 언어',
            outputDesc: 'LLM 응답에 사용할 출력 언어를 선택합니다.',
            perTaskName: '작업마다 다른 언어 선택',
            perTaskDesc: '켜기: 아래 각 작업에 대해 개별 언어를 선택합니다. 끄기: 하나의 "출력 언어"를 사용합니다.',
            disableAutoTranslationName: '자동 번역 비활성화("번역" 작업 제외)',
            disableAutoTranslationDesc: '켜기: 번역 이외의 작업은 대상 언어를 강제하지 않고 출력도 자동 번역하지 않습니다. 명시적 "번역" 작업은 설정대로 계속 동작합니다.',
            taskLanguageLabel: '{task} 언어',
            taskLanguageDesc: '"{task}"의 출력 언어를 선택합니다.'
        }
    },
    notices: {
        processingComplete: 'Notemd 처리가 완료되었습니다!',
        batchProcessingSuccess: '{count}개 파일을 성공적으로 처리했습니다.',
        contentGenerationSuccess: '{file}에 대한 콘텐츠를 성공적으로 생성했습니다!',
        researchSummaryAppended: '"{topic}"에 대한 연구 요약을 추가했습니다.',
        batchGenerationSuccess: '"{folderPath}"의 적격 파일에 대한 콘텐츠를 성공적으로 생성했습니다.',
        mermaidSummarizationComplete: 'Mermaid 다이어그램 요약이 완료되었습니다!',
        conceptExtractionSuccess: '개념 추출이 완료되었습니다! {count}개의 개념 노트를 찾고 생성했습니다.',
        noConceptsFoundToExtract: '추출할 개념을 찾지 못했습니다.',
        batchExtractionSuccess: '일괄 추출이 완료되었습니다! {files}개 파일에서 {concepts}개의 개념을 찾았습니다.'
    },
    errorModal: {
        copyDetails: '오류 세부 정보 복사',
        copied: '복사됨!',
        copySuccessNotice: '오류 세부 정보를 클립보드에 복사했습니다!',
        copyFailedNotice: '오류 세부 정보를 복사하지 못했습니다. 콘솔을 확인하세요.',
        titles: { research: '연구 오류', batchTranslation: '일괄 번역 오류' }
    },
    sidebar: {
        heroTitle: 'Notemd 워크벤치',
        heroDesc: '실시간 진행 상황과 로그를 보며 단일 작업이나 사용자 정의 원클릭 워크플로를 실행합니다.',
        defaultWorkflowName: '원클릭 추출',
        quickWorkflowTitle: '빠른 워크플로',
        quickWorkflowDesc: '기본 제공 작업으로 조합한 사용자 정의 버튼입니다.',
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
        },
        status: {
            runningAction: '"{label}" 실행 중...',
            actionComplete: '"{label}" 완료',
            actionFailed: '작업 실패: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: '단계 실패: {message}',
            processingStopped: '처리가 중지되었습니다.',
            cancelling: '취소 중...',
            userRequestedCancellation: '사용자가 취소를 요청했습니다.'
        },
        logOutputTitle: '로그 출력',
        copyLog: '로그 복사',
        copyLogSuccess: '로그를 복사했습니다!',
        copyLogFailed: '로그를 복사하지 못했습니다.',
        logEmpty: '로그가 비어 있습니다.',
        cancelProcessing: '처리 취소',
        languageChangedNotice: '언어가 {language}(으)로 변경되었습니다'
    },
    progressModal: {
        heading: 'Notemd 처리',
        starting: '시작 중...',
        cancelProgress: '취소',
        timeRemaining: '예상 남은 시간: {time}',
        timeRemainingCalculating: '예상 남은 시간: 계산 중...',
        cancelledOrError: '취소됨/오류',
        processingStopped: '처리가 중지되었습니다.',
        cancelling: '취소 중...',
        userRequestedCancellation: '사용자가 취소를 요청했습니다.'
    }
};

export const STRINGS_NL: LocaleStrings = {
    common: { language: 'Taal', cancel: 'Annuleren', close: 'Sluiten', copy: 'Kopiëren', ready: 'Gereed', standby: 'Stand-by', unknownError: 'Onbekende fout' },
    plugin: { viewName: 'Notemd-werkruimte', ribbonTooltip: 'Notemd-zijbalk openen' },
    folderPicker: { title: 'Map selecteren', vaultRoot: '(Vault-hoofdmap)', selectAction: 'Selecteren' },
    settings: {
        language: {
            heading: 'Taalinstellingen',
            uiLocaleName: 'UI-taal',
            uiLocaleDesc: 'Kies de taal voor de plugininterface. "Auto" volgt de huidige Obsidian-taal.',
            uiLocaleAuto: 'Obsidian volgen',
            outputName: 'Uitvoertaal',
            outputDesc: 'Kies de gewenste uitvoertaal voor LLM-antwoorden.',
            perTaskName: 'Verschillende talen voor verschillende taken kiezen.',
            perTaskDesc: 'Aan: kies hieronder voor elke taak een aparte taal. Uit: gebruik de enkele "Uitvoertaal".',
            disableAutoTranslationName: 'Automatische vertaling uitschakelen (behalve voor taak "Vertalen")',
            disableAutoTranslationDesc: 'Aan: niet-vertaaltaken forceren geen doeltaal en vertalen uitvoer niet automatisch. De expliciete taak "Vertalen" werkt nog steeds volgens de configuratie.',
            taskLanguageLabel: 'Taal voor {task}',
            taskLanguageDesc: 'Kies de uitvoertaal voor "{task}".'
        }
    },
    notices: {
        processingComplete: 'Notemd-verwerking voltooid!',
        batchProcessingSuccess: '{count} bestanden succesvol verwerkt.',
        contentGenerationSuccess: 'Inhoud succesvol gegenereerd voor {file}!',
        researchSummaryAppended: 'Onderzoekssamenvatting voor "{topic}" toegevoegd.',
        batchGenerationSuccess: 'Inhoud succesvol gegenereerd voor geschikte bestanden in "{folderPath}".',
        mermaidSummarizationComplete: 'Samenvatting van Mermaid-diagram voltooid!',
        conceptExtractionSuccess: 'Conceptextractie voltooid! {count} conceptnotities gevonden en gemaakt.',
        noConceptsFoundToExtract: 'Geen concepten gevonden om te extraheren.',
        batchExtractionSuccess: 'Batch-extractie voltooid! {concepts} concepten gevonden in {files} bestanden.'
    },
    errorModal: {
        copyDetails: 'Foutdetails kopiëren',
        copied: 'Gekopieerd!',
        copySuccessNotice: 'Foutdetails gekopieerd naar het klembord!',
        copyFailedNotice: 'Foutdetails konden niet worden gekopieerd. Zie console.',
        titles: { research: 'Onderzoeksfout', batchTranslation: 'Batchvertaalfout' }
    },
    sidebar: {
        heroTitle: 'Notemd-werkruimte',
        heroDesc: 'Voer losse acties of aangepaste éénklik-workflows uit met live voortgang en logboeken.',
        defaultWorkflowName: 'Extractie met één klik',
        quickWorkflowTitle: 'Snelle workflows',
        quickWorkflowDesc: 'Aangepaste knoppen samengesteld uit ingebouwde acties.',
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
        },
        status: {
            runningAction: '"{label}" wordt uitgevoerd...',
            actionComplete: '"{label}" voltooid',
            actionFailed: 'Actie mislukt: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Stap mislukt: {message}',
            processingStopped: 'Verwerking gestopt.',
            cancelling: 'Bezig met annuleren...',
            userRequestedCancellation: 'Gebruiker heeft annulering aangevraagd.'
        },
        logOutputTitle: 'Loguitvoer',
        copyLog: 'Log kopiëren',
        copyLogSuccess: 'Log gekopieerd!',
        copyLogFailed: 'Log kon niet worden gekopieerd.',
        logEmpty: 'Log is leeg.',
        cancelProcessing: 'Verwerking annuleren',
        languageChangedNotice: 'Taal gewijzigd naar {language}'
    },
    progressModal: {
        heading: 'Notemd-verwerking',
        starting: 'Starten...',
        cancelProgress: 'Annuleren',
        timeRemaining: 'Geschatte resterende tijd: {time}',
        timeRemainingCalculating: 'Geschatte resterende tijd: berekenen...',
        cancelledOrError: 'Geannuleerd/Fout',
        processingStopped: 'Verwerking gestopt.',
        cancelling: 'Bezig met annuleren...',
        userRequestedCancellation: 'Gebruiker heeft annulering aangevraagd.'
    }
};

export const STRINGS_PL: LocaleStrings = {
    common: { language: 'Język', cancel: 'Anuluj', close: 'Zamknij', copy: 'Kopiuj', ready: 'Gotowe', standby: 'Gotowość', unknownError: 'Nieznany błąd' },
    plugin: { viewName: 'Panel roboczy Notemd', ribbonTooltip: 'Otwórz pasek boczny Notemd' },
    folderPicker: { title: 'Wybierz folder', vaultRoot: '(Główny katalog skarbca)', selectAction: 'Wybierz' },
    settings: {
        language: {
            heading: 'Ustawienia języka',
            uiLocaleName: 'Język interfejsu',
            uiLocaleDesc: 'Wybierz język interfejsu wtyczki. „Auto” podąża za bieżącym językiem Obsidian.',
            uiLocaleAuto: 'Dopasuj do Obsidian',
            outputName: 'Język wyjściowy',
            outputDesc: 'Wybierz żądany język wyjściowy dla odpowiedzi LLM.',
            perTaskName: 'Wybierz różne języki dla różnych zadań.',
            perTaskDesc: 'Wł.: wybierz poniżej osobny język dla każdego zadania. Wył.: używaj jednego „Języka wyjściowego”.',
            disableAutoTranslationName: 'Wyłącz automatyczne tłumaczenie (z wyjątkiem zadania „Tłumacz”)',
            disableAutoTranslationDesc: 'Wł.: zadania inne niż tłumaczenie nie wymuszają języka docelowego ani nie tłumaczą automatycznie wyników. Jawne zadanie „Tłumacz” nadal działa zgodnie z konfiguracją.',
            taskLanguageLabel: 'Język dla {task}',
            taskLanguageDesc: 'Wybierz język wyjściowy dla „{task}”.'
        }
    },
    notices: {
        processingComplete: 'Przetwarzanie Notemd zakończone!',
        batchProcessingSuccess: 'Pomyślnie przetworzono {count} plików.',
        contentGenerationSuccess: 'Pomyślnie wygenerowano treść dla {file}!',
        researchSummaryAppended: 'Dodano podsumowanie badań dla "{topic}".',
        batchGenerationSuccess: 'Pomyślnie wygenerowano treść dla kwalifikujących się plików w "{folderPath}".',
        mermaidSummarizationComplete: 'Podsumowanie diagramu Mermaid zakończone!',
        conceptExtractionSuccess: 'Ekstrakcja pojęć zakończona! Znaleziono i utworzono {count} notatek pojęć.',
        noConceptsFoundToExtract: 'Nie znaleziono pojęć do wyodrębnienia.',
        batchExtractionSuccess: 'Ekstrakcja wsadowa zakończona! Znaleziono {concepts} pojęć w {files} plikach.'
    },
    errorModal: {
        copyDetails: 'Kopiuj szczegóły błędu',
        copied: 'Skopiowano!',
        copySuccessNotice: 'Szczegóły błędu skopiowano do schowka!',
        copyFailedNotice: 'Nie udało się skopiować szczegółów błędu. Sprawdź konsolę.',
        titles: { research: 'Błąd badania', batchTranslation: 'Błąd tłumaczenia wsadowego' }
    },
    sidebar: {
        heroTitle: 'Panel roboczy Notemd',
        heroDesc: 'Uruchamiaj pojedyncze akcje lub własne workflow jednym kliknięciem z postępem i logami na żywo.',
        defaultWorkflowName: 'Ekstrakcja jednym kliknięciem',
        quickWorkflowTitle: 'Szybkie workflow',
        quickWorkflowDesc: 'Własne przyciski złożone z wbudowanych akcji.',
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
        },
        status: {
            runningAction: 'Uruchamianie „{label}”...',
            actionComplete: '„{label}” ukończono',
            actionFailed: 'Akcja nie powiodła się: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Krok nie powiódł się: {message}',
            processingStopped: 'Przetwarzanie zatrzymane.',
            cancelling: 'Anulowanie...',
            userRequestedCancellation: 'Użytkownik zażądał anulowania.'
        },
        logOutputTitle: 'Wyjście logu',
        copyLog: 'Kopiuj log',
        copyLogSuccess: 'Log skopiowany!',
        copyLogFailed: 'Nie udało się skopiować logu.',
        logEmpty: 'Log jest pusty.',
        cancelProcessing: 'Anuluj przetwarzanie',
        languageChangedNotice: 'Język zmieniono na {language}'
    },
    progressModal: {
        heading: 'Przetwarzanie Notemd',
        starting: 'Uruchamianie...',
        cancelProgress: 'Anuluj',
        timeRemaining: 'Szacowany pozostały czas: {time}',
        timeRemainingCalculating: 'Szacowany pozostały czas: obliczanie...',
        cancelledOrError: 'Anulowano/Błąd',
        processingStopped: 'Przetwarzanie zatrzymane.',
        cancelling: 'Anulowanie...',
        userRequestedCancellation: 'Użytkownik zażądał anulowania.'
    }
};

export const STRINGS_PT: LocaleStrings = {
    common: { language: 'Idioma', cancel: 'Cancelar', close: 'Fechar', copy: 'Copiar', ready: 'Pronto', standby: 'Em espera', unknownError: 'Erro desconhecido' },
    plugin: { viewName: 'Área de trabalho do Notemd', ribbonTooltip: 'Abrir barra lateral do Notemd' },
    folderPicker: { title: 'Selecionar pasta', vaultRoot: '(Raiz do cofre)', selectAction: 'Selecionar' },
    settings: {
        language: {
            heading: 'Configurações de idioma',
            uiLocaleName: 'Idioma da interface',
            uiLocaleDesc: 'Selecione o idioma usado pela interface do plugin. "Auto" segue o idioma atual do Obsidian.',
            uiLocaleAuto: 'Seguir o Obsidian',
            outputName: 'Idioma de saída',
            outputDesc: 'Selecione o idioma de saída desejado para as respostas do LLM.',
            perTaskName: 'Selecionar idiomas diferentes para tarefas diferentes.',
            perTaskDesc: 'Ativado: selecione abaixo um idioma específico para cada tarefa. Desativado: use apenas o "Idioma de saída".',
            disableAutoTranslationName: 'Desativar a tradução automática (exceto para a tarefa "Traduzir")',
            disableAutoTranslationDesc: 'Ativado: tarefas que não sejam de tradução não impõem um idioma de destino nem traduzem automaticamente as saídas. A tarefa explícita "Traduzir" continua a funcionar conforme configurado.',
            taskLanguageLabel: 'Idioma de {task}',
            taskLanguageDesc: 'Selecione o idioma de saída para "{task}".'
        }
    },
    notices: {
        processingComplete: 'Processamento do Notemd concluído!',
        batchProcessingSuccess: '{count} arquivos processados com sucesso.',
        contentGenerationSuccess: 'Conteúdo gerado com sucesso para {file}!',
        researchSummaryAppended: 'Resumo de pesquisa para "{topic}" adicionado.',
        batchGenerationSuccess: 'Conteúdo gerado com sucesso para os arquivos elegíveis em "{folderPath}".',
        mermaidSummarizationComplete: 'Resumo do diagrama Mermaid concluído!',
        conceptExtractionSuccess: 'Extração de conceitos concluída! Foram encontradas e criadas {count} notas de conceito.',
        noConceptsFoundToExtract: 'Nenhum conceito encontrado para extrair.',
        batchExtractionSuccess: 'Extração em lote concluída! Foram encontrados {concepts} conceitos em {files} arquivos.'
    },
    errorModal: {
        copyDetails: 'Copiar detalhes do erro',
        copied: 'Copiado!',
        copySuccessNotice: 'Detalhes do erro copiados para a área de transferência!',
        copyFailedNotice: 'Falha ao copiar os detalhes do erro. Veja a consola.',
        titles: { research: 'Erro de pesquisa', batchTranslation: 'Erro de tradução em lote' }
    },
    sidebar: {
        heroTitle: 'Área de trabalho do Notemd',
        heroDesc: 'Execute ações individuais ou workflows personalizados de um clique com progresso e registos em direto.',
        defaultWorkflowName: 'Extração com um clique',
        quickWorkflowTitle: 'Workflows rápidos',
        quickWorkflowDesc: 'Botões personalizados montados a partir de ações integradas.',
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
        },
        status: {
            runningAction: 'A executar "{label}"...',
            actionComplete: '"{label}" concluído',
            actionFailed: 'A ação falhou: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'O passo falhou: {message}',
            processingStopped: 'Processamento interrompido.',
            cancelling: 'A cancelar...',
            userRequestedCancellation: 'O utilizador pediu o cancelamento.'
        },
        logOutputTitle: 'Saída do registo',
        copyLog: 'Copiar registo',
        copyLogSuccess: 'Registo copiado!',
        copyLogFailed: 'Falha ao copiar o registo.',
        logEmpty: 'O registo está vazio.',
        cancelProcessing: 'Cancelar processamento',
        languageChangedNotice: 'Idioma alterado para {language}'
    },
    progressModal: {
        heading: 'Processamento do Notemd',
        starting: 'Iniciando...',
        cancelProgress: 'Cancelar',
        timeRemaining: 'Tempo restante estimado: {time}',
        timeRemainingCalculating: 'Tempo restante estimado: calculando...',
        cancelledOrError: 'Cancelado/Erro',
        processingStopped: 'Processamento interrompido.',
        cancelling: 'A cancelar...',
        userRequestedCancellation: 'O utilizador pediu o cancelamento.'
    }
};

export const STRINGS_PT_BR: LocaleStrings = {
    common: { language: 'Idioma', cancel: 'Cancelar', close: 'Fechar', copy: 'Copiar', ready: 'Pronto', standby: 'Em espera', unknownError: 'Erro desconhecido' },
    plugin: { viewName: 'Área de trabalho do Notemd', ribbonTooltip: 'Abrir barra lateral do Notemd' },
    folderPicker: { title: 'Selecionar pasta', vaultRoot: '(Raiz do cofre)', selectAction: 'Selecionar' },
    settings: {
        language: {
            heading: 'Configurações de idioma',
            uiLocaleName: 'Idioma da interface',
            uiLocaleDesc: 'Selecione o idioma usado pela interface do plugin. "Auto" segue o idioma atual do Obsidian.',
            uiLocaleAuto: 'Seguir o Obsidian',
            outputName: 'Idioma de saída',
            outputDesc: 'Selecione o idioma de saída desejado para as respostas do LLM.',
            perTaskName: 'Selecionar idiomas diferentes para tarefas diferentes.',
            perTaskDesc: 'Ligado: selecione abaixo um idioma específico para cada tarefa. Desligado: use apenas o "Idioma de saída".',
            disableAutoTranslationName: 'Desativar a tradução automática (exceto para a tarefa "Traduzir")',
            disableAutoTranslationDesc: 'Ligado: tarefas que não sejam de tradução não forçam um idioma de destino nem traduzem as saídas automaticamente. A tarefa explícita "Traduzir" continua funcionando como configurado.',
            taskLanguageLabel: 'Idioma de {task}',
            taskLanguageDesc: 'Selecione o idioma de saída para "{task}".'
        }
    },
    notices: {
        processingComplete: 'Processamento do Notemd concluído!',
        batchProcessingSuccess: '{count} arquivos processados com sucesso.',
        contentGenerationSuccess: 'Conteúdo gerado com sucesso para {file}!',
        researchSummaryAppended: 'Resumo de pesquisa para "{topic}" adicionado.',
        batchGenerationSuccess: 'Conteúdo gerado com sucesso para os arquivos elegíveis em "{folderPath}".',
        mermaidSummarizationComplete: 'Resumo do diagrama Mermaid concluído!',
        conceptExtractionSuccess: 'Extração de conceitos concluída! Foram encontradas e criadas {count} notas de conceito.',
        noConceptsFoundToExtract: 'Nenhum conceito encontrado para extrair.',
        batchExtractionSuccess: 'Extração em lote concluída! Foram encontrados {concepts} conceitos em {files} arquivos.'
    },
    errorModal: {
        copyDetails: 'Copiar detalhes do erro',
        copied: 'Copiado!',
        copySuccessNotice: 'Detalhes do erro copiados para a área de transferência!',
        copyFailedNotice: 'Falha ao copiar os detalhes do erro. Veja o console.',
        titles: { research: 'Erro de pesquisa', batchTranslation: 'Erro de tradução em lote' }
    },
    sidebar: {
        heroTitle: 'Área de trabalho do Notemd',
        heroDesc: 'Execute ações individuais ou fluxos personalizados de um clique com progresso e logs em tempo real.',
        defaultWorkflowName: 'Extração com um clique',
        quickWorkflowTitle: 'Fluxos rápidos',
        quickWorkflowDesc: 'Botões personalizados montados a partir de ações integradas.',
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
        },
        status: {
            runningAction: 'Executando "{label}"...',
            actionComplete: '"{label}" concluído',
            actionFailed: 'A ação falhou: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'A etapa falhou: {message}',
            processingStopped: 'Processamento interrompido.',
            cancelling: 'Cancelando...',
            userRequestedCancellation: 'O usuário solicitou o cancelamento.'
        },
        logOutputTitle: 'Saída do log',
        copyLog: 'Copiar log',
        copyLogSuccess: 'Log copiado!',
        copyLogFailed: 'Falha ao copiar o log.',
        logEmpty: 'O log está vazio.',
        cancelProcessing: 'Cancelar processamento',
        languageChangedNotice: 'Idioma alterado para {language}'
    },
    progressModal: {
        heading: 'Processamento do Notemd',
        starting: 'Iniciando...',
        cancelProgress: 'Cancelar',
        timeRemaining: 'Tempo restante estimado: {time}',
        timeRemainingCalculating: 'Tempo restante estimado: calculando...',
        cancelledOrError: 'Cancelado/Erro',
        processingStopped: 'Processamento interrompido.',
        cancelling: 'Cancelando...',
        userRequestedCancellation: 'O usuário solicitou o cancelamento.'
    }
};

export const STRINGS_RU: LocaleStrings = {
    common: { language: 'Язык', cancel: 'Отмена', close: 'Закрыть', copy: 'Копировать', ready: 'Готово', standby: 'Ожидание', unknownError: 'Неизвестная ошибка' },
    plugin: { viewName: 'Рабочее пространство Notemd', ribbonTooltip: 'Открыть боковую панель Notemd' },
    folderPicker: { title: 'Выбрать папку', vaultRoot: '(Корень хранилища)', selectAction: 'Выбрать' },
    settings: {
        language: {
            heading: 'Настройки языка',
            uiLocaleName: 'Язык интерфейса',
            uiLocaleDesc: 'Выберите язык интерфейса плагина. Режим "Авто" следует текущему языку Obsidian.',
            uiLocaleAuto: 'Следовать Obsidian',
            outputName: 'Язык вывода',
            outputDesc: 'Выберите желаемый язык вывода для ответов LLM.',
            perTaskName: 'Выбирать разные языки для разных задач.',
            perTaskDesc: 'Вкл.: выберите ниже отдельный язык для каждой задачи. Выкл.: используется один "Язык вывода".',
            disableAutoTranslationName: 'Отключить автоперевод (кроме задачи "Перевести")',
            disableAutoTranslationDesc: 'Вкл.: задачи, кроме перевода, не навязывают целевой язык и не переводят результаты автоматически. Явная задача "Перевести" по-прежнему работает согласно настройкам.',
            taskLanguageLabel: 'Язык для {task}',
            taskLanguageDesc: 'Выберите язык вывода для "{task}".'
        }
    },
    notices: {
        processingComplete: 'Обработка Notemd завершена!',
        batchProcessingSuccess: 'Успешно обработано {count} файлов.',
        contentGenerationSuccess: 'Содержимое для {file} успешно сгенерировано!',
        researchSummaryAppended: 'Сводка исследования для "{topic}" добавлена.',
        batchGenerationSuccess: 'Содержимое для подходящих файлов в "{folderPath}" успешно сгенерировано.',
        mermaidSummarizationComplete: 'Суммаризация диаграммы Mermaid завершена!',
        conceptExtractionSuccess: 'Извлечение концептов завершено! Найдено и создано {count} концепт-заметок.',
        noConceptsFoundToExtract: 'Концепты для извлечения не найдены.',
        batchExtractionSuccess: 'Пакетное извлечение завершено! Найдено {concepts} концептов в {files} файлах.'
    },
    errorModal: {
        copyDetails: 'Копировать детали ошибки',
        copied: 'Скопировано!',
        copySuccessNotice: 'Детали ошибки скопированы в буфер обмена!',
        copyFailedNotice: 'Не удалось скопировать детали ошибки. Проверьте консоль.',
        titles: { research: 'Ошибка исследования', batchTranslation: 'Ошибка пакетного перевода' }
    },
    sidebar: {
        heroTitle: 'Рабочее пространство Notemd',
        heroDesc: 'Запускайте отдельные действия или пользовательские workflow в один клик с живым прогрессом и логами.',
        defaultWorkflowName: 'Извлечение в один клик',
        quickWorkflowTitle: 'Быстрые workflow',
        quickWorkflowDesc: 'Пользовательские кнопки, собранные из встроенных действий.',
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
        },
        status: {
            runningAction: 'Выполняется "{label}"...',
            actionComplete: '"{label}" завершено',
            actionFailed: 'Действие не выполнено: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Шаг не выполнен: {message}',
            processingStopped: 'Обработка остановлена.',
            cancelling: 'Отмена...',
            userRequestedCancellation: 'Пользователь запросил отмену.'
        },
        logOutputTitle: 'Вывод журнала',
        copyLog: 'Копировать журнал',
        copyLogSuccess: 'Журнал скопирован!',
        copyLogFailed: 'Не удалось скопировать журнал.',
        logEmpty: 'Журнал пуст.',
        cancelProcessing: 'Отменить обработку',
        languageChangedNotice: 'Язык изменён на {language}'
    },
    progressModal: {
        heading: 'Обработка Notemd',
        starting: 'Запуск...',
        cancelProgress: 'Отмена',
        timeRemaining: 'Оценка оставшегося времени: {time}',
        timeRemainingCalculating: 'Оценка оставшегося времени: вычисление...',
        cancelledOrError: 'Отменено/Ошибка',
        processingStopped: 'Обработка остановлена.',
        cancelling: 'Отмена...',
        userRequestedCancellation: 'Пользователь запросил отмену.'
    }
};

export const STRINGS_TH: LocaleStrings = {
    common: { language: 'ภาษา', cancel: 'ยกเลิก', close: 'ปิด', copy: 'คัดลอก', ready: 'พร้อม', standby: 'รอ', unknownError: 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ' },
    plugin: { viewName: 'พื้นที่ทำงาน Notemd', ribbonTooltip: 'เปิดแถบด้านข้าง Notemd' },
    folderPicker: { title: 'เลือกโฟลเดอร์', vaultRoot: '(รากของ vault)', selectAction: 'เลือก' },
    settings: {
        language: {
            heading: 'การตั้งค่าภาษา',
            uiLocaleName: 'ภาษา UI',
            uiLocaleDesc: 'เลือกภาษาที่ใช้กับส่วนติดต่อของปลั๊กอิน ค่า "อัตโนมัติ" จะตามภาษาปัจจุบันของ Obsidian',
            uiLocaleAuto: 'ตาม Obsidian',
            outputName: 'ภาษาผลลัพธ์',
            outputDesc: 'เลือกภาษาผลลัพธ์ที่ต้องการสำหรับคำตอบจาก LLM',
            perTaskName: 'เลือกภาษาต่างกันสำหรับแต่ละงาน',
            perTaskDesc: 'เปิด: เลือกภาษาเฉพาะสำหรับแต่ละงานด้านล่าง ปิด: ใช้ "ภาษาผลลัพธ์" เพียงค่าเดียว',
            disableAutoTranslationName: 'ปิดการแปลอัตโนมัติ (ยกเว้นงาน "แปล")',
            disableAutoTranslationDesc: 'เปิด: งานที่ไม่ใช่งานแปลจะไม่บังคับภาษาปลายทางและจะไม่แปลผลลัพธ์อัตโนมัติ งาน "แปล" แบบชัดเจนยังคงทำงานตามการตั้งค่า',
            taskLanguageLabel: 'ภาษาของ {task}',
            taskLanguageDesc: 'เลือกภาษาผลลัพธ์สำหรับ "{task}"'
        }
    },
    notices: {
        processingComplete: 'การประมวลผล Notemd เสร็จสมบูรณ์!',
        batchProcessingSuccess: 'ประมวลผลไฟล์สำเร็จ {count} ไฟล์',
        contentGenerationSuccess: 'สร้างเนื้อหาสำเร็จสำหรับ {file}!',
        researchSummaryAppended: 'เพิ่มสรุปงานวิจัยสำหรับ "{topic}" แล้ว',
        batchGenerationSuccess: 'สร้างเนื้อหาสำเร็จสำหรับไฟล์ที่เข้าเกณฑ์ใน "{folderPath}"',
        mermaidSummarizationComplete: 'การสรุปเป็นแผนภาพ Mermaid เสร็จสมบูรณ์!',
        conceptExtractionSuccess: 'การดึงแนวคิดเสร็จสมบูรณ์! พบและสร้างบันทึกแนวคิด {count} รายการ',
        noConceptsFoundToExtract: 'ไม่พบแนวคิดที่จะดึง',
        batchExtractionSuccess: 'การดึงแบบกลุ่มเสร็จสมบูรณ์! พบ {concepts} แนวคิดใน {files} ไฟล์'
    },
    errorModal: {
        copyDetails: 'คัดลอกรายละเอียดข้อผิดพลาด',
        copied: 'คัดลอกแล้ว!',
        copySuccessNotice: 'คัดลอกรายละเอียดข้อผิดพลาดไปยังคลิปบอร์ดแล้ว!',
        copyFailedNotice: 'คัดลอกรายละเอียดข้อผิดพลาดไม่สำเร็จ ดูคอนโซล',
        titles: { research: 'ข้อผิดพลาดในการวิจัย', batchTranslation: 'ข้อผิดพลาดในการแปลแบบกลุ่ม' }
    },
    sidebar: {
        heroTitle: 'พื้นที่ทำงาน Notemd',
        heroDesc: 'เรียกใช้งานเดี่ยวหรือเวิร์กโฟลว์แบบคลิกเดียวพร้อมความคืบหน้าและบันทึกแบบสด',
        defaultWorkflowName: 'สกัดข้อมูลในคลิกเดียว',
        quickWorkflowTitle: 'เวิร์กโฟลว์ด่วน',
        quickWorkflowDesc: 'ปุ่มกำหนดเองที่ประกอบจากการกระทำในตัว',
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
        },
        status: {
            runningAction: 'กำลังเรียกใช้ "{label}"...',
            actionComplete: '"{label}" เสร็จสมบูรณ์',
            actionFailed: 'การทำงานล้มเหลว: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'ขั้นตอนล้มเหลว: {message}',
            processingStopped: 'หยุดการประมวลผลแล้ว',
            cancelling: 'กำลังยกเลิก...',
            userRequestedCancellation: 'ผู้ใช้ร้องขอการยกเลิก'
        },
        logOutputTitle: 'เอาต์พุตบันทึก',
        copyLog: 'คัดลอกบันทึก',
        copyLogSuccess: 'คัดลอกบันทึกแล้ว!',
        copyLogFailed: 'คัดลอกบันทึกไม่สำเร็จ',
        logEmpty: 'บันทึกว่างอยู่',
        cancelProcessing: 'ยกเลิกการประมวลผล',
        languageChangedNotice: 'เปลี่ยนภาษาเป็น {language} แล้ว'
    },
    progressModal: {
        heading: 'กำลังประมวลผล Notemd',
        starting: 'กำลังเริ่มต้น...',
        cancelProgress: 'ยกเลิก',
        timeRemaining: 'เวลาที่เหลือโดยประมาณ: {time}',
        timeRemainingCalculating: 'เวลาที่เหลือโดยประมาณ: กำลังคำนวณ...',
        cancelledOrError: 'ยกเลิก/ข้อผิดพลาด',
        processingStopped: 'หยุดการประมวลผลแล้ว',
        cancelling: 'กำลังยกเลิก...',
        userRequestedCancellation: 'ผู้ใช้ร้องขอการยกเลิก'
    }
};

export const STRINGS_TR: LocaleStrings = {
    common: { language: 'Dil', cancel: 'İptal', close: 'Kapat', copy: 'Kopyala', ready: 'Hazır', standby: 'Beklemede', unknownError: 'Bilinmeyen hata' },
    plugin: { viewName: 'Notemd çalışma alanı', ribbonTooltip: 'Notemd kenar çubuğunu aç' },
    folderPicker: { title: 'Klasör seç', vaultRoot: '(Vault kökü)', selectAction: 'Seç' },
    settings: {
        language: {
            heading: 'Dil ayarları',
            uiLocaleName: 'Arayüz dili',
            uiLocaleDesc: 'Eklenti arayüzünde kullanılacak dili seçin. "Otomatik", mevcut Obsidian dilini takip eder.',
            uiLocaleAuto: 'Obsidian’ı takip et',
            outputName: 'Çıktı dili',
            outputDesc: 'LLM yanıtları için istenen çıktı dilini seçin.',
            perTaskName: 'Farklı görevler için farklı diller seçin.',
            perTaskDesc: 'Açık: Aşağıda her görev için ayrı bir dil seçin. Kapalı: Tek bir "Çıktı dili" kullanın.',
            disableAutoTranslationName: 'Otomatik çeviriyi devre dışı bırak ("Çevir" görevi hariç)',
            disableAutoTranslationDesc: 'Açık: Çeviri dışındaki görevler hedef dili zorlamaz ve çıktıları otomatik çevirmeye çalışmaz. Açıkça verilen "Çevir" görevi ayarlandığı gibi çalışmaya devam eder.',
            taskLanguageLabel: '{task} dili',
            taskLanguageDesc: '"{task}" için çıktı dilini seçin.'
        }
    },
    notices: {
        processingComplete: 'Notemd işleme tamamlandı!',
        batchProcessingSuccess: '{count} dosya başarıyla işlendi.',
        contentGenerationSuccess: '{file} için içerik başarıyla oluşturuldu!',
        researchSummaryAppended: '"{topic}" için araştırma özeti eklendi.',
        batchGenerationSuccess: '"{folderPath}" içindeki uygun dosyalar için içerik başarıyla oluşturuldu.',
        mermaidSummarizationComplete: 'Mermaid diyagramı özetleme tamamlandı!',
        conceptExtractionSuccess: 'Kavram çıkarma tamamlandı! {count} kavram notu bulundu ve oluşturuldu.',
        noConceptsFoundToExtract: 'Çıkarılacak kavram bulunamadı.',
        batchExtractionSuccess: 'Toplu çıkarma tamamlandı! {files} dosyada {concepts} kavram bulundu.'
    },
    errorModal: {
        copyDetails: 'Hata ayrıntılarını kopyala',
        copied: 'Kopyalandı!',
        copySuccessNotice: 'Hata ayrıntıları panoya kopyalandı!',
        copyFailedNotice: 'Hata ayrıntıları kopyalanamadı. Konsolu kontrol edin.',
        titles: { research: 'Araştırma Hatası', batchTranslation: 'Toplu Çeviri Hatası' }
    },
    sidebar: {
        heroTitle: 'Notemd çalışma alanı',
        heroDesc: 'Canlı ilerleme ve günlüklerle tekil eylemler veya özel tek tıklamalı iş akışları çalıştırın.',
        defaultWorkflowName: 'Tek tıkla çıkarım',
        quickWorkflowTitle: 'Hızlı iş akışları',
        quickWorkflowDesc: 'Yerleşik eylemlerden oluşturulan özel düğmeler.',
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
        },
        status: {
            runningAction: '"{label}" çalıştırılıyor...',
            actionComplete: '"{label}" tamamlandı',
            actionFailed: 'Eylem başarısız oldu: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Adım başarısız oldu: {message}',
            processingStopped: 'İşleme durduruldu.',
            cancelling: 'İptal ediliyor...',
            userRequestedCancellation: 'Kullanıcı iptal istedi.'
        },
        logOutputTitle: 'Günlük çıktısı',
        copyLog: 'Günlüğü kopyala',
        copyLogSuccess: 'Günlük kopyalandı!',
        copyLogFailed: 'Günlük kopyalanamadı.',
        logEmpty: 'Günlük boş.',
        cancelProcessing: 'İşlemeyi iptal et',
        languageChangedNotice: 'Dil {language} olarak değiştirildi'
    },
    progressModal: {
        heading: 'Notemd işleniyor',
        starting: 'Başlatılıyor...',
        cancelProgress: 'İptal',
        timeRemaining: 'Tahmini kalan süre: {time}',
        timeRemainingCalculating: 'Tahmini kalan süre: hesaplanıyor...',
        cancelledOrError: 'İptal edildi/Hata',
        processingStopped: 'İşleme durduruldu.',
        cancelling: 'İptal ediliyor...',
        userRequestedCancellation: 'Kullanıcı iptal istedi.'
    }
};

export const STRINGS_UK: LocaleStrings = {
    common: { language: 'Мова', cancel: 'Скасувати', close: 'Закрити', copy: 'Копіювати', ready: 'Готово', standby: 'Очікування', unknownError: 'Невідома помилка' },
    plugin: { viewName: 'Робочий простір Notemd', ribbonTooltip: 'Відкрити бічну панель Notemd' },
    folderPicker: { title: 'Вибрати теку', vaultRoot: '(Корінь сховища)', selectAction: 'Вибрати' },
    settings: {
        language: {
            heading: 'Налаштування мови',
            uiLocaleName: 'Мова інтерфейсу',
            uiLocaleDesc: 'Виберіть мову інтерфейсу плагіна. Режим "Авто" наслідує поточну мову Obsidian.',
            uiLocaleAuto: 'Наслідувати Obsidian',
            outputName: 'Мова виводу',
            outputDesc: 'Виберіть бажану мову виводу для відповідей LLM.',
            perTaskName: 'Вибирати різні мови для різних завдань.',
            perTaskDesc: 'Увімкнено: виберіть окрему мову для кожного завдання нижче. Вимкнено: використовуйте одну "Мову виводу".',
            disableAutoTranslationName: 'Вимкнути автопереклад (крім завдання "Перекласти")',
            disableAutoTranslationDesc: 'Увімкнено: завдання, що не є перекладом, не нав’язують цільову мову й не перекладають вихід автоматично. Явне завдання "Перекласти" і далі працює згідно з налаштуванням.',
            taskLanguageLabel: 'Мова для {task}',
            taskLanguageDesc: 'Виберіть мову виводу для "{task}".'
        }
    },
    notices: {
        processingComplete: 'Обробку Notemd завершено!',
        batchProcessingSuccess: 'Успішно оброблено {count} файлів.',
        contentGenerationSuccess: 'Вміст для {file} успішно згенеровано!',
        researchSummaryAppended: 'Зведення дослідження для "{topic}" додано.',
        batchGenerationSuccess: 'Вміст для відповідних файлів у "{folderPath}" успішно згенеровано.',
        mermaidSummarizationComplete: 'Підсумок діаграми Mermaid завершено!',
        conceptExtractionSuccess: 'Витяг концептів завершено! Знайдено й створено {count} концепт-нотаток.',
        noConceptsFoundToExtract: 'Не знайдено концептів для витягування.',
        batchExtractionSuccess: 'Пакетне витягування завершено! Знайдено {concepts} концептів у {files} файлах.'
    },
    errorModal: {
        copyDetails: 'Копіювати деталі помилки',
        copied: 'Скопійовано!',
        copySuccessNotice: 'Деталі помилки скопійовано до буфера обміну!',
        copyFailedNotice: 'Не вдалося скопіювати деталі помилки. Перевірте консоль.',
        titles: { research: 'Помилка дослідження', batchTranslation: 'Помилка пакетного перекладу' }
    },
    sidebar: {
        heroTitle: 'Робочий простір Notemd',
        heroDesc: 'Запускайте окремі дії або власні workflow в один клік із живим прогресом і журналами.',
        defaultWorkflowName: 'Витяг одним кліком',
        quickWorkflowTitle: 'Швидкі workflow',
        quickWorkflowDesc: 'Користувацькі кнопки, зібрані з вбудованих дій.',
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
        },
        status: {
            runningAction: 'Виконується "{label}"...',
            actionComplete: '"{label}" завершено',
            actionFailed: 'Дія завершилась помилкою: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Крок завершився помилкою: {message}',
            processingStopped: 'Обробку зупинено.',
            cancelling: 'Скасування...',
            userRequestedCancellation: 'Користувач запросив скасування.'
        },
        logOutputTitle: 'Вивід журналу',
        copyLog: 'Копіювати журнал',
        copyLogSuccess: 'Журнал скопійовано!',
        copyLogFailed: 'Не вдалося скопіювати журнал.',
        logEmpty: 'Журнал порожній.',
        cancelProcessing: 'Скасувати обробку',
        languageChangedNotice: 'Мову змінено на {language}'
    },
    progressModal: {
        heading: 'Обробка Notemd',
        starting: 'Запуск...',
        cancelProgress: 'Скасувати',
        timeRemaining: 'Оцінка часу, що залишився: {time}',
        timeRemainingCalculating: 'Оцінка часу, що залишився: обчислення...',
        cancelledOrError: 'Скасовано/Помилка',
        processingStopped: 'Обробку зупинено.',
        cancelling: 'Скасування...',
        userRequestedCancellation: 'Користувач запросив скасування.'
    }
};

export const STRINGS_VI: LocaleStrings = {
    common: { language: 'Ngôn ngữ', cancel: 'Hủy', close: 'Đóng', copy: 'Sao chép', ready: 'Sẵn sàng', standby: 'Chờ', unknownError: 'Lỗi không xác định' },
    plugin: { viewName: 'Không gian làm việc Notemd', ribbonTooltip: 'Mở thanh bên Notemd' },
    folderPicker: { title: 'Chọn thư mục', vaultRoot: '(Gốc vault)', selectAction: 'Chọn' },
    settings: {
        language: {
            heading: 'Cài đặt ngôn ngữ',
            uiLocaleName: 'Ngôn ngữ giao diện',
            uiLocaleDesc: 'Chọn ngôn ngữ dùng cho giao diện plugin. "Tự động" sẽ theo ngôn ngữ Obsidian hiện tại.',
            uiLocaleAuto: 'Theo Obsidian',
            outputName: 'Ngôn ngữ đầu ra',
            outputDesc: 'Chọn ngôn ngữ đầu ra mong muốn cho phản hồi từ LLM.',
            perTaskName: 'Chọn ngôn ngữ khác nhau cho các tác vụ khác nhau.',
            perTaskDesc: 'Bật: chọn một ngôn ngữ riêng cho từng tác vụ bên dưới. Tắt: dùng một "Ngôn ngữ đầu ra" duy nhất.',
            disableAutoTranslationName: 'Tắt dịch tự động (trừ tác vụ "Dịch")',
            disableAutoTranslationDesc: 'Bật: các tác vụ không phải dịch sẽ không ép ngôn ngữ đích và không tự động dịch đầu ra. Tác vụ "Dịch" tường minh vẫn hoạt động theo cấu hình.',
            taskLanguageLabel: 'Ngôn ngữ của {task}',
            taskLanguageDesc: 'Chọn ngôn ngữ đầu ra cho "{task}".'
        }
    },
    notices: {
        processingComplete: 'Đã hoàn tất xử lý Notemd!',
        batchProcessingSuccess: 'Đã xử lý thành công {count} tệp.',
        contentGenerationSuccess: 'Đã tạo nội dung thành công cho {file}!',
        researchSummaryAppended: 'Đã thêm tóm tắt nghiên cứu cho "{topic}".',
        batchGenerationSuccess: 'Đã tạo nội dung thành công cho các tệp đủ điều kiện trong "{folderPath}".',
        mermaidSummarizationComplete: 'Đã hoàn tất tóm tắt sơ đồ Mermaid!',
        conceptExtractionSuccess: 'Đã hoàn tất trích xuất khái niệm! Đã tìm thấy và tạo {count} ghi chú khái niệm.',
        noConceptsFoundToExtract: 'Không tìm thấy khái niệm nào để trích xuất.',
        batchExtractionSuccess: 'Đã hoàn tất trích xuất hàng loạt! Tìm thấy {concepts} khái niệm trong {files} tệp.'
    },
    errorModal: {
        copyDetails: 'Sao chép chi tiết lỗi',
        copied: 'Đã sao chép!',
        copySuccessNotice: 'Đã sao chép chi tiết lỗi vào bộ nhớ tạm!',
        copyFailedNotice: 'Không thể sao chép chi tiết lỗi. Xem bảng điều khiển.',
        titles: { research: 'Lỗi nghiên cứu', batchTranslation: 'Lỗi dịch hàng loạt' }
    },
    sidebar: {
        heroTitle: 'Không gian làm việc Notemd',
        heroDesc: 'Chạy hành động đơn lẻ hoặc quy trình một chạm tùy chỉnh với tiến độ và nhật ký trực tiếp.',
        defaultWorkflowName: 'Trích xuất một chạm',
        quickWorkflowTitle: 'Quy trình nhanh',
        quickWorkflowDesc: 'Các nút tùy chỉnh được ghép từ những hành động tích hợp sẵn.',
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
        },
        status: {
            runningAction: 'Đang chạy "{label}"...',
            actionComplete: 'Hoàn tất "{label}"',
            actionFailed: 'Hành động thất bại: {message}',
            stepLabel: '[{current}/{total}] {label}',
            stepFailed: 'Bước thất bại: {message}',
            processingStopped: 'Đã dừng xử lý.',
            cancelling: 'Đang hủy...',
            userRequestedCancellation: 'Người dùng đã yêu cầu hủy.'
        },
        logOutputTitle: 'Đầu ra nhật ký',
        copyLog: 'Sao chép nhật ký',
        copyLogSuccess: 'Đã sao chép nhật ký!',
        copyLogFailed: 'Không thể sao chép nhật ký.',
        logEmpty: 'Nhật ký trống.',
        cancelProcessing: 'Hủy xử lý',
        languageChangedNotice: 'Đã đổi ngôn ngữ sang {language}'
    },
    progressModal: {
        heading: 'Đang xử lý Notemd',
        starting: 'Đang bắt đầu...',
        cancelProgress: 'Hủy',
        timeRemaining: 'Thời gian còn lại ước tính: {time}',
        timeRemainingCalculating: 'Thời gian còn lại ước tính: đang tính...',
        cancelledOrError: 'Đã hủy/Lỗi',
        processingStopped: 'Đã dừng xử lý.',
        cancelling: 'Đang hủy...',
        userRequestedCancellation: 'Người dùng đã yêu cầu hủy.'
    }
};

extendLocale(STRINGS_AR, {
    common: { select: 'اختيار' },
    commands: {
        checkDuplicatesCurrent: 'فحص التكرارات في الملف الحالي',
        extractConceptsAndGenerateTitles: 'استخراج المفاهيم وإنشاء العناوين',
        createWikiLinkAndGenerateNoteFromSelection: 'إنشاء رابط ويكي وتوليد ملاحظة من التحديد'
    },
    duplicateModal: {
        title: 'تأكيد حذف التكرارات',
        intro: 'تم تحديد ملاحظات المفاهيم الـ {count} التالية كتكرارات محتملة وسيتم نقلها إلى سلة مهملات النظام:',
        reason: 'السبب: {reason}',
        conflictsWith: 'يتعارض مع: {files}',
        warning: 'لا يمكن التراجع عن هذا الإجراء بسهولة من داخل Obsidian، ولكن يمكن عادةً استعادة الملفات من سلة مهملات النظام.',
        deleteFiles: 'حذف {count} ملفات'
    },
    settings: {
        developer: { heading: 'تشخيصات المطور' },
        providerConfig: { heading: 'مزودو LLM' },
        multiModel: { heading: 'استخدام النماذج المتعددة' },
        translationTask: { heading: 'المهمة: الترجمة' },
        mermaidTask: { heading: 'المهمة: التلخيص كمخطط Mermaid' },
        extractConceptsTask: { heading: 'المهمة: استخراج المفاهيم' },
        stableApi: { heading: 'استدعاءات API المستقرة' },
        workflowBuilder: { heading: 'أزرار سير العمل بنقرة واحدة' },
        generalOutput: {
            processedHeading: 'مخرجات الملفات المعالجة',
            conceptNoteHeading: 'مخرجات ملاحظات المفاهيم',
            conceptLogHeading: 'مخرجات سجل المفاهيم'
        },
        contentGeneration: { heading: 'إنشاء المحتوى والمخرجات' },
        customPrompts: { heading: 'إعدادات المطالبات المخصصة' },
        extractOriginalText: { heading: 'استخراج النص الأصلي المحدد' },
        webResearch: { heading: 'مزود البحث على الويب' },
        processing: { heading: 'معلمات المعالجة' },
        batchProcessing: { heading: 'المعالجة الدفعية' },
        batchMermaidFix: { heading: 'إصلاح Mermaid دفعة واحدة' },
        duplicateScope: { heading: 'نطاق فحص التكرارات' },
        focusedLearning: { heading: 'مجال التعلّم المركّز' }
    }
});

extendLocale(STRINGS_DE, {
    common: { select: 'Auswählen' },
    commands: {
        checkDuplicatesCurrent: 'Duplikate in aktueller Datei prüfen',
        extractConceptsAndGenerateTitles: 'Konzepte extrahieren und Titel generieren',
        createWikiLinkAndGenerateNoteFromSelection: 'Wiki-Link erstellen und Notiz aus Auswahl generieren'
    },
    duplicateModal: {
        title: 'Löschen von Duplikaten bestätigen',
        intro: 'Die folgenden {count} Konzeptnotizen wurden als potenzielle Duplikate erkannt und werden in den Systempapierkorb verschoben:',
        reason: 'Grund: {reason}',
        conflictsWith: 'Konflikt mit: {files}',
        warning: 'Diese Aktion lässt sich in Obsidian nicht einfach rückgängig machen, die Dateien können jedoch normalerweise aus dem Systempapierkorb wiederhergestellt werden.',
        deleteFiles: '{count} Dateien löschen'
    },
    settings: {
        developer: { heading: 'Entwicklerdiagnose' },
        providerConfig: { heading: 'LLM-Anbieter' },
        multiModel: { heading: 'Mehrmodell-Nutzung' },
        translationTask: { heading: 'Aufgabe: Übersetzen' },
        mermaidTask: { heading: 'Aufgabe: Als Mermaid-Diagramm zusammenfassen' },
        extractConceptsTask: { heading: 'Aufgabe: Konzepte extrahieren' },
        stableApi: { heading: 'Stabile API-Aufrufe' },
        workflowBuilder: { heading: 'Ein-Klick-Workflow-Schaltflächen' },
        generalOutput: {
            processedHeading: 'Ausgabe verarbeiteter Dateien',
            conceptNoteHeading: 'Ausgabe von Konzeptnotizen',
            conceptLogHeading: 'Ausgabe der Konzeptprotokolldatei'
        },
        contentGeneration: { heading: 'Inhaltsgenerierung und Ausgabe' },
        customPrompts: { heading: 'Einstellungen für benutzerdefinierte Prompts' },
        extractOriginalText: { heading: 'Bestimmten Originaltext extrahieren' },
        webResearch: { heading: 'Web-Recherche-Anbieter' },
        processing: { heading: 'Verarbeitungsparameter' },
        batchProcessing: { heading: 'Stapelverarbeitung' },
        batchMermaidFix: { heading: 'Stapelweise Mermaid-Reparatur' },
        duplicateScope: { heading: 'Umfang der Duplikatprüfung' },
        focusedLearning: { heading: 'Fokussierter Lernbereich' }
    }
});

extendLocale(STRINGS_ES, {
    common: { select: 'Seleccionar' },
    commands: {
        checkDuplicatesCurrent: 'Comprobar duplicados en el archivo actual',
        extractConceptsAndGenerateTitles: 'Extraer conceptos y generar títulos',
        createWikiLinkAndGenerateNoteFromSelection: 'Crear enlace wiki y generar nota desde la selección'
    },
    duplicateModal: {
        title: 'Confirmar eliminación de duplicados',
        intro: 'Las siguientes {count} notas de concepto se identificaron como posibles duplicados y se moverán a la papelera del sistema:',
        reason: 'Motivo: {reason}',
        conflictsWith: 'En conflicto con: {files}',
        warning: 'Esta acción no puede deshacerse fácilmente desde Obsidian, aunque normalmente los archivos pueden recuperarse desde la papelera del sistema.',
        deleteFiles: 'Eliminar {count} archivos'
    },
    settings: {
        developer: { heading: 'Diagnósticos de desarrollador' },
        providerConfig: { heading: 'Proveedores LLM' },
        multiModel: { heading: 'Uso de múltiples modelos' },
        translationTask: { heading: 'Tarea: Traducir' },
        mermaidTask: { heading: 'Tarea: Resumir como diagrama Mermaid' },
        extractConceptsTask: { heading: 'Tarea: Extraer conceptos' },
        stableApi: { heading: 'Llamadas API estables' },
        workflowBuilder: { heading: 'Botones de flujo de un clic' },
        generalOutput: {
            processedHeading: 'Salida del archivo procesado',
            conceptNoteHeading: 'Salida de notas de concepto',
            conceptLogHeading: 'Salida del archivo de registro de conceptos'
        },
        contentGeneration: { heading: 'Generación de contenido y salida' },
        customPrompts: { heading: 'Ajustes de prompts personalizados' },
        extractOriginalText: { heading: 'Extraer texto original específico' },
        webResearch: { heading: 'Proveedor de investigación web' },
        processing: { heading: 'Parámetros de procesamiento' },
        batchProcessing: { heading: 'Procesamiento por lotes' },
        batchMermaidFix: { heading: 'Corrección Mermaid por lotes' },
        duplicateScope: { heading: 'Alcance de verificación de duplicados' },
        focusedLearning: { heading: 'Dominio de aprendizaje enfocado' }
    }
});

extendLocale(STRINGS_FA, {
    common: { select: 'انتخاب' },
    commands: {
        checkDuplicatesCurrent: 'بررسی موارد تکراری در فایل فعلی',
        extractConceptsAndGenerateTitles: 'استخراج مفاهیم و تولید عنوان‌ها',
        createWikiLinkAndGenerateNoteFromSelection: 'ایجاد پیوند ویکی و تولید یادداشت از متن انتخاب‌شده'
    },
    duplicateModal: {
        title: 'تأیید حذف موارد تکراری',
        intro: 'یادداشت‌های مفهومی زیر به تعداد {count} مورد به‌عنوان موارد تکراری احتمالی شناسایی شده‌اند و به سطل زبالهٔ سیستم منتقل می‌شوند:',
        reason: 'دلیل: {reason}',
        conflictsWith: 'تداخل با: {files}',
        warning: 'بازگردانی این اقدام از داخل Obsidian آسان نیست، اما معمولاً می‌توان فایل‌ها را از سطل زبالهٔ سیستم بازیابی کرد.',
        deleteFiles: 'حذف {count} فایل'
    },
    settings: {
        developer: { heading: 'عیب‌یابی توسعه‌دهنده' },
        providerConfig: { heading: 'ارائه‌دهندگان LLM' },
        multiModel: { heading: 'استفاده از چندمدل' },
        translationTask: { heading: 'کار: ترجمه' },
        mermaidTask: { heading: 'کار: خلاصه‌سازی به صورت نمودار Mermaid' },
        extractConceptsTask: { heading: 'کار: استخراج مفاهیم' },
        stableApi: { heading: 'فراخوانی‌های پایدار API' },
        workflowBuilder: { heading: 'دکمه‌های گردش‌کار تک‌کلیکی' },
        generalOutput: {
            processedHeading: 'خروجی فایل پردازش‌شده',
            conceptNoteHeading: 'خروجی یادداشت مفهوم',
            conceptLogHeading: 'خروجی فایل گزارش مفاهیم'
        },
        contentGeneration: { heading: 'تولید محتوا و خروجی' },
        customPrompts: { heading: 'تنظیمات پرامپت سفارشی' },
        extractOriginalText: { heading: 'استخراج متن اصلی مشخص' },
        webResearch: { heading: 'ارائه‌دهنده پژوهش وب' },
        processing: { heading: 'پارامترهای پردازش' },
        batchProcessing: { heading: 'پردازش دسته‌ای' },
        batchMermaidFix: { heading: 'اصلاح دسته‌ای Mermaid' },
        duplicateScope: { heading: 'دامنه بررسی موارد تکراری' },
        focusedLearning: { heading: 'حوزه یادگیری متمرکز' }
    }
});

extendLocale(STRINGS_FR, {
    common: { select: 'Sélectionner' },
    commands: {
        checkDuplicatesCurrent: 'Vérifier les doublons dans le fichier actuel',
        extractConceptsAndGenerateTitles: 'Extraire les concepts et générer les titres',
        createWikiLinkAndGenerateNoteFromSelection: 'Créer un lien wiki et générer une note à partir de la sélection'
    },
    duplicateModal: {
        title: 'Confirmer la suppression des doublons',
        intro: 'Les {count} notes de concept suivantes ont été identifiées comme des doublons potentiels et seront déplacées vers la corbeille du système :',
        reason: 'Raison : {reason}',
        conflictsWith: 'En conflit avec : {files}',
        warning: 'Cette action ne peut pas être annulée facilement dans Obsidian, mais les fichiers peuvent généralement être récupérés depuis la corbeille du système.',
        deleteFiles: 'Supprimer {count} fichiers'
    },
    settings: {
        developer: { heading: 'Diagnostics développeur' },
        providerConfig: { heading: 'Fournisseurs LLM' },
        multiModel: { heading: 'Utilisation multi-modèle' },
        translationTask: { heading: 'Tâche : Traduire' },
        mermaidTask: { heading: 'Tâche : Résumer en diagramme Mermaid' },
        extractConceptsTask: { heading: 'Tâche : Extraire les concepts' },
        stableApi: { heading: 'Appels API stables' },
        workflowBuilder: { heading: 'Boutons de workflow en un clic' },
        generalOutput: {
            processedHeading: 'Sortie des fichiers traités',
            conceptNoteHeading: 'Sortie des notes de concept',
            conceptLogHeading: 'Sortie du fichier journal des concepts'
        },
        contentGeneration: { heading: 'Génération de contenu et sortie' },
        customPrompts: { heading: 'Paramètres des prompts personnalisés' },
        extractOriginalText: { heading: 'Extraire un texte original spécifique' },
        webResearch: { heading: 'Fournisseur de recherche web' },
        processing: { heading: 'Paramètres de traitement' },
        batchProcessing: { heading: 'Traitement par lot' },
        batchMermaidFix: { heading: 'Correction Mermaid par lot' },
        duplicateScope: { heading: 'Portée de vérification des doublons' },
        focusedLearning: { heading: 'Domaine d’apprentissage ciblé' }
    }
});

extendLocale(STRINGS_ID, {
    common: { select: 'Pilih' },
    commands: {
        checkDuplicatesCurrent: 'Periksa duplikat pada file saat ini',
        extractConceptsAndGenerateTitles: 'Ekstrak konsep dan hasilkan judul',
        createWikiLinkAndGenerateNoteFromSelection: 'Buat tautan wiki dan hasilkan catatan dari pilihan'
    },
    duplicateModal: {
        title: 'Konfirmasi penghapusan duplikat',
        intro: 'Sebanyak {count} catatan konsep berikut diidentifikasi sebagai kemungkinan duplikat dan akan dipindahkan ke tempat sampah sistem:',
        reason: 'Alasan: {reason}',
        conflictsWith: 'Bertabrakan dengan: {files}',
        warning: 'Tindakan ini tidak mudah dibatalkan dari dalam Obsidian, tetapi file biasanya masih dapat dipulihkan dari tempat sampah sistem.',
        deleteFiles: 'Hapus {count} file'
    },
    settings: {
        developer: { heading: 'Diagnostik pengembang' },
        providerConfig: { heading: 'Penyedia LLM' },
        multiModel: { heading: 'Penggunaan multi-model' },
        translationTask: { heading: 'Tugas: Terjemahkan' },
        mermaidTask: { heading: 'Tugas: Ringkas sebagai diagram Mermaid' },
        extractConceptsTask: { heading: 'Tugas: Ekstrak konsep' },
        stableApi: { heading: 'Panggilan API stabil' },
        workflowBuilder: { heading: 'Tombol alur satu klik' },
        generalOutput: {
            processedHeading: 'Keluaran file yang diproses',
            conceptNoteHeading: 'Keluaran catatan konsep',
            conceptLogHeading: 'Keluaran file log konsep'
        },
        contentGeneration: { heading: 'Pembuatan konten dan keluaran' },
        customPrompts: { heading: 'Pengaturan prompt kustom' },
        extractOriginalText: { heading: 'Ekstrak teks asli tertentu' },
        webResearch: { heading: 'Penyedia riset web' },
        processing: { heading: 'Parameter pemrosesan' },
        batchProcessing: { heading: 'Pemrosesan batch' },
        batchMermaidFix: { heading: 'Perbaikan Mermaid batch' },
        duplicateScope: { heading: 'Cakupan pemeriksaan duplikat' },
        focusedLearning: { heading: 'Domain pembelajaran terfokus' }
    }
});

extendLocale(STRINGS_IT, {
    common: { select: 'Seleziona' },
    commands: {
        checkDuplicatesCurrent: 'Controlla duplicati nel file corrente',
        extractConceptsAndGenerateTitles: 'Estrai concetti e genera titoli',
        createWikiLinkAndGenerateNoteFromSelection: 'Crea link wiki e genera nota dalla selezione'
    },
    duplicateModal: {
        title: 'Conferma eliminazione duplicati',
        intro: 'Le seguenti {count} note concetto sono state identificate come potenziali duplicati e verranno spostate nel cestino di sistema:',
        reason: 'Motivo: {reason}',
        conflictsWith: 'In conflitto con: {files}',
        warning: 'Questa azione non può essere facilmente annullata da Obsidian, ma i file di solito possono essere recuperati dal cestino di sistema.',
        deleteFiles: 'Elimina {count} file'
    },
    settings: {
        developer: { heading: 'Diagnostica sviluppatore' },
        providerConfig: { heading: 'Provider LLM' },
        multiModel: { heading: 'Uso multi-modello' },
        translationTask: { heading: 'Attività: Traduci' },
        mermaidTask: { heading: 'Attività: Riassumi come diagramma Mermaid' },
        extractConceptsTask: { heading: 'Attività: Estrai concetti' },
        stableApi: { heading: 'Chiamate API stabili' },
        workflowBuilder: { heading: 'Pulsanti workflow con un clic' },
        generalOutput: {
            processedHeading: 'Output file elaborato',
            conceptNoteHeading: 'Output note concetto',
            conceptLogHeading: 'Output file di log dei concetti'
        },
        contentGeneration: { heading: 'Generazione contenuti e output' },
        customPrompts: { heading: 'Impostazioni prompt personalizzati' },
        extractOriginalText: { heading: 'Estrai testo originale specifico' },
        webResearch: { heading: 'Provider di ricerca web' },
        processing: { heading: 'Parametri di elaborazione' },
        batchProcessing: { heading: 'Elaborazione batch' },
        batchMermaidFix: { heading: 'Correzione Mermaid batch' },
        duplicateScope: { heading: 'Ambito controllo duplicati' },
        focusedLearning: { heading: 'Dominio di apprendimento focalizzato' }
    }
});

extendLocale(STRINGS_JA, {
    common: { select: '選択' },
    commands: {
        checkDuplicatesCurrent: '現在のファイルの重複を確認',
        extractConceptsAndGenerateTitles: '概念を抽出してタイトルを生成',
        createWikiLinkAndGenerateNoteFromSelection: 'Wikiリンクを作成して選択範囲からノートを生成'
    },
    duplicateModal: {
        title: '重複削除の確認',
        intro: '次の {count} 件の概念ノートは重複の可能性があると判定され、システムのゴミ箱に移動されます:',
        reason: '理由: {reason}',
        conflictsWith: '競合先: {files}',
        warning: 'この操作は Obsidian 内では簡単に元に戻せませんが、通常はシステムのゴミ箱からファイルを復元できます。',
        deleteFiles: '{count} 件のファイルを削除'
    },
    settings: {
        developer: { heading: '開発者向け診断' },
        providerConfig: { heading: 'LLM プロバイダー' },
        multiModel: { heading: 'マルチモデル利用' },
        translationTask: { heading: 'タスク: 翻訳' },
        mermaidTask: { heading: 'タスク: Mermaid 図として要約' },
        extractConceptsTask: { heading: 'タスク: 概念を抽出' },
        stableApi: { heading: '安定した API 呼び出し' },
        workflowBuilder: { heading: 'ワンクリックワークフローボタン' },
        generalOutput: {
            processedHeading: '処理済みファイル出力',
            conceptNoteHeading: '概念ノート出力',
            conceptLogHeading: '概念ログファイル出力'
        },
        contentGeneration: { heading: 'コンテンツ生成と出力' },
        customPrompts: { heading: 'カスタムプロンプト設定' },
        extractOriginalText: { heading: '特定の原文を抽出' },
        webResearch: { heading: 'Web 調査プロバイダー' },
        processing: { heading: '処理パラメータ' },
        batchProcessing: { heading: '一括処理' },
        batchMermaidFix: { heading: 'Mermaid 一括修正' },
        duplicateScope: { heading: '重複確認の範囲' },
        focusedLearning: { heading: '重点学習ドメイン' }
    }
});

extendLocale(STRINGS_KO, {
    common: { select: '선택' },
    commands: {
        checkDuplicatesCurrent: '현재 파일에서 중복 확인',
        extractConceptsAndGenerateTitles: '개념 추출 및 제목 생성',
        createWikiLinkAndGenerateNoteFromSelection: '위키 링크 생성 및 선택 영역에서 노트 생성'
    },
    duplicateModal: {
        title: '중복 삭제 확인',
        intro: '다음 {count}개의 개념 노트가 잠재적 중복으로 식별되었으며 시스템 휴지통으로 이동됩니다:',
        reason: '이유: {reason}',
        conflictsWith: '충돌 대상: {files}',
        warning: '이 작업은 Obsidian 안에서 쉽게 되돌릴 수 없지만, 파일은 보통 시스템 휴지통에서 복구할 수 있습니다.',
        deleteFiles: '{count}개 파일 삭제'
    },
    settings: {
        developer: { heading: '개발자 진단' },
        providerConfig: { heading: 'LLM 제공자' },
        multiModel: { heading: '멀티모델 사용' },
        translationTask: { heading: '작업: 번역' },
        mermaidTask: { heading: '작업: Mermaid 다이어그램으로 요약' },
        extractConceptsTask: { heading: '작업: 개념 추출' },
        stableApi: { heading: '안정적인 API 호출' },
        workflowBuilder: { heading: '원클릭 워크플로 버튼' },
        generalOutput: {
            processedHeading: '처리된 파일 출력',
            conceptNoteHeading: '개념 노트 출력',
            conceptLogHeading: '개념 로그 파일 출력'
        },
        contentGeneration: { heading: '콘텐츠 생성 및 출력' },
        customPrompts: { heading: '사용자 정의 프롬프트 설정' },
        extractOriginalText: { heading: '특정 원문 추출' },
        webResearch: { heading: '웹 연구 제공자' },
        processing: { heading: '처리 매개변수' },
        batchProcessing: { heading: '일괄 처리' },
        batchMermaidFix: { heading: 'Mermaid 일괄 수정' },
        duplicateScope: { heading: '중복 확인 범위' },
        focusedLearning: { heading: '집중 학습 도메인' }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        providerConfig: {
            summaryTitle: 'Providerpresets uitgebreid naar {count} items.',
            summaryDesc:
                'OpenAI-compatibele providers delen nu één runtime-pad. Ingebouwde presets dekken China-gerichte diensten zoals Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan en SiliconFlow, en de algemene preset "OpenAI Compatible" kan LiteLLM, vLLM, Perplexity, Vercel AI Gateway of je eigen proxy gebruiken.',
            manageName: 'Providerconfiguraties beheren',
            manageDesc: 'Exporteer je huidige providerinstellingen naar een JSON-bestand of importeer instellingen uit een bestand.',
            exportButton: 'Providers exporteren',
            exportTooltip: 'Providerconfiguraties opslaan',
            importButton: 'Providers importeren',
            importTooltip: 'Providerconfiguraties laden (samenvoegen)',
            activeProviderName: 'Actieve provider',
            activeProviderDesc: 'Selecteer de LLM-provider die voor verwerking wordt gebruikt.',
            providerDetailsHeading: 'Details van {provider}',
            apiKeyName: 'API-sleutel',
            apiKeyDescRequired: 'API-sleutel voor {provider}.{extra}',
            apiKeyDescOptional: 'API-sleutel voor {provider}. Optioneel voor endpoints die anonieme toegang of placeholders toestaan.',
            apiKeyExtraLmStudio: " (Optioneel, vaak 'EMPTY')",
            apiKeyPlaceholderDefault: 'Voer je API-sleutel in',
            apiKeyPlaceholderLmStudio: 'Meestal EMPTY of leeg laten',
            baseUrlName: 'Basis-URL / endpoint',
            baseUrlDesc: 'Het API-endpoint voor {provider}.{required}',
            baseUrlRequired: ' Verplicht.',
            baseUrlPlaceholder: 'Voer de basis-URL van de API in',
            modelName: 'Model',
            modelDesc: 'Modelnaam om met {provider} te gebruiken.',
            modelPlaceholder: 'Voer modelnaam in',
            temperatureName: 'Temperatuur',
            temperatureDesc: 'Bepaalt de mate van willekeur (0=deterministisch, 1=creatief).',
            apiVersionName: 'API-versie',
            apiVersionDesc: 'Vereiste API-versie voor Azure OpenAI (bijv. 2024-02-15-preview)',
            apiVersionPlaceholder: 'Voer API-versie in',
            testConnectionName: 'Verbinding met {provider} testen',
            testConnectionDesc: 'Controleer API-sleutel, endpoint en modeltoegang.',
            testConnectionButton: 'Verbinding testen',
            testConnectionTesting: 'Bezig met testen...',
            testConnectionRunning: 'Verbinding met {provider} wordt getest...',
            testConnectionBlocked: '{provider} kan niet worden getest: {issues}',
            testConnectionSuccess: '✅ Succes: {message}',
            testConnectionFailed: '❌ Mislukt: {message}. Controleer de console.',
            testConnectionError: 'Fout tijdens verbindingstest: {message}',
            missingActiveProvider: 'Fout: configuratie voor de actieve provider kon niet worden gevonden.',
            exportDirectoryError: 'Fout bij maken van pluginmap: {message}',
            exportSuccess: 'Providerinstellingen succesvol geëxporteerd naar {path}',
            exportError: 'Fout bij exporteren van instellingen: {message}',
            importFileMissing: "Importbestand niet gevonden op {path}. Plaats daar je bestand 'notemd-providers.json'.",
            importInvalidArray: 'Het geïmporteerde bestand bevat geen geldige provider-array.',
            activeProviderReset: 'Actieve provider is teruggezet naar de standaard omdat de vorige provider na importeren niet werd gevonden.',
            importSuccess: '{newCount} nieuwe instellingen succesvol geïmporteerd en {updatedCount} bestaande providerinstellingen bijgewerkt.',
            importError: 'Fout bij importeren van instellingen: {message}',
            validationRequired: 'Configuratie vereist',
            validationWarning: 'Configuratiewaarschuwing'
        }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        providerConfig: {
            summaryTitle: 'Presety dostawców rozszerzono do {count} pozycji.',
            summaryDesc:
                'Dostawcy zgodni z OpenAI współdzielą teraz jedną ścieżkę runtime. Wbudowane presety obejmują usługi ukierunkowane na Chiny, takie jak Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan i SiliconFlow, a ogólny preset "OpenAI Compatible" może kierować ruch do LiteLLM, vLLM, Perplexity, Vercel AI Gateway lub własnego proxy.',
            manageName: 'Zarządzaj konfiguracjami dostawców',
            manageDesc: 'Wyeksportuj bieżące ustawienia dostawców do pliku JSON lub zaimportuj ustawienia z pliku.',
            exportButton: 'Eksportuj dostawców',
            exportTooltip: 'Zapisz konfiguracje dostawców',
            importButton: 'Importuj dostawców',
            importTooltip: 'Wczytaj konfiguracje dostawców (scala)',
            activeProviderName: 'Aktywny dostawca',
            activeProviderDesc: 'Wybierz dostawcę LLM używanego do przetwarzania.',
            providerDetailsHeading: 'Szczegóły {provider}',
            apiKeyName: 'Klucz API',
            apiKeyDescRequired: 'Klucz API dla {provider}.{extra}',
            apiKeyDescOptional: 'Klucz API dla {provider}. Opcjonalny dla endpointów, które pozwalają na dostęp anonimowy lub placeholder.',
            apiKeyExtraLmStudio: " (Opcjonalne, często 'EMPTY')",
            apiKeyPlaceholderDefault: 'Wprowadź swój klucz API',
            apiKeyPlaceholderLmStudio: 'Zwykle EMPTY albo zostaw puste',
            baseUrlName: 'Bazowy URL / endpoint',
            baseUrlDesc: 'Endpoint API dla {provider}.{required}',
            baseUrlRequired: ' Wymagane.',
            baseUrlPlaceholder: 'Wprowadź bazowy URL API',
            modelName: 'Model',
            modelDesc: 'Nazwa modelu używanego z {provider}.',
            modelPlaceholder: 'Wprowadź nazwę modelu',
            temperatureName: 'Temperatura',
            temperatureDesc: 'Steruje losowością (0=deterministyczny, 1=kreatywny).',
            apiVersionName: 'Wersja API',
            apiVersionDesc: 'Wymagana wersja API dla Azure OpenAI (np. 2024-02-15-preview)',
            apiVersionPlaceholder: 'Wprowadź wersję API',
            testConnectionName: 'Testuj połączenie z {provider}',
            testConnectionDesc: 'Zweryfikuj klucz API, endpoint i dostępność modelu.',
            testConnectionButton: 'Testuj połączenie',
            testConnectionTesting: 'Testowanie...',
            testConnectionRunning: 'Testowanie połączenia z {provider}...',
            testConnectionBlocked: 'Nie można przetestować {provider}: {issues}',
            testConnectionSuccess: '✅ Sukces: {message}',
            testConnectionFailed: '❌ Niepowodzenie: {message}. Sprawdź konsolę.',
            testConnectionError: 'Błąd podczas testu połączenia: {message}',
            missingActiveProvider: 'Błąd: nie znaleziono konfiguracji aktywnego dostawcy.',
            exportDirectoryError: 'Błąd tworzenia katalogu wtyczki: {message}',
            exportSuccess: 'Ustawienia dostawców zostały pomyślnie wyeksportowane do {path}',
            exportError: 'Błąd eksportowania ustawień: {message}',
            importFileMissing: "Nie znaleziono pliku importu w {path}. Umieść tam plik 'notemd-providers.json'.",
            importInvalidArray: 'Zaimportowany plik nie zawiera prawidłowej tablicy dostawców.',
            activeProviderReset: 'Aktywny dostawca został zresetowany do domyślnego, ponieważ poprzedni nie został znaleziony po imporcie.',
            importSuccess: 'Pomyślnie zaimportowano {newCount} nowych ustawień i zaktualizowano {updatedCount} istniejących ustawień dostawców.',
            importError: 'Błąd importowania ustawień: {message}',
            validationRequired: 'Wymagana konfiguracja',
            validationWarning: 'Ostrzeżenie konfiguracji'
        }
    }
});

extendLocale(STRINGS_PT, {
    settings: {
        providerConfig: {
            summaryTitle: 'Os predefinidos de fornecedor foram expandidos para {count} entradas.',
            summaryDesc:
                'Os fornecedores compatíveis com OpenAI partilham agora um único caminho de runtime. Os predefinidos integrados cobrem serviços focados na China como Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan e SiliconFlow, e o predefinido genérico "OpenAI Compatible" pode apontar para LiteLLM, vLLM, Perplexity, Vercel AI Gateway ou o seu próprio proxy.',
            manageName: 'Gerir configurações de fornecedores',
            manageDesc: 'Exporte as configurações atuais dos fornecedores para um ficheiro JSON ou importe definições a partir de um ficheiro.',
            exportButton: 'Exportar fornecedores',
            exportTooltip: 'Guardar configurações de fornecedores',
            importButton: 'Importar fornecedores',
            importTooltip: 'Carregar configurações de fornecedores (funde)',
            activeProviderName: 'Fornecedor ativo',
            activeProviderDesc: 'Selecione o fornecedor LLM a usar no processamento.',
            providerDetailsHeading: 'Detalhes de {provider}',
            apiKeyName: 'Chave API',
            apiKeyDescRequired: 'Chave API de {provider}.{extra}',
            apiKeyDescOptional: 'Chave API de {provider}. Opcional para endpoints que permitem acesso anónimo ou por placeholder.',
            apiKeyExtraLmStudio: " (Opcional, frequentemente 'EMPTY')",
            apiKeyPlaceholderDefault: 'Introduza a sua chave API',
            apiKeyPlaceholderLmStudio: 'Normalmente EMPTY ou deixe em branco',
            baseUrlName: 'URL base / endpoint',
            baseUrlDesc: 'O endpoint de API de {provider}.{required}',
            baseUrlRequired: ' Obrigatório.',
            baseUrlPlaceholder: 'Introduza a URL base da API',
            modelName: 'Modelo',
            modelDesc: 'Nome do modelo a usar com {provider}.',
            modelPlaceholder: 'Introduza o nome do modelo',
            temperatureName: 'Temperatura',
            temperatureDesc: 'Controla a aleatoriedade (0=determinístico, 1=criativo).',
            apiVersionName: 'Versão da API',
            apiVersionDesc: 'Versão de API necessária para Azure OpenAI (por ex., 2024-02-15-preview)',
            apiVersionPlaceholder: 'Introduza a versão da API',
            testConnectionName: 'Testar ligação a {provider}',
            testConnectionDesc: 'Verifique a chave API, o endpoint e a acessibilidade do modelo.',
            testConnectionButton: 'Testar ligação',
            testConnectionTesting: 'A testar...',
            testConnectionRunning: 'A testar ligação a {provider}...',
            testConnectionBlocked: 'Não é possível testar {provider}: {issues}',
            testConnectionSuccess: '✅ Sucesso: {message}',
            testConnectionFailed: '❌ Falhou: {message}. Verifique a consola.',
            testConnectionError: 'Erro durante o teste de ligação: {message}',
            missingActiveProvider: 'Erro: não foi possível encontrar a configuração do fornecedor ativo.',
            exportDirectoryError: 'Erro ao criar diretório do plugin: {message}',
            exportSuccess: 'Configurações dos fornecedores exportadas com sucesso para {path}',
            exportError: 'Erro ao exportar definições: {message}',
            importFileMissing: "Ficheiro de importação não encontrado em {path}. Coloque aí o seu ficheiro 'notemd-providers.json'.",
            importInvalidArray: 'O ficheiro importado não contém um array de fornecedores válido.',
            activeProviderReset: 'O fornecedor ativo foi reposto para o valor predefinido, porque o anterior não foi encontrado após a importação.',
            importSuccess: 'Foram importadas com sucesso {newCount} definições novas e atualizadas {updatedCount} definições de fornecedores existentes.',
            importError: 'Erro ao importar definições: {message}',
            validationRequired: 'Configuração obrigatória',
            validationWarning: 'Aviso de configuração'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    settings: {
        providerConfig: {
            summaryTitle: 'Os presets de provedores foram expandidos para {count} entradas.',
            summaryDesc:
                'Os provedores compatíveis com OpenAI agora compartilham um único caminho de runtime. Os presets integrados cobrem serviços focados na China, como Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan e SiliconFlow, e o preset genérico "OpenAI Compatible" pode apontar para LiteLLM, vLLM, Perplexity, Vercel AI Gateway ou seu próprio proxy.',
            manageName: 'Gerenciar configurações de provedores',
            manageDesc: 'Exporte as configurações atuais dos provedores para um arquivo JSON ou importe configurações de um arquivo.',
            exportButton: 'Exportar provedores',
            exportTooltip: 'Salvar configurações de provedores',
            importButton: 'Importar provedores',
            importTooltip: 'Carregar configurações de provedores (mescla)',
            activeProviderName: 'Provedor ativo',
            activeProviderDesc: 'Selecione o provedor LLM a ser usado no processamento.',
            providerDetailsHeading: 'Detalhes de {provider}',
            apiKeyName: 'Chave da API',
            apiKeyDescRequired: 'Chave da API para {provider}.{extra}',
            apiKeyDescOptional: 'Chave da API para {provider}. Opcional para endpoints que permitem acesso anônimo ou placeholder.',
            apiKeyExtraLmStudio: " (Opcional, geralmente 'EMPTY')",
            apiKeyPlaceholderDefault: 'Digite sua chave da API',
            apiKeyPlaceholderLmStudio: 'Geralmente EMPTY ou deixe em branco',
            baseUrlName: 'URL base / endpoint',
            baseUrlDesc: 'O endpoint da API para {provider}.{required}',
            baseUrlRequired: ' Obrigatório.',
            baseUrlPlaceholder: 'Digite a URL base da API',
            modelName: 'Modelo',
            modelDesc: 'Nome do modelo a usar com {provider}.',
            modelPlaceholder: 'Digite o nome do modelo',
            temperatureName: 'Temperatura',
            temperatureDesc: 'Controla a aleatoriedade (0=determinístico, 1=criativo).',
            apiVersionName: 'Versão da API',
            apiVersionDesc: 'Versão da API exigida para Azure OpenAI (por exemplo, 2024-02-15-preview)',
            apiVersionPlaceholder: 'Digite a versão da API',
            testConnectionName: 'Testar conexão com {provider}',
            testConnectionDesc: 'Verifique a chave da API, o endpoint e a acessibilidade do modelo.',
            testConnectionButton: 'Testar conexão',
            testConnectionTesting: 'Testando...',
            testConnectionRunning: 'Testando conexão com {provider}...',
            testConnectionBlocked: 'Não é possível testar {provider}: {issues}',
            testConnectionSuccess: '✅ Sucesso: {message}',
            testConnectionFailed: '❌ Falha: {message}. Verifique o console.',
            testConnectionError: 'Erro durante o teste de conexão: {message}',
            missingActiveProvider: 'Erro: não foi possível encontrar a configuração do provedor ativo.',
            exportDirectoryError: 'Erro ao criar o diretório do plugin: {message}',
            exportSuccess: 'As configurações dos provedores foram exportadas com sucesso para {path}',
            exportError: 'Erro ao exportar configurações: {message}',
            importFileMissing: "Arquivo de importação não encontrado em {path}. Coloque seu arquivo 'notemd-providers.json' nesse local.",
            importInvalidArray: 'O arquivo importado não contém uma lista válida de provedores.',
            activeProviderReset: 'O provedor ativo foi redefinido para o padrão porque o anterior não foi encontrado após a importação.',
            importSuccess: 'Foram importadas com sucesso {newCount} novas configurações e atualizadas {updatedCount} configurações existentes de provedores.',
            importError: 'Erro ao importar configurações: {message}',
            validationRequired: 'Configuração obrigatória',
            validationWarning: 'Aviso de configuração'
        }
    }
});

extendLocale(STRINGS_RU, {
    settings: {
        providerConfig: {
            summaryTitle: 'Наборы пресетов провайдеров расширены до {count} записей.',
            summaryDesc:
                'Провайдеры с совместимостью OpenAI теперь используют единый runtime-путь. Встроенные пресеты охватывают ориентированные на Китай сервисы, такие как Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan и SiliconFlow, а общий пресет "OpenAI Compatible" может работать с LiteLLM, vLLM, Perplexity, Vercel AI Gateway или вашим собственным прокси.',
            manageName: 'Управление конфигурациями провайдеров',
            manageDesc: 'Экспортируйте текущие настройки провайдеров в JSON-файл или импортируйте настройки из файла.',
            exportButton: 'Экспортировать провайдеров',
            exportTooltip: 'Сохранить конфигурации провайдеров',
            importButton: 'Импортировать провайдеров',
            importTooltip: 'Загрузить конфигурации провайдеров (с объединением)',
            activeProviderName: 'Активный провайдер',
            activeProviderDesc: 'Выберите провайдера LLM для обработки.',
            providerDetailsHeading: 'Данные {provider}',
            apiKeyName: 'API-ключ',
            apiKeyDescRequired: 'API-ключ для {provider}.{extra}',
            apiKeyDescOptional: 'API-ключ для {provider}. Необязателен для endpointов, допускающих placeholder- или анонимный доступ.',
            apiKeyExtraLmStudio: " (Необязательно, часто 'EMPTY')",
            apiKeyPlaceholderDefault: 'Введите API-ключ',
            apiKeyPlaceholderLmStudio: 'Обычно EMPTY или оставить пустым',
            baseUrlName: 'Базовый URL / endpoint',
            baseUrlDesc: 'API-endpoint для {provider}.{required}',
            baseUrlRequired: ' Обязательно.',
            baseUrlPlaceholder: 'Введите базовый URL API',
            modelName: 'Модель',
            modelDesc: 'Имя модели для использования с {provider}.',
            modelPlaceholder: 'Введите имя модели',
            temperatureName: 'Температура',
            temperatureDesc: 'Управляет случайностью (0=детерминированно, 1=креативно).',
            apiVersionName: 'Версия API',
            apiVersionDesc: 'Требуемая версия API для Azure OpenAI (например, 2024-02-15-preview)',
            apiVersionPlaceholder: 'Введите версию API',
            testConnectionName: 'Проверить подключение к {provider}',
            testConnectionDesc: 'Проверьте API-ключ, endpoint и доступность модели.',
            testConnectionButton: 'Проверить подключение',
            testConnectionTesting: 'Проверка...',
            testConnectionRunning: 'Проверяется подключение к {provider}...',
            testConnectionBlocked: 'Невозможно проверить {provider}: {issues}',
            testConnectionSuccess: '✅ Успех: {message}',
            testConnectionFailed: '❌ Ошибка: {message}. Проверьте консоль.',
            testConnectionError: 'Ошибка во время проверки подключения: {message}',
            missingActiveProvider: 'Ошибка: не удалось найти конфигурацию активного провайдера.',
            exportDirectoryError: 'Ошибка при создании директории плагина: {message}',
            exportSuccess: 'Настройки провайдеров успешно экспортированы в {path}',
            exportError: 'Ошибка при экспорте настроек: {message}',
            importFileMissing: "Файл импорта не найден по пути {path}. Поместите туда файл 'notemd-providers.json'.",
            importInvalidArray: 'Импортированный файл не содержит корректного массива провайдеров.',
            activeProviderReset: 'Активный провайдер сброшен на значение по умолчанию, так как предыдущий не найден после импорта.',
            importSuccess: 'Успешно импортировано {newCount} новых и обновлено {updatedCount} существующих настроек провайдеров.',
            importError: 'Ошибка при импорте настроек: {message}',
            validationRequired: 'Требуется конфигурация',
            validationWarning: 'Предупреждение конфигурации'
        }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        providerConfig: {
            summaryTitle: 'ขยายพรีเซ็ตผู้ให้บริการเป็น {count} รายการแล้ว',
            summaryDesc:
                'ผู้ให้บริการที่เข้ากันได้กับ OpenAI ใช้เส้นทาง runtime ร่วมกันแล้วในตอนนี้ พรีเซ็ตในตัวครอบคลุมบริการที่เน้นจีนอย่าง Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan และ SiliconFlow และพรีเซ็ตทั่วไป "OpenAI Compatible" สามารถชี้ไปที่ LiteLLM, vLLM, Perplexity, Vercel AI Gateway หรือพร็อกซีของคุณเองได้',
            manageName: 'จัดการการกำหนดค่าผู้ให้บริการ',
            manageDesc: 'ส่งออกการตั้งค่าผู้ให้บริการปัจจุบันของคุณเป็นไฟล์ JSON หรือจะนำเข้าการตั้งค่าจากไฟล์ก็ได้',
            exportButton: 'ส่งออกผู้ให้บริการ',
            exportTooltip: 'บันทึกการกำหนดค่าผู้ให้บริการ',
            importButton: 'นำเข้าผู้ให้บริการ',
            importTooltip: 'โหลดการกำหนดค่าผู้ให้บริการ (ผสานรวม)',
            activeProviderName: 'ผู้ให้บริการที่ใช้งานอยู่',
            activeProviderDesc: 'เลือกผู้ให้บริการ LLM ที่จะใช้ในการประมวลผล',
            providerDetailsHeading: 'รายละเอียดของ {provider}',
            apiKeyName: 'คีย์ API',
            apiKeyDescRequired: 'คีย์ API สำหรับ {provider}.{extra}',
            apiKeyDescOptional: 'คีย์ API สำหรับ {provider} เป็นตัวเลือกสำหรับ endpoint ที่อนุญาตการเข้าถึงแบบไม่ระบุตัวตนหรือใช้ค่า placeholder ได้',
            apiKeyExtraLmStudio: " (ไม่บังคับ มักเป็น 'EMPTY')",
            apiKeyPlaceholderDefault: 'ป้อนคีย์ API ของคุณ',
            apiKeyPlaceholderLmStudio: 'โดยปกติเป็น EMPTY หรือปล่อยว่างไว้',
            baseUrlName: 'Base URL / endpoint',
            baseUrlDesc: 'API endpoint สำหรับ {provider}.{required}',
            baseUrlRequired: ' จำเป็น',
            baseUrlPlaceholder: 'ป้อน API Base URL',
            modelName: 'โมเดล',
            modelDesc: 'ชื่อโมเดลที่จะใช้กับ {provider}',
            modelPlaceholder: 'ป้อนชื่อโมเดล',
            temperatureName: 'Temperature',
            temperatureDesc: 'ควบคุมความสุ่ม (0=กำหนดแน่นอน, 1=สร้างสรรค์)',
            apiVersionName: 'เวอร์ชัน API',
            apiVersionDesc: 'เวอร์ชัน API ที่จำเป็นสำหรับ Azure OpenAI (เช่น 2024-02-15-preview)',
            apiVersionPlaceholder: 'ป้อนเวอร์ชัน API',
            testConnectionName: 'ทดสอบการเชื่อมต่อ {provider}',
            testConnectionDesc: 'ตรวจสอบคีย์ API, endpoint และการเข้าถึงโมเดล',
            testConnectionButton: 'ทดสอบการเชื่อมต่อ',
            testConnectionTesting: 'กำลังทดสอบ...',
            testConnectionRunning: 'กำลังทดสอบการเชื่อมต่อกับ {provider}...',
            testConnectionBlocked: 'ไม่สามารถทดสอบ {provider} ได้: {issues}',
            testConnectionSuccess: '✅ สำเร็จ: {message}',
            testConnectionFailed: '❌ ล้มเหลว: {message} ตรวจสอบคอนโซล',
            testConnectionError: 'เกิดข้อผิดพลาดระหว่างการทดสอบการเชื่อมต่อ: {message}',
            missingActiveProvider: 'ข้อผิดพลาด: ไม่พบการกำหนดค่าสำหรับผู้ให้บริการที่ใช้งานอยู่',
            exportDirectoryError: 'ข้อผิดพลาดในการสร้างไดเรกทอรีปลั๊กอิน: {message}',
            exportSuccess: 'ส่งออกการตั้งค่าผู้ให้บริการไปยัง {path} สำเร็จแล้ว',
            exportError: 'ข้อผิดพลาดในการส่งออกการตั้งค่า: {message}',
            importFileMissing: "ไม่พบไฟล์นำเข้าที่ {path} กรุณาวางไฟล์ 'notemd-providers.json' ไว้ที่นั่น",
            importInvalidArray: 'ไฟล์ที่นำเข้าไม่มีอาร์เรย์ของผู้ให้บริการที่ถูกต้อง',
            activeProviderReset: 'รีเซ็ตผู้ให้บริการที่ใช้งานอยู่กลับเป็นค่าเริ่มต้นแล้ว เพราะไม่พบผู้ให้บริการเดิมหลังการนำเข้า',
            importSuccess: 'นำเข้าการตั้งค่าใหม่ {newCount} รายการสำเร็จ และอัปเดตการตั้งค่าผู้ให้บริการเดิม {updatedCount} รายการ',
            importError: 'ข้อผิดพลาดในการนำเข้าการตั้งค่า: {message}',
            validationRequired: 'จำเป็นต้องกำหนดค่า',
            validationWarning: 'คำเตือนการกำหนดค่า'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        providerConfig: {
            summaryTitle: 'Sağlayıcı önayarları {count} girdiye çıkarıldı.',
            summaryDesc:
                'OpenAI uyumlu sağlayıcılar artık tek bir çalışma zamanı yolunu paylaşıyor. Yerleşik önayarlar Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan ve SiliconFlow gibi Çin odaklı hizmetleri kapsıyor; genel "OpenAI Compatible" önayarı ise LiteLLM, vLLM, Perplexity, Vercel AI Gateway veya kendi proxy’nizi hedefleyebiliyor.',
            manageName: 'Sağlayıcı yapılandırmalarını yönet',
            manageDesc: 'Mevcut sağlayıcı ayarlarınızı bir JSON dosyasına aktarın veya ayarları bir dosyadan içe aktarın.',
            exportButton: 'Sağlayıcıları dışa aktar',
            exportTooltip: 'Sağlayıcı yapılandırmalarını kaydet',
            importButton: 'Sağlayıcıları içe aktar',
            importTooltip: 'Sağlayıcı yapılandırmalarını yükle (birleştirir)',
            activeProviderName: 'Etkin sağlayıcı',
            activeProviderDesc: 'İşleme için kullanılacak LLM sağlayıcısını seçin.',
            providerDetailsHeading: '{provider} ayrıntıları',
            apiKeyName: 'API anahtarı',
            apiKeyDescRequired: '{provider} için API anahtarı.{extra}',
            apiKeyDescOptional: '{provider} için API anahtarı. Yer tutucu veya anonim erişime izin veren endpointler için isteğe bağlıdır.',
            apiKeyExtraLmStudio: " (İsteğe bağlı, çoğu zaman 'EMPTY')",
            apiKeyPlaceholderDefault: 'API anahtarınızı girin',
            apiKeyPlaceholderLmStudio: 'Genellikle EMPTY veya boş bırakın',
            baseUrlName: 'Temel URL / endpoint',
            baseUrlDesc: '{provider} için API endpoint’i.{required}',
            baseUrlRequired: ' Zorunlu.',
            baseUrlPlaceholder: 'API temel URL’sini girin',
            modelName: 'Model',
            modelDesc: '{provider} ile kullanılacak model adı.',
            modelPlaceholder: 'Model adını girin',
            temperatureName: 'Sıcaklık',
            temperatureDesc: 'Rastgeleliği kontrol eder (0=deterministik, 1=yaratıcı).',
            apiVersionName: 'API sürümü',
            apiVersionDesc: 'Azure OpenAI için gerekli API sürümü (örn. 2024-02-15-preview)',
            apiVersionPlaceholder: 'API sürümünü girin',
            testConnectionName: '{provider} bağlantısını test et',
            testConnectionDesc: 'API anahtarını, endpoint’i ve model erişilebilirliğini doğrulayın.',
            testConnectionButton: 'Bağlantıyı test et',
            testConnectionTesting: 'Test ediliyor...',
            testConnectionRunning: '{provider} bağlantısı test ediliyor...',
            testConnectionBlocked: '{provider} test edilemiyor: {issues}',
            testConnectionSuccess: '✅ Başarılı: {message}',
            testConnectionFailed: '❌ Başarısız: {message}. Konsolu kontrol edin.',
            testConnectionError: 'Bağlantı testi sırasında hata: {message}',
            missingActiveProvider: 'Hata: etkin sağlayıcı için yapılandırma bulunamadı.',
            exportDirectoryError: 'Eklenti dizini oluşturulurken hata: {message}',
            exportSuccess: 'Sağlayıcı ayarları başarıyla {path} konumuna aktarıldı',
            exportError: 'Ayarlar dışa aktarılırken hata: {message}',
            importFileMissing: "İçe aktarılacak dosya {path} konumunda bulunamadı. Lütfen 'notemd-providers.json' dosyanızı oraya yerleştirin.",
            importInvalidArray: 'İçe aktarılan dosya geçerli bir sağlayıcı dizisi içermiyor.',
            activeProviderReset: 'İçe aktarma sonrasında önceki sağlayıcı bulunamadığı için etkin sağlayıcı varsayılana sıfırlandı.',
            importSuccess: '{newCount} yeni ayar başarıyla içe aktarıldı ve mevcut sağlayıcı ayarlarından {updatedCount} tanesi güncellendi.',
            importError: 'Ayarlar içe aktarılırken hata: {message}',
            validationRequired: 'Yapılandırma gerekli',
            validationWarning: 'Yapılandırma uyarısı'
        }
    }
});

extendLocale(STRINGS_UK, {
    settings: {
        providerConfig: {
            summaryTitle: 'Пресети провайдерів розширено до {count} записів.',
            summaryDesc:
                'Провайдери з OpenAI-сумісністю тепер використовують спільний runtime-шлях. Вбудовані пресети охоплюють орієнтовані на Китай сервіси, як-от Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan і SiliconFlow, а загальний пресет "OpenAI Compatible" може працювати з LiteLLM, vLLM, Perplexity, Vercel AI Gateway або вашим власним проксі.',
            manageName: 'Керування конфігураціями провайдерів',
            manageDesc: 'Експортуйте поточні налаштування провайдерів у JSON-файл або імпортуйте налаштування з файлу.',
            exportButton: 'Експортувати провайдерів',
            exportTooltip: 'Зберегти конфігурації провайдерів',
            importButton: 'Імпортувати провайдерів',
            importTooltip: 'Завантажити конфігурації провайдерів (з об’єднанням)',
            activeProviderName: 'Активний провайдер',
            activeProviderDesc: 'Виберіть провайдера LLM для обробки.',
            providerDetailsHeading: 'Деталі {provider}',
            apiKeyName: 'API-ключ',
            apiKeyDescRequired: 'API-ключ для {provider}.{extra}',
            apiKeyDescOptional: 'API-ключ для {provider}. Необов’язковий для endpointів, що дозволяють анонімний доступ або placeholder.',
            apiKeyExtraLmStudio: " (Необов’язково, часто 'EMPTY')",
            apiKeyPlaceholderDefault: 'Введіть свій API-ключ',
            apiKeyPlaceholderLmStudio: 'Зазвичай EMPTY або залиште порожнім',
            baseUrlName: 'Базовий URL / endpoint',
            baseUrlDesc: 'API-endpoint для {provider}.{required}',
            baseUrlRequired: ' Обов’язково.',
            baseUrlPlaceholder: 'Введіть базовий URL API',
            modelName: 'Модель',
            modelDesc: 'Назва моделі для використання з {provider}.',
            modelPlaceholder: 'Введіть назву моделі',
            temperatureName: 'Температура',
            temperatureDesc: 'Керує випадковістю (0=детерміновано, 1=креативно).',
            apiVersionName: 'Версія API',
            apiVersionDesc: 'Потрібна версія API для Azure OpenAI (наприклад, 2024-02-15-preview)',
            apiVersionPlaceholder: 'Введіть версію API',
            testConnectionName: 'Перевірити підключення до {provider}',
            testConnectionDesc: 'Перевірте API-ключ, endpoint і доступність моделі.',
            testConnectionButton: 'Перевірити підключення',
            testConnectionTesting: 'Тестування...',
            testConnectionRunning: 'Тестується підключення до {provider}...',
            testConnectionBlocked: 'Неможливо протестувати {provider}: {issues}',
            testConnectionSuccess: '✅ Успіх: {message}',
            testConnectionFailed: '❌ Помилка: {message}. Перевірте консоль.',
            testConnectionError: 'Помилка під час перевірки підключення: {message}',
            missingActiveProvider: 'Помилка: не вдалося знайти конфігурацію активного провайдера.',
            exportDirectoryError: 'Помилка створення каталогу плагіна: {message}',
            exportSuccess: 'Налаштування провайдерів успішно експортовано до {path}',
            exportError: 'Помилка експорту налаштувань: {message}',
            importFileMissing: "Файл імпорту не знайдено за адресою {path}. Помістіть туди файл 'notemd-providers.json'.",
            importInvalidArray: 'Імпортований файл не містить коректного масиву провайдерів.',
            activeProviderReset: 'Активного провайдера скинуто до стандартного, оскільки попереднього не знайдено після імпорту.',
            importSuccess: 'Успішно імпортовано {newCount} нових і оновлено {updatedCount} наявних налаштувань провайдерів.',
            importError: 'Помилка імпорту налаштувань: {message}',
            validationRequired: 'Потрібна конфігурація',
            validationWarning: 'Попередження конфігурації'
        }
    }
});

extendLocale(STRINGS_VI, {
    settings: {
        providerConfig: {
            summaryTitle: 'Preset nhà cung cấp đã được mở rộng lên {count} mục.',
            summaryDesc:
                'Các nhà cung cấp tương thích OpenAI hiện dùng chung một đường chạy runtime. Các preset tích hợp sẵn bao phủ những dịch vụ tập trung vào Trung Quốc như Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan và SiliconFlow, còn preset chung "OpenAI Compatible" có thể trỏ tới LiteLLM, vLLM, Perplexity, Vercel AI Gateway hoặc proxy riêng của bạn.',
            manageName: 'Quản lý cấu hình nhà cung cấp',
            manageDesc: 'Xuất các thiết lập nhà cung cấp hiện tại của bạn ra tệp JSON hoặc nhập thiết lập từ một tệp.',
            exportButton: 'Xuất nhà cung cấp',
            exportTooltip: 'Lưu cấu hình nhà cung cấp',
            importButton: 'Nhập nhà cung cấp',
            importTooltip: 'Tải cấu hình nhà cung cấp (gộp)',
            activeProviderName: 'Nhà cung cấp đang hoạt động',
            activeProviderDesc: 'Chọn nhà cung cấp LLM dùng cho xử lý.',
            providerDetailsHeading: 'Chi tiết {provider}',
            apiKeyName: 'Khóa API',
            apiKeyDescRequired: 'Khóa API cho {provider}.{extra}',
            apiKeyDescOptional: 'Khóa API cho {provider}. Tùy chọn đối với các endpoint cho phép truy cập ẩn danh hoặc placeholder.',
            apiKeyExtraLmStudio: " (Tùy chọn, thường là 'EMPTY')",
            apiKeyPlaceholderDefault: 'Nhập khóa API của bạn',
            apiKeyPlaceholderLmStudio: 'Thường là EMPTY hoặc để trống',
            baseUrlName: 'URL gốc / endpoint',
            baseUrlDesc: 'API endpoint cho {provider}.{required}',
            baseUrlRequired: ' Bắt buộc.',
            baseUrlPlaceholder: 'Nhập URL gốc của API',
            modelName: 'Mô hình',
            modelDesc: 'Tên mô hình sẽ dùng với {provider}.',
            modelPlaceholder: 'Nhập tên mô hình',
            temperatureName: 'Nhiệt độ',
            temperatureDesc: 'Điều khiển mức ngẫu nhiên (0=quyết định, 1=sáng tạo).',
            apiVersionName: 'Phiên bản API',
            apiVersionDesc: 'Phiên bản API bắt buộc cho Azure OpenAI (ví dụ: 2024-02-15-preview)',
            apiVersionPlaceholder: 'Nhập phiên bản API',
            testConnectionName: 'Kiểm tra kết nối {provider}',
            testConnectionDesc: 'Xác minh khóa API, endpoint và khả năng truy cập mô hình.',
            testConnectionButton: 'Kiểm tra kết nối',
            testConnectionTesting: 'Đang kiểm tra...',
            testConnectionRunning: 'Đang kiểm tra kết nối tới {provider}...',
            testConnectionBlocked: 'Không thể kiểm tra {provider}: {issues}',
            testConnectionSuccess: '✅ Thành công: {message}',
            testConnectionFailed: '❌ Thất bại: {message}. Xem bảng điều khiển.',
            testConnectionError: 'Lỗi trong khi kiểm tra kết nối: {message}',
            missingActiveProvider: 'Lỗi: Không thể tìm thấy cấu hình cho nhà cung cấp đang hoạt động.',
            exportDirectoryError: 'Lỗi khi tạo thư mục plugin: {message}',
            exportSuccess: 'Đã xuất thành công thiết lập nhà cung cấp tới {path}',
            exportError: 'Lỗi khi xuất thiết lập: {message}',
            importFileMissing: "Không tìm thấy tệp nhập tại {path}. Vui lòng đặt tệp 'notemd-providers.json' của bạn ở đó.",
            importInvalidArray: 'Tệp đã nhập không chứa mảng nhà cung cấp hợp lệ.',
            activeProviderReset: 'Nhà cung cấp đang hoạt động đã được đặt lại về mặc định vì không tìm thấy nhà cung cấp trước đó sau khi nhập.',
            importSuccess: 'Đã nhập thành công {newCount} thiết lập mới và cập nhật {updatedCount} thiết lập nhà cung cấp hiện có.',
            importError: 'Lỗi khi nhập thiết lập: {message}',
            validationRequired: 'Yêu cầu cấu hình',
            validationWarning: 'Cảnh báo cấu hình'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        providerConfig: { modelName: 'Model AI' }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        providerConfig: { temperatureName: '温度' }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        providerConfig: { temperatureName: '온도' }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        providerConfig: { modelName: 'Modelnaam' }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        providerConfig: { modelName: 'Nazwa modelu' }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        providerConfig: {
            baseUrlName: 'URL พื้นฐาน / endpoint',
            temperatureName: 'อุณหภูมิ'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        providerConfig: { modelName: 'Model adı' }
    }
});

extendLocale(STRINGS_NL, {
    common: { select: 'Selecteren' },
    commands: {
        checkDuplicatesCurrent: 'Duplicaten in huidig bestand controleren',
        extractConceptsAndGenerateTitles: 'Concepten extraheren en titels genereren',
        createWikiLinkAndGenerateNoteFromSelection: 'Wiki-link maken en notitie uit selectie genereren'
    },
    duplicateModal: {
        title: 'Verwijderen van duplicaten bevestigen',
        intro: 'De volgende {count} conceptnotities zijn als mogelijke duplicaten gemarkeerd en worden naar de systeemprullenbak verplaatst:',
        reason: 'Reden: {reason}',
        conflictsWith: 'Conflict met: {files}',
        warning: 'Deze actie kan niet eenvoudig binnen Obsidian ongedaan worden gemaakt, maar bestanden kunnen meestal uit de systeemprullenbak worden hersteld.',
        deleteFiles: '{count} bestanden verwijderen'
    },
    settings: {
        developer: { heading: 'Ontwikkelaarsdiagnostiek' },
        providerConfig: { heading: 'LLM-providers' },
        multiModel: { heading: 'Gebruik van meerdere modellen' },
        translationTask: { heading: 'Taak: Vertalen' },
        mermaidTask: { heading: 'Taak: Samenvatten als Mermaid-diagram' },
        extractConceptsTask: { heading: 'Taak: Concepten extraheren' },
        stableApi: { heading: 'Stabiele API-aanroepen' },
        workflowBuilder: { heading: 'Workflowknoppen met één klik' },
        generalOutput: {
            processedHeading: 'Uitvoer van verwerkte bestanden',
            conceptNoteHeading: 'Uitvoer van conceptnotities',
            conceptLogHeading: 'Uitvoer van conceptlogbestand'
        },
        contentGeneration: { heading: 'Inhoudsgeneratie en uitvoer' },
        customPrompts: { heading: 'Instellingen voor aangepaste prompts' },
        extractOriginalText: { heading: 'Specifieke originele tekst extraheren' },
        webResearch: { heading: 'Provider voor webonderzoek' },
        processing: { heading: 'Verwerkingsparameters' },
        batchProcessing: { heading: 'Batchverwerking' },
        batchMermaidFix: { heading: 'Batch Mermaid-herstel' },
        duplicateScope: { heading: 'Bereik van duplicaatcontrole' },
        focusedLearning: { heading: 'Gericht leerdomein' }
    }
});

extendLocale(STRINGS_PL, {
    common: { select: 'Wybierz' },
    commands: {
        checkDuplicatesCurrent: 'Sprawdź duplikaty w bieżącym pliku',
        extractConceptsAndGenerateTitles: 'Wyodrębnij pojęcia i wygeneruj tytuły',
        createWikiLinkAndGenerateNoteFromSelection: 'Utwórz link wiki i wygeneruj notatkę z zaznaczenia'
    },
    duplicateModal: {
        title: 'Potwierdź usunięcie duplikatów',
        intro: 'Następujące {count} notatek pojęć zidentyfikowano jako potencjalne duplikaty i zostaną przeniesione do kosza systemowego:',
        reason: 'Powód: {reason}',
        conflictsWith: 'Koliduje z: {files}',
        warning: 'Tej operacji nie można łatwo cofnąć w Obsidianie, ale pliki zwykle można odzyskać z kosza systemowego.',
        deleteFiles: 'Usuń {count} plików'
    },
    settings: {
        developer: { heading: 'Diagnostyka deweloperska' },
        providerConfig: { heading: 'Dostawcy LLM' },
        multiModel: { heading: 'Użycie wielu modeli' },
        translationTask: { heading: 'Zadanie: Tłumacz' },
        mermaidTask: { heading: 'Zadanie: Podsumuj jako diagram Mermaid' },
        extractConceptsTask: { heading: 'Zadanie: Wyodrębnij pojęcia' },
        stableApi: { heading: 'Stabilne wywołania API' },
        workflowBuilder: { heading: 'Przyciski workflow jednym kliknięciem' },
        generalOutput: {
            processedHeading: 'Wyjście przetworzonego pliku',
            conceptNoteHeading: 'Wyjście notatek pojęć',
            conceptLogHeading: 'Wyjście pliku dziennika pojęć'
        },
        contentGeneration: { heading: 'Generowanie treści i wyników' },
        customPrompts: { heading: 'Ustawienia własnych promptów' },
        extractOriginalText: { heading: 'Wyodrębnij wskazany tekst źródłowy' },
        webResearch: { heading: 'Dostawca badań internetowych' },
        processing: { heading: 'Parametry przetwarzania' },
        batchProcessing: { heading: 'Przetwarzanie wsadowe' },
        batchMermaidFix: { heading: 'Wsadowa naprawa Mermaid' },
        duplicateScope: { heading: 'Zakres sprawdzania duplikatów' },
        focusedLearning: { heading: 'Ukierunkowana domena uczenia' }
    }
});

extendLocale(STRINGS_PT, {
    common: { select: 'Selecionar' },
    commands: {
        checkDuplicatesCurrent: 'Verificar duplicados no ficheiro atual',
        extractConceptsAndGenerateTitles: 'Extrair conceitos e gerar títulos',
        createWikiLinkAndGenerateNoteFromSelection: 'Criar wiki-link e gerar nota a partir da seleção'
    },
    duplicateModal: {
        title: 'Confirmar eliminação de duplicados',
        intro: 'As seguintes {count} notas de conceito foram identificadas como possíveis duplicados e serão movidas para o lixo do sistema:',
        reason: 'Motivo: {reason}',
        conflictsWith: 'Em conflito com: {files}',
        warning: 'Esta ação não pode ser facilmente desfeita dentro do Obsidian, mas normalmente os ficheiros podem ser recuperados do lixo do sistema.',
        deleteFiles: 'Eliminar {count} ficheiros'
    },
    settings: {
        developer: { heading: 'Diagnóstico de programador' },
        providerConfig: { heading: 'Fornecedores de LLM' },
        multiModel: { heading: 'Utilização de múltiplos modelos' },
        translationTask: { heading: 'Tarefa: Traduzir' },
        mermaidTask: { heading: 'Tarefa: Resumir como diagrama Mermaid' },
        extractConceptsTask: { heading: 'Tarefa: Extrair conceitos' },
        stableApi: { heading: 'Chamadas estáveis de API' },
        workflowBuilder: { heading: 'Botões de fluxo de trabalho de um clique' },
        generalOutput: {
            processedHeading: 'Saída de ficheiro processado',
            conceptNoteHeading: 'Saída de nota de conceito',
            conceptLogHeading: 'Saída do ficheiro de registo de conceitos'
        },
        contentGeneration: { heading: 'Geração de conteúdo e saída' },
        customPrompts: { heading: 'Definições de prompts personalizados' },
        extractOriginalText: { heading: 'Extrair texto original específico' },
        webResearch: { heading: 'Fornecedor de pesquisa web' },
        processing: { heading: 'Parâmetros de processamento' },
        batchProcessing: { heading: 'Processamento em lote' },
        batchMermaidFix: { heading: 'Correção Mermaid em lote' },
        duplicateScope: { heading: 'Âmbito da verificação de duplicados' },
        focusedLearning: { heading: 'Domínio de aprendizagem focado' }
    }
});

extendLocale(STRINGS_PT_BR, {
    common: { select: 'Selecionar' },
    commands: {
        checkDuplicatesCurrent: 'Verificar duplicatas no arquivo atual',
        extractConceptsAndGenerateTitles: 'Extrair conceitos e gerar títulos',
        createWikiLinkAndGenerateNoteFromSelection: 'Criar wiki-link e gerar nota a partir da seleção'
    },
    duplicateModal: {
        title: 'Confirmar exclusão de duplicatas',
        intro: 'As seguintes {count} notas de conceito foram identificadas como possíveis duplicatas e serão movidas para a lixeira do sistema:',
        reason: 'Motivo: {reason}',
        conflictsWith: 'Conflita com: {files}',
        warning: 'Esta ação não pode ser desfeita facilmente dentro do Obsidian, mas os arquivos normalmente podem ser recuperados da lixeira do sistema.',
        deleteFiles: 'Excluir {count} arquivos'
    },
    settings: {
        developer: { heading: 'Diagnósticos do desenvolvedor' },
        providerConfig: { heading: 'Provedores de LLM' },
        multiModel: { heading: 'Uso de múltiplos modelos' },
        translationTask: { heading: 'Tarefa: Traduzir' },
        mermaidTask: { heading: 'Tarefa: Resumir como diagrama Mermaid' },
        extractConceptsTask: { heading: 'Tarefa: Extrair conceitos' },
        stableApi: { heading: 'Chamadas estáveis de API' },
        workflowBuilder: { heading: 'Botões de fluxo de trabalho de um clique' },
        generalOutput: {
            processedHeading: 'Saída do arquivo processado',
            conceptNoteHeading: 'Saída de notas de conceito',
            conceptLogHeading: 'Saída do arquivo de log de conceitos'
        },
        contentGeneration: { heading: 'Geração de conteúdo e saída' },
        customPrompts: { heading: 'Configurações de prompts personalizados' },
        extractOriginalText: { heading: 'Extrair texto original específico' },
        webResearch: { heading: 'Provedor de pesquisa na web' },
        processing: { heading: 'Parâmetros de processamento' },
        batchProcessing: { heading: 'Processamento em lote' },
        batchMermaidFix: { heading: 'Correção Mermaid em lote' },
        duplicateScope: { heading: 'Escopo de verificação de duplicatas' },
        focusedLearning: { heading: 'Domínio de aprendizado focado' }
    }
});

extendLocale(STRINGS_RU, {
    common: { select: 'Выбрать' },
    commands: {
        checkDuplicatesCurrent: 'Проверить дубликаты в текущем файле',
        extractConceptsAndGenerateTitles: 'Извлечь концепты и сгенерировать заголовки',
        createWikiLinkAndGenerateNoteFromSelection: 'Создать вики-ссылку и сгенерировать заметку из выделения'
    },
    duplicateModal: {
        title: 'Подтвердить удаление дубликатов',
        intro: 'Следующие {count} заметок-концептов определены как возможные дубликаты и будут перемещены в системную корзину:',
        reason: 'Причина: {reason}',
        conflictsWith: 'Конфликтует с: {files}',
        warning: 'Это действие нельзя легко отменить внутри Obsidian, но файлы обычно можно восстановить из системной корзины.',
        deleteFiles: 'Удалить {count} файлов'
    },
    settings: {
        developer: { heading: 'Диагностика для разработчиков' },
        providerConfig: { heading: 'Провайдеры LLM' },
        multiModel: { heading: 'Использование нескольких моделей' },
        translationTask: { heading: 'Задача: Перевод' },
        mermaidTask: { heading: 'Задача: Резюмировать как диаграмму Mermaid' },
        extractConceptsTask: { heading: 'Задача: Извлечь концепты' },
        stableApi: { heading: 'Стабильные вызовы API' },
        workflowBuilder: { heading: 'Кнопки workflow в один клик' },
        generalOutput: {
            processedHeading: 'Вывод обработанного файла',
            conceptNoteHeading: 'Вывод заметок-концептов',
            conceptLogHeading: 'Вывод файла журнала концептов'
        },
        contentGeneration: { heading: 'Генерация контента и вывод' },
        customPrompts: { heading: 'Настройки пользовательских промптов' },
        extractOriginalText: { heading: 'Извлечь определенный исходный текст' },
        webResearch: { heading: 'Провайдер веб-исследований' },
        processing: { heading: 'Параметры обработки' },
        batchProcessing: { heading: 'Пакетная обработка' },
        batchMermaidFix: { heading: 'Пакетное исправление Mermaid' },
        duplicateScope: { heading: 'Область проверки дубликатов' },
        focusedLearning: { heading: 'Фокусная область обучения' }
    }
});

extendLocale(STRINGS_TH, {
    common: { select: 'เลือก' },
    commands: {
        checkDuplicatesCurrent: 'ตรวจหาข้อความซ้ำในไฟล์ปัจจุบัน',
        extractConceptsAndGenerateTitles: 'สกัดแนวคิดและสร้างชื่อเรื่อง',
        createWikiLinkAndGenerateNoteFromSelection: 'สร้างลิงก์วิกิและสร้างโน้ตจากส่วนที่เลือก'
    },
    duplicateModal: {
        title: 'ยืนยันการลบรายการซ้ำ',
        intro: 'โน้ตแนวคิด {count} รายการต่อไปนี้ถูกระบุว่าอาจเป็นรายการซ้ำและจะถูกย้ายไปยังถังขยะของระบบ:',
        reason: 'เหตุผล: {reason}',
        conflictsWith: 'ขัดแย้งกับ: {files}',
        warning: 'การกระทำนี้ไม่สามารถย้อนกลับได้ง่ายจากภายใน Obsidian แต่โดยปกติยังสามารถกู้ไฟล์กลับจากถังขยะของระบบได้',
        deleteFiles: 'ลบ {count} ไฟล์'
    },
    settings: {
        developer: { heading: 'การวินิจฉัยสำหรับนักพัฒนา' },
        providerConfig: { heading: 'ผู้ให้บริการ LLM' },
        multiModel: { heading: 'การใช้งานหลายโมเดล' },
        translationTask: { heading: 'งาน: แปล' },
        mermaidTask: { heading: 'งาน: สรุปเป็นแผนภาพ Mermaid' },
        extractConceptsTask: { heading: 'งาน: สกัดแนวคิด' },
        stableApi: { heading: 'การเรียก API แบบเสถียร' },
        workflowBuilder: { heading: 'ปุ่มเวิร์กโฟลว์แบบคลิกเดียว' },
        generalOutput: {
            processedHeading: 'ผลลัพธ์ไฟล์ที่ประมวลผลแล้ว',
            conceptNoteHeading: 'ผลลัพธ์โน้ตแนวคิด',
            conceptLogHeading: 'ผลลัพธ์ไฟล์บันทึกแนวคิด'
        },
        contentGeneration: { heading: 'การสร้างเนื้อหาและผลลัพธ์' },
        customPrompts: { heading: 'การตั้งค่าพรอมป์แบบกำหนดเอง' },
        extractOriginalText: { heading: 'สกัดข้อความต้นฉบับเฉพาะส่วน' },
        webResearch: { heading: 'ผู้ให้บริการวิจัยบนเว็บ' },
        processing: { heading: 'พารามิเตอร์การประมวลผล' },
        batchProcessing: { heading: 'การประมวลผลแบบกลุ่ม' },
        batchMermaidFix: { heading: 'แก้ไข Mermaid แบบกลุ่ม' },
        duplicateScope: { heading: 'ขอบเขตการตรวจสอบรายการซ้ำ' },
        focusedLearning: { heading: 'โดเมนการเรียนรู้แบบมุ่งเน้น' }
    }
});

extendLocale(STRINGS_TR, {
    common: { select: 'Seç' },
    commands: {
        checkDuplicatesCurrent: 'Geçerli dosyada yinelenenleri kontrol et',
        extractConceptsAndGenerateTitles: 'Kavramları çıkar ve başlıklar üret',
        createWikiLinkAndGenerateNoteFromSelection: 'Wiki bağlantısı oluştur ve seçimden not üret'
    },
    duplicateModal: {
        title: 'Yinelenen silmeyi onayla',
        intro: 'Aşağıdaki {count} kavram notu olası yinelenen olarak belirlendi ve sistem çöp kutusuna taşınacak:',
        reason: 'Neden: {reason}',
        conflictsWith: 'Çakıştığı dosyalar: {files}',
        warning: 'Bu işlem Obsidian içinden kolayca geri alınamaz, ancak dosyalar genellikle sistem çöp kutusundan kurtarılabilir.',
        deleteFiles: '{count} dosyayı sil'
    },
    settings: {
        developer: { heading: 'Geliştirici tanılamaları' },
        providerConfig: { heading: 'LLM sağlayıcıları' },
        multiModel: { heading: 'Çoklu model kullanımı' },
        translationTask: { heading: 'Görev: Çevir' },
        mermaidTask: { heading: 'Görev: Mermaid diyagramı olarak özetle' },
        extractConceptsTask: { heading: 'Görev: Kavramları çıkar' },
        stableApi: { heading: 'Kararlı API çağrıları' },
        workflowBuilder: { heading: 'Tek tıklamalı iş akışı düğmeleri' },
        generalOutput: {
            processedHeading: 'İşlenen dosya çıktısı',
            conceptNoteHeading: 'Kavram notu çıktısı',
            conceptLogHeading: 'Kavram günlük dosyası çıktısı'
        },
        contentGeneration: { heading: 'İçerik üretimi ve çıktı' },
        customPrompts: { heading: 'Özel istem ayarları' },
        extractOriginalText: { heading: 'Belirli özgün metni çıkar' },
        webResearch: { heading: 'Web araştırma sağlayıcısı' },
        processing: { heading: 'İşleme parametreleri' },
        batchProcessing: { heading: 'Toplu işleme' },
        batchMermaidFix: { heading: 'Toplu Mermaid düzeltmesi' },
        duplicateScope: { heading: 'Yinelenen kontrol kapsamı' },
        focusedLearning: { heading: 'Odaklı öğrenme alanı' }
    }
});

extendLocale(STRINGS_UK, {
    common: { select: 'Вибрати' },
    commands: {
        checkDuplicatesCurrent: 'Перевірити дублікати в поточному файлі',
        extractConceptsAndGenerateTitles: 'Видобути концепти й згенерувати заголовки',
        createWikiLinkAndGenerateNoteFromSelection: 'Створити вікіпосилання й згенерувати нотатку з виділення'
    },
    duplicateModal: {
        title: 'Підтвердити видалення дублікатів',
        intro: 'Наступні {count} нотаток-концептів визначено як потенційні дублікати, і їх буде переміщено до системного кошика:',
        reason: 'Причина: {reason}',
        conflictsWith: 'Конфліктує з: {files}',
        warning: 'Цю дію нелегко скасувати всередині Obsidian, але файли зазвичай можна відновити із системного кошика.',
        deleteFiles: 'Видалити {count} файлів'
    },
    settings: {
        developer: { heading: 'Діагностика для розробників' },
        providerConfig: { heading: 'Провайдери LLM' },
        multiModel: { heading: 'Використання кількох моделей' },
        translationTask: { heading: 'Завдання: Переклад' },
        mermaidTask: { heading: 'Завдання: Підсумувати як діаграму Mermaid' },
        extractConceptsTask: { heading: 'Завдання: Видобути концепти' },
        stableApi: { heading: 'Стабільні виклики API' },
        workflowBuilder: { heading: 'Кнопки workflow в один клік' },
        generalOutput: {
            processedHeading: 'Вивід обробленого файлу',
            conceptNoteHeading: 'Вивід нотаток-концептів',
            conceptLogHeading: 'Вивід файла журналу концептів'
        },
        contentGeneration: { heading: 'Генерація контенту та вивід' },
        customPrompts: { heading: 'Налаштування користувацьких промптів' },
        extractOriginalText: { heading: 'Видобути певний оригінальний текст' },
        webResearch: { heading: 'Провайдер веб-досліджень' },
        processing: { heading: 'Параметри обробки' },
        batchProcessing: { heading: 'Пакетна обробка' },
        batchMermaidFix: { heading: 'Пакетне виправлення Mermaid' },
        duplicateScope: { heading: 'Область перевірки дублікатів' },
        focusedLearning: { heading: 'Сфокусована навчальна область' }
    }
});

extendLocale(STRINGS_VI, {
    common: { select: 'Chọn' },
    commands: {
        checkDuplicatesCurrent: 'Kiểm tra trùng lặp trong tệp hiện tại',
        extractConceptsAndGenerateTitles: 'Trích xuất khái niệm và tạo tiêu đề',
        createWikiLinkAndGenerateNoteFromSelection: 'Tạo wiki-link và tạo ghi chú từ vùng chọn'
    },
    duplicateModal: {
        title: 'Xác nhận xóa mục trùng lặp',
        intro: 'Các ghi chú khái niệm sau đây, tổng cộng {count} mục, được xác định là có khả năng trùng lặp và sẽ được chuyển vào thùng rác hệ thống:',
        reason: 'Lý do: {reason}',
        conflictsWith: 'Xung đột với: {files}',
        warning: 'Không thể dễ dàng hoàn tác hành động này từ bên trong Obsidian, nhưng thông thường vẫn có thể khôi phục tệp từ thùng rác hệ thống.',
        deleteFiles: 'Xóa {count} tệp'
    },
    settings: {
        developer: { heading: 'Chẩn đoán cho nhà phát triển' },
        providerConfig: { heading: 'Nhà cung cấp LLM' },
        multiModel: { heading: 'Sử dụng đa mô hình' },
        translationTask: { heading: 'Tác vụ: Dịch' },
        mermaidTask: { heading: 'Tác vụ: Tóm tắt thành sơ đồ Mermaid' },
        extractConceptsTask: { heading: 'Tác vụ: Trích xuất khái niệm' },
        stableApi: { heading: 'Lời gọi API ổn định' },
        workflowBuilder: { heading: 'Nút quy trình một chạm' },
        generalOutput: {
            processedHeading: 'Đầu ra tệp đã xử lý',
            conceptNoteHeading: 'Đầu ra ghi chú khái niệm',
            conceptLogHeading: 'Đầu ra tệp nhật ký khái niệm'
        },
        contentGeneration: { heading: 'Tạo nội dung và đầu ra' },
        customPrompts: { heading: 'Cài đặt prompt tùy chỉnh' },
        extractOriginalText: { heading: 'Trích xuất văn bản gốc cụ thể' },
        webResearch: { heading: 'Nhà cung cấp nghiên cứu web' },
        processing: { heading: 'Tham số xử lý' },
        batchProcessing: { heading: 'Xử lý hàng loạt' },
        batchMermaidFix: { heading: 'Sửa Mermaid hàng loạt' },
        duplicateScope: { heading: 'Phạm vi kiểm tra trùng lặp' },
        focusedLearning: { heading: 'Miền học tập tập trung' }
    }
});

extendLocale(STRINGS_AR, {
    settings: {
        providerConfig: {
            summaryTitle: 'تم توسيع الإعدادات المسبقة للمزوّدين إلى {count} إدخالًا.',
            summaryDesc:
                'تستخدم المزوّدات المتوافقة مع OpenAI الآن مسار تشغيل موحّدًا. تغطي الإعدادات المسبقة المضمنة خدمات موجّهة للصين مثل Qwen وDoubao وMoonshot وGLM وMiniMax وBaidu Qianfan وSiliconFlow، كما يمكن للإعداد المسبق العام "OpenAI Compatible" استهداف LiteLLM أو vLLM أو Perplexity أو Vercel AI Gateway أو الوكيل الخاص بك.',
            manageName: 'إدارة إعدادات المزوّدين',
            manageDesc: 'صدّر إعدادات المزوّد الحالية إلى ملف JSON، أو استورد الإعدادات من ملف.',
            exportButton: 'تصدير المزوّدين',
            exportTooltip: 'حفظ إعدادات المزوّدين',
            importButton: 'استيراد المزوّدين',
            importTooltip: 'تحميل إعدادات المزوّدين (مع الدمج)',
            activeProviderName: 'المزوّد النشط',
            activeProviderDesc: 'اختر مزوّد LLM المستخدم في المعالجة.',
            providerDetailsHeading: 'تفاصيل {provider}',
            apiKeyName: 'مفتاح API',
            apiKeyDescRequired: 'مفتاح API لـ {provider}.{extra}',
            apiKeyDescOptional: 'مفتاح API لـ {provider}. وهو اختياري للنهايات التي تسمح بالوصول المؤقت أو المجهول.',
            apiKeyExtraLmStudio: " (اختياري، غالبًا 'EMPTY')",
            apiKeyPlaceholderDefault: 'أدخل مفتاح API الخاص بك',
            apiKeyPlaceholderLmStudio: 'عادةً EMPTY أو اتركه فارغًا',
            baseUrlName: 'عنوان URL الأساسي / نقطة النهاية',
            baseUrlDesc: 'نقطة نهاية API الخاصة بـ {provider}.{required}',
            baseUrlRequired: ' مطلوب.',
            baseUrlPlaceholder: 'أدخل عنوان URL الأساسي للـ API',
            modelName: 'النموذج',
            modelDesc: 'اسم النموذج المستخدم مع {provider}.',
            modelPlaceholder: 'أدخل اسم النموذج',
            temperatureName: 'الحرارة',
            temperatureDesc: 'تتحكم في العشوائية (0=حتمي، 1=إبداعي).',
            apiVersionName: 'إصدار API',
            apiVersionDesc: 'إصدار API المطلوب لـ Azure OpenAI (مثل 2024-02-15-preview)',
            apiVersionPlaceholder: 'أدخل إصدار API',
            testConnectionName: 'اختبر اتصال {provider}',
            testConnectionDesc: 'تحقق من مفتاح API ونقطة النهاية وإمكانية الوصول إلى النموذج.',
            testConnectionButton: 'اختبار الاتصال',
            testConnectionTesting: 'جارٍ الاختبار...',
            testConnectionRunning: 'جارٍ اختبار الاتصال بـ {provider}...',
            testConnectionBlocked: 'تعذر اختبار {provider}: {issues}',
            testConnectionSuccess: '✅ نجح: {message}',
            testConnectionFailed: '❌ فشل: {message}. راجع وحدة التحكم.',
            testConnectionError: 'خطأ أثناء اختبار الاتصال: {message}',
            missingActiveProvider: 'خطأ: تعذر العثور على إعدادات المزوّد النشط.',
            exportDirectoryError: 'خطأ أثناء إنشاء مجلد الإضافة: {message}',
            exportSuccess: 'تم تصدير إعدادات المزوّدين بنجاح إلى {path}',
            exportError: 'خطأ أثناء تصدير الإعدادات: {message}',
            importFileMissing: "لم يتم العثور على ملف الاستيراد في {path}. يرجى وضع ملف 'notemd-providers.json' هناك.",
            importInvalidArray: 'الملف المستورد لا يحتوي على مصفوفة مزوّدين صالحة.',
            activeProviderReset: 'تمت إعادة تعيين المزوّد النشط إلى الافتراضي لأن المزوّد السابق لم يُعثر عليه بعد الاستيراد.',
            importSuccess: 'تم استيراد {newCount} إعدادًا جديدًا وتحديث {updatedCount} من إعدادات المزوّدين الموجودة بنجاح.',
            importError: 'خطأ أثناء استيراد الإعدادات: {message}',
            validationRequired: 'الإعداد مطلوب',
            validationWarning: 'تحذير في الإعداد'
        }
    }
});

extendLocale(STRINGS_DE, {
    settings: {
        providerConfig: {
            summaryTitle: 'Anbietervoreinstellungen auf {count} Einträge erweitert.',
            summaryDesc:
                'OpenAI-kompatible Anbieter verwenden jetzt einen gemeinsamen Laufzeitpfad. Die integrierten Voreinstellungen decken China-orientierte Dienste wie Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan und SiliconFlow ab, und die allgemeine Voreinstellung "OpenAI Compatible" kann LiteLLM, vLLM, Perplexity, Vercel AI Gateway oder Ihren eigenen Proxy ansprechen.',
            manageName: 'Anbieterkonfigurationen verwalten',
            manageDesc: 'Exportieren Sie Ihre aktuellen Anbietereinstellungen in eine JSON-Datei oder importieren Sie Einstellungen aus einer Datei.',
            exportButton: 'Anbieter exportieren',
            exportTooltip: 'Anbieterkonfigurationen speichern',
            importButton: 'Anbieter importieren',
            importTooltip: 'Anbieterkonfigurationen laden (führt zusammen)',
            activeProviderName: 'Aktiver Anbieter',
            activeProviderDesc: 'Wählen Sie den LLM-Anbieter für die Verarbeitung.',
            providerDetailsHeading: 'Details zu {provider}',
            apiKeyName: 'API-Schlüssel',
            apiKeyDescRequired: 'API-Schlüssel für {provider}.{extra}',
            apiKeyDescOptional: 'API-Schlüssel für {provider}. Optional für Endpunkte, die Platzhalter- oder anonymen Zugriff erlauben.',
            apiKeyExtraLmStudio: " (Optional, oft 'EMPTY')",
            apiKeyPlaceholderDefault: 'API-Schlüssel eingeben',
            apiKeyPlaceholderLmStudio: 'Normalerweise EMPTY oder leer lassen',
            baseUrlName: 'Basis-URL / Endpunkt',
            baseUrlDesc: 'Der API-Endpunkt für {provider}.{required}',
            baseUrlRequired: ' Erforderlich.',
            baseUrlPlaceholder: 'API-Basis-URL eingeben',
            modelName: 'Modell',
            modelDesc: 'Zu verwendender Modellname für {provider}.',
            modelPlaceholder: 'Modellname eingeben',
            temperatureName: 'Temperatur',
            temperatureDesc: 'Steuert die Zufälligkeit (0=deterministisch, 1=kreativ).',
            apiVersionName: 'API-Version',
            apiVersionDesc: 'Erforderliche API-Version für Azure OpenAI (z. B. 2024-02-15-preview)',
            apiVersionPlaceholder: 'API-Version eingeben',
            testConnectionName: 'Verbindung zu {provider} testen',
            testConnectionDesc: 'API-Schlüssel, Endpunkt und Modellzugriff prüfen.',
            testConnectionButton: 'Verbindung testen',
            testConnectionTesting: 'Test läuft...',
            testConnectionRunning: 'Verbindung zu {provider} wird getestet...',
            testConnectionBlocked: '{provider} kann nicht getestet werden: {issues}',
            testConnectionSuccess: '✅ Erfolgreich: {message}',
            testConnectionFailed: '❌ Fehlgeschlagen: {message}. Konsole prüfen.',
            testConnectionError: 'Fehler beim Verbindungstest: {message}',
            missingActiveProvider: 'Fehler: Konfiguration für den aktiven Anbieter wurde nicht gefunden.',
            exportDirectoryError: 'Fehler beim Erstellen des Plugin-Verzeichnisses: {message}',
            exportSuccess: 'Anbietereinstellungen erfolgreich nach {path} exportiert',
            exportError: 'Fehler beim Exportieren der Einstellungen: {message}',
            importFileMissing: "Importdatei unter {path} nicht gefunden. Bitte legen Sie Ihre Datei 'notemd-providers.json' dort ab.",
            importInvalidArray: 'Die importierte Datei enthält kein gültiges Anbieter-Array.',
            activeProviderReset: 'Aktiver Anbieter wurde auf den Standard zurückgesetzt, da der vorherige Anbieter nach dem Import nicht gefunden wurde.',
            importSuccess: 'Erfolgreich {newCount} neue importiert und {updatedCount} vorhandene Anbietereinstellungen aktualisiert.',
            importError: 'Fehler beim Importieren der Einstellungen: {message}',
            validationRequired: 'Konfiguration erforderlich',
            validationWarning: 'Konfigurationswarnung'
        }
    }
});

extendLocale(STRINGS_ES, {
    settings: {
        providerConfig: {
            summaryTitle: 'Los preajustes de proveedores se ampliaron a {count} entradas.',
            summaryDesc:
                'Los proveedores compatibles con OpenAI ahora comparten una sola ruta de ejecución. Los preajustes integrados cubren servicios orientados a China como Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan y SiliconFlow, y el preajuste genérico "OpenAI Compatible" puede apuntar a LiteLLM, vLLM, Perplexity, Vercel AI Gateway o tu propio proxy.',
            manageName: 'Gestionar configuraciones de proveedores',
            manageDesc: 'Exporta tu configuración actual de proveedores a un archivo JSON o importa configuraciones desde un archivo.',
            exportButton: 'Exportar proveedores',
            exportTooltip: 'Guardar configuraciones de proveedores',
            importButton: 'Importar proveedores',
            importTooltip: 'Cargar configuraciones de proveedores (fusiona)',
            activeProviderName: 'Proveedor activo',
            activeProviderDesc: 'Selecciona el proveedor LLM que se usará para el procesamiento.',
            providerDetailsHeading: 'Detalles de {provider}',
            apiKeyName: 'Clave API',
            apiKeyDescRequired: 'Clave API para {provider}.{extra}',
            apiKeyDescOptional: 'Clave API para {provider}. Opcional para endpoints que permiten acceso anónimo o de marcador de posición.',
            apiKeyExtraLmStudio: " (Opcional, a menudo 'EMPTY')",
            apiKeyPlaceholderDefault: 'Introduce tu clave API',
            apiKeyPlaceholderLmStudio: 'Normalmente EMPTY o dejar en blanco',
            baseUrlName: 'URL base / endpoint',
            baseUrlDesc: 'El endpoint de API para {provider}.{required}',
            baseUrlRequired: ' Obligatorio.',
            baseUrlPlaceholder: 'Introduce la URL base de la API',
            modelName: 'Modelo',
            modelDesc: 'Nombre del modelo que se usará con {provider}.',
            modelPlaceholder: 'Introduce el nombre del modelo',
            temperatureName: 'Temperatura',
            temperatureDesc: 'Controla la aleatoriedad (0=determinista, 1=creativo).',
            apiVersionName: 'Versión de API',
            apiVersionDesc: 'Versión de API requerida para Azure OpenAI (p. ej., 2024-02-15-preview)',
            apiVersionPlaceholder: 'Introduce la versión de API',
            testConnectionName: 'Probar conexión con {provider}',
            testConnectionDesc: 'Verifica la clave API, el endpoint y el acceso al modelo.',
            testConnectionButton: 'Probar conexión',
            testConnectionTesting: 'Probando...',
            testConnectionRunning: 'Probando conexión con {provider}...',
            testConnectionBlocked: 'No se puede probar {provider}: {issues}',
            testConnectionSuccess: '✅ Correcto: {message}',
            testConnectionFailed: '❌ Falló: {message}. Revisa la consola.',
            testConnectionError: 'Error durante la prueba de conexión: {message}',
            missingActiveProvider: 'Error: no se pudo encontrar la configuración del proveedor activo.',
            exportDirectoryError: 'Error al crear el directorio del plugin: {message}',
            exportSuccess: 'La configuración de proveedores se exportó correctamente a {path}',
            exportError: 'Error al exportar la configuración: {message}',
            importFileMissing: "No se encontró el archivo de importación en {path}. Coloca allí tu archivo 'notemd-providers.json'.",
            importInvalidArray: 'El archivo importado no contiene un arreglo válido de proveedores.',
            activeProviderReset: 'El proveedor activo se restableció al predeterminado porque el anterior no se encontró después de la importación.',
            importSuccess: 'Se importaron correctamente {newCount} configuraciones nuevas y se actualizaron {updatedCount} configuraciones existentes de proveedores.',
            importError: 'Error al importar la configuración: {message}',
            validationRequired: 'Configuración obligatoria',
            validationWarning: 'Advertencia de configuración'
        }
    }
});

extendLocale(STRINGS_FA, {
    settings: {
        providerConfig: {
            summaryTitle: 'پیش‌تنظیم‌های ارائه‌دهنده به {count} مورد گسترش یافت.',
            summaryDesc:
                'ارائه‌دهنده‌های سازگار با OpenAI اکنون از یک مسیر اجرای مشترک استفاده می‌کنند. پیش‌تنظیم‌های داخلی سرویس‌های متمرکز بر چین مانند Qwen، Doubao، Moonshot، GLM، MiniMax، Baidu Qianfan و SiliconFlow را پوشش می‌دهند و پیش‌تنظیم عمومی "OpenAI Compatible" می‌تواند LiteLLM، vLLM، Perplexity، Vercel AI Gateway یا پراکسی خودتان را هدف بگیرد.',
            manageName: 'مدیریت پیکربندی ارائه‌دهنده‌ها',
            manageDesc: 'پیکربندی فعلی ارائه‌دهنده‌ها را به یک فایل JSON صادر کنید یا تنظیمات را از یک فایل وارد کنید.',
            exportButton: 'صدور ارائه‌دهنده‌ها',
            exportTooltip: 'ذخیره پیکربندی ارائه‌دهنده‌ها',
            importButton: 'ورود ارائه‌دهنده‌ها',
            importTooltip: 'بارگذاری پیکربندی ارائه‌دهنده‌ها (با ادغام)',
            activeProviderName: 'ارائه‌دهنده فعال',
            activeProviderDesc: 'ارائه‌دهنده LLM مورد استفاده برای پردازش را انتخاب کنید.',
            providerDetailsHeading: 'جزئیات {provider}',
            apiKeyName: 'کلید API',
            apiKeyDescRequired: 'کلید API برای {provider}.{extra}',
            apiKeyDescOptional: 'کلید API برای {provider}. برای endpointهایی که دسترسی ناشناس یا جایگزین را می‌پذیرند اختیاری است.',
            apiKeyExtraLmStudio: " (اختیاری، اغلب 'EMPTY')",
            apiKeyPlaceholderDefault: 'کلید API خود را وارد کنید',
            apiKeyPlaceholderLmStudio: 'معمولاً EMPTY یا خالی بگذارید',
            baseUrlName: 'URL پایه / endpoint',
            baseUrlDesc: 'endpoint API برای {provider}.{required}',
            baseUrlRequired: ' الزامی است.',
            baseUrlPlaceholder: 'URL پایه API را وارد کنید',
            modelName: 'مدل',
            modelDesc: 'نام مدلی که با {provider} استفاده می‌شود.',
            modelPlaceholder: 'نام مدل را وارد کنید',
            temperatureName: 'دما',
            temperatureDesc: 'میزان تصادفی بودن را کنترل می‌کند (0=قطعی، 1=خلاق).',
            apiVersionName: 'نسخه API',
            apiVersionDesc: 'نسخه API لازم برای Azure OpenAI (برای مثال 2024-02-15-preview)',
            apiVersionPlaceholder: 'نسخه API را وارد کنید',
            testConnectionName: 'آزمایش اتصال {provider}',
            testConnectionDesc: 'کلید API، endpoint و دسترسی‌پذیری مدل را بررسی کنید.',
            testConnectionButton: 'آزمایش اتصال',
            testConnectionTesting: 'در حال آزمایش...',
            testConnectionRunning: 'در حال آزمایش اتصال به {provider}...',
            testConnectionBlocked: 'امکان آزمایش {provider} نیست: {issues}',
            testConnectionSuccess: '✅ موفق: {message}',
            testConnectionFailed: '❌ ناموفق: {message}. کنسول را بررسی کنید.',
            testConnectionError: 'خطا هنگام آزمایش اتصال: {message}',
            missingActiveProvider: 'خطا: پیکربندی ارائه‌دهنده فعال پیدا نشد.',
            exportDirectoryError: 'خطا در ایجاد پوشه افزونه: {message}',
            exportSuccess: 'تنظیمات ارائه‌دهنده با موفقیت به {path} صادر شد',
            exportError: 'خطا در صدور تنظیمات: {message}',
            importFileMissing: "فایل ورود در {path} پیدا نشد. لطفاً فایل 'notemd-providers.json' خود را آنجا قرار دهید.",
            importInvalidArray: 'فایل واردشده شامل آرایه معتبر ارائه‌دهنده نیست.',
            activeProviderReset: 'ارائه‌دهنده فعال به حالت پیش‌فرض بازنشانی شد چون ارائه‌دهنده قبلی پس از ورود پیدا نشد.',
            importSuccess: 'با موفقیت {newCount} تنظیم جدید وارد و {updatedCount} تنظیم موجود ارائه‌دهنده به‌روزرسانی شد.',
            importError: 'خطا در ورود تنظیمات: {message}',
            validationRequired: 'پیکربندی الزامی است',
            validationWarning: 'هشدار پیکربندی'
        }
    }
});

extendLocale(STRINGS_FR, {
    settings: {
        providerConfig: {
            summaryTitle: 'Les préréglages de fournisseurs ont été étendus à {count} entrées.',
            summaryDesc:
                'Les fournisseurs compatibles OpenAI partagent désormais un seul chemin d’exécution. Les préréglages intégrés couvrent des services orientés vers la Chine comme Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan et SiliconFlow, et le préréglage générique "OpenAI Compatible" peut cibler LiteLLM, vLLM, Perplexity, Vercel AI Gateway ou votre propre proxy.',
            manageName: 'Gérer les configurations de fournisseurs',
            manageDesc: 'Exportez votre configuration actuelle de fournisseurs dans un fichier JSON ou importez des paramètres depuis un fichier.',
            exportButton: 'Exporter les fournisseurs',
            exportTooltip: 'Enregistrer les configurations de fournisseurs',
            importButton: 'Importer des fournisseurs',
            importTooltip: 'Charger les configurations de fournisseurs (fusion)',
            activeProviderName: 'Fournisseur actif',
            activeProviderDesc: 'Sélectionnez le fournisseur LLM à utiliser pour le traitement.',
            providerDetailsHeading: 'Détails de {provider}',
            apiKeyName: 'Clé API',
            apiKeyDescRequired: 'Clé API pour {provider}.{extra}',
            apiKeyDescOptional: 'Clé API pour {provider}. Optionnelle pour les endpoints qui autorisent un accès anonyme ou via valeur fictive.',
            apiKeyExtraLmStudio: " (Optionnel, souvent 'EMPTY')",
            apiKeyPlaceholderDefault: 'Saisissez votre clé API',
            apiKeyPlaceholderLmStudio: 'Généralement EMPTY ou laissez vide',
            baseUrlName: 'URL de base / endpoint',
            baseUrlDesc: 'L’endpoint API pour {provider}.{required}',
            baseUrlRequired: ' Requis.',
            baseUrlPlaceholder: 'Saisissez l’URL de base de l’API',
            modelName: 'Modèle',
            modelDesc: 'Nom du modèle à utiliser avec {provider}.',
            modelPlaceholder: 'Saisissez le nom du modèle',
            temperatureName: 'Température',
            temperatureDesc: 'Contrôle le degré d’aléatoire (0=déterministe, 1=créatif).',
            apiVersionName: 'Version API',
            apiVersionDesc: 'Version API requise pour Azure OpenAI (par ex. 2024-02-15-preview)',
            apiVersionPlaceholder: 'Saisissez la version de l’API',
            testConnectionName: 'Tester la connexion à {provider}',
            testConnectionDesc: 'Vérifiez la clé API, l’endpoint et l’accessibilité du modèle.',
            testConnectionButton: 'Tester la connexion',
            testConnectionTesting: 'Test en cours...',
            testConnectionRunning: 'Test de connexion à {provider}...',
            testConnectionBlocked: 'Impossible de tester {provider} : {issues}',
            testConnectionSuccess: '✅ Succès : {message}',
            testConnectionFailed: '❌ Échec : {message}. Vérifiez la console.',
            testConnectionError: 'Erreur pendant le test de connexion : {message}',
            missingActiveProvider: 'Erreur : impossible de trouver la configuration du fournisseur actif.',
            exportDirectoryError: 'Erreur lors de la création du répertoire du plugin : {message}',
            exportSuccess: 'Paramètres des fournisseurs exportés avec succès vers {path}',
            exportError: 'Erreur lors de l’export des paramètres : {message}',
            importFileMissing: "Fichier d’import introuvable à {path}. Veuillez y placer votre fichier 'notemd-providers.json'.",
            importInvalidArray: 'Le fichier importé ne contient pas un tableau de fournisseurs valide.',
            activeProviderReset: 'Le fournisseur actif a été réinitialisé par défaut, car l’ancien fournisseur est introuvable après l’import.',
            importSuccess: '{newCount} nouvelles configurations importées et {updatedCount} configurations existantes mises à jour avec succès.',
            importError: 'Erreur lors de l’import des paramètres : {message}',
            validationRequired: 'Configuration requise',
            validationWarning: 'Avertissement de configuration'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        providerConfig: {
            summaryTitle: 'Preset penyedia diperluas menjadi {count} entri.',
            summaryDesc:
                'Penyedia yang kompatibel dengan OpenAI kini berbagi satu jalur runtime. Preset bawaan mencakup layanan berfokus Tiongkok seperti Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan, dan SiliconFlow, dan preset generik "OpenAI Compatible" dapat menargetkan LiteLLM, vLLM, Perplexity, Vercel AI Gateway, atau proxy Anda sendiri.',
            manageName: 'Kelola konfigurasi penyedia',
            manageDesc: 'Ekspor pengaturan penyedia Anda saat ini ke file JSON, atau impor pengaturan dari file.',
            exportButton: 'Ekspor penyedia',
            exportTooltip: 'Simpan konfigurasi penyedia',
            importButton: 'Impor penyedia',
            importTooltip: 'Muat konfigurasi penyedia (gabungkan)',
            activeProviderName: 'Penyedia aktif',
            activeProviderDesc: 'Pilih penyedia LLM yang akan digunakan untuk pemrosesan.',
            providerDetailsHeading: 'Detail {provider}',
            apiKeyName: 'Kunci API',
            apiKeyDescRequired: 'Kunci API untuk {provider}.{extra}',
            apiKeyDescOptional: 'Kunci API untuk {provider}. Opsional untuk endpoint yang mengizinkan akses anonim atau placeholder.',
            apiKeyExtraLmStudio: " (Opsional, sering kali 'EMPTY')",
            apiKeyPlaceholderDefault: 'Masukkan kunci API Anda',
            apiKeyPlaceholderLmStudio: 'Biasanya EMPTY atau biarkan kosong',
            baseUrlName: 'URL dasar / endpoint',
            baseUrlDesc: 'Endpoint API untuk {provider}.{required}',
            baseUrlRequired: ' Wajib.',
            baseUrlPlaceholder: 'Masukkan URL dasar API',
            modelName: 'Model',
            modelDesc: 'Nama model yang digunakan dengan {provider}.',
            modelPlaceholder: 'Masukkan nama model',
            temperatureName: 'Temperatur',
            temperatureDesc: 'Mengontrol tingkat acak (0=deterministik, 1=kreatif).',
            apiVersionName: 'Versi API',
            apiVersionDesc: 'Versi API yang diperlukan untuk Azure OpenAI (misalnya, 2024-02-15-preview)',
            apiVersionPlaceholder: 'Masukkan versi API',
            testConnectionName: 'Uji koneksi {provider}',
            testConnectionDesc: 'Verifikasi kunci API, endpoint, dan aksesibilitas model.',
            testConnectionButton: 'Uji koneksi',
            testConnectionTesting: 'Menguji...',
            testConnectionRunning: 'Menguji koneksi ke {provider}...',
            testConnectionBlocked: 'Tidak dapat menguji {provider}: {issues}',
            testConnectionSuccess: '✅ Berhasil: {message}',
            testConnectionFailed: '❌ Gagal: {message}. Periksa konsol.',
            testConnectionError: 'Kesalahan saat uji koneksi: {message}',
            missingActiveProvider: 'Kesalahan: konfigurasi untuk penyedia aktif tidak ditemukan.',
            exportDirectoryError: 'Kesalahan saat membuat direktori plugin: {message}',
            exportSuccess: 'Pengaturan penyedia berhasil diekspor ke {path}',
            exportError: 'Kesalahan saat mengekspor pengaturan: {message}',
            importFileMissing: "File impor tidak ditemukan di {path}. Silakan letakkan file 'notemd-providers.json' Anda di sana.",
            importInvalidArray: 'File yang diimpor tidak berisi array penyedia yang valid.',
            activeProviderReset: 'Penyedia aktif direset ke default karena penyedia sebelumnya tidak ditemukan setelah impor.',
            importSuccess: 'Berhasil mengimpor {newCount} pengaturan baru dan memperbarui {updatedCount} pengaturan penyedia yang sudah ada.',
            importError: 'Kesalahan saat mengimpor pengaturan: {message}',
            validationRequired: 'Konfigurasi wajib',
            validationWarning: 'Peringatan konfigurasi'
        }
    }
});

extendLocale(STRINGS_IT, {
    settings: {
        providerConfig: {
            summaryTitle: 'I preset dei provider sono stati estesi a {count} voci.',
            summaryDesc:
                'I provider compatibili con OpenAI ora condividono un unico percorso runtime. I preset integrati coprono servizi orientati alla Cina come Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan e SiliconFlow, e il preset generico "OpenAI Compatible" può puntare a LiteLLM, vLLM, Perplexity, Vercel AI Gateway o al tuo proxy.',
            manageName: 'Gestisci configurazioni provider',
            manageDesc: 'Esporta le impostazioni correnti dei provider in un file JSON oppure importa impostazioni da un file.',
            exportButton: 'Esporta provider',
            exportTooltip: 'Salva configurazioni provider',
            importButton: 'Importa provider',
            importTooltip: 'Carica configurazioni provider (unisce)',
            activeProviderName: 'Provider attivo',
            activeProviderDesc: 'Seleziona il provider LLM da usare per l’elaborazione.',
            providerDetailsHeading: 'Dettagli di {provider}',
            apiKeyName: 'Chiave API',
            apiKeyDescRequired: 'Chiave API per {provider}.{extra}',
            apiKeyDescOptional: 'Chiave API per {provider}. Facoltativa per endpoint che consentono accesso anonimo o segnaposto.',
            apiKeyExtraLmStudio: " (Facoltativo, spesso 'EMPTY')",
            apiKeyPlaceholderDefault: 'Inserisci la tua chiave API',
            apiKeyPlaceholderLmStudio: 'Di solito EMPTY oppure lascia vuoto',
            baseUrlName: 'URL di base / endpoint',
            baseUrlDesc: 'L’endpoint API per {provider}.{required}',
            baseUrlRequired: ' Obbligatorio.',
            baseUrlPlaceholder: 'Inserisci l’URL base dell’API',
            modelName: 'Modello',
            modelDesc: 'Nome del modello da usare con {provider}.',
            modelPlaceholder: 'Inserisci il nome del modello',
            temperatureName: 'Temperatura',
            temperatureDesc: 'Controlla il livello di casualità (0=deterministico, 1=creativo).',
            apiVersionName: 'Versione API',
            apiVersionDesc: 'Versione API richiesta per Azure OpenAI (ad es. 2024-02-15-preview)',
            apiVersionPlaceholder: 'Inserisci la versione API',
            testConnectionName: 'Testa connessione {provider}',
            testConnectionDesc: 'Verifica chiave API, endpoint e accessibilità del modello.',
            testConnectionButton: 'Testa connessione',
            testConnectionTesting: 'Test in corso...',
            testConnectionRunning: 'Test della connessione a {provider} in corso...',
            testConnectionBlocked: 'Impossibile testare {provider}: {issues}',
            testConnectionSuccess: '✅ Successo: {message}',
            testConnectionFailed: '❌ Fallito: {message}. Controlla la console.',
            testConnectionError: 'Errore durante il test di connessione: {message}',
            missingActiveProvider: 'Errore: impossibile trovare la configurazione del provider attivo.',
            exportDirectoryError: 'Errore durante la creazione della cartella del plugin: {message}',
            exportSuccess: 'Impostazioni provider esportate con successo in {path}',
            exportError: 'Errore durante l’esportazione delle impostazioni: {message}',
            importFileMissing: "File di importazione non trovato in {path}. Inserisci lì il tuo file 'notemd-providers.json'.",
            importInvalidArray: 'Il file importato non contiene un array valido di provider.',
            activeProviderReset: 'Il provider attivo è stato reimpostato al valore predefinito perché il precedente non è stato trovato dopo l’importazione.',
            importSuccess: 'Importate con successo {newCount} nuove configurazioni e aggiornate {updatedCount} configurazioni provider esistenti.',
            importError: 'Errore durante l’importazione delle impostazioni: {message}',
            validationRequired: 'Configurazione obbligatoria',
            validationWarning: 'Avviso di configurazione'
        }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        providerConfig: {
            summaryTitle: 'プロバイダープリセットが {count} 件に拡張されました。',
            summaryDesc:
                'OpenAI 互換プロバイダーは現在、単一のランタイム経路を共有しています。組み込みプリセットには Qwen、Doubao、Moonshot、GLM、MiniMax、Baidu Qianfan、SiliconFlow など中国向けサービスが含まれ、汎用の "OpenAI Compatible" プリセットでは LiteLLM、vLLM、Perplexity、Vercel AI Gateway、または独自プロキシを対象にできます。',
            manageName: 'プロバイダー設定を管理',
            manageDesc: '現在のプロバイダー設定を JSON ファイルにエクスポートするか、ファイルから設定をインポートします。',
            exportButton: 'プロバイダーをエクスポート',
            exportTooltip: 'プロバイダー設定を保存',
            importButton: 'プロバイダーをインポート',
            importTooltip: 'プロバイダー設定を読み込む（マージ）',
            activeProviderName: 'アクティブなプロバイダー',
            activeProviderDesc: '処理に使用する LLM プロバイダーを選択します。',
            providerDetailsHeading: '{provider} の詳細',
            apiKeyName: 'API キー',
            apiKeyDescRequired: '{provider} の API キーです。{extra}',
            apiKeyDescOptional: '{provider} の API キーです。プレースホルダーまたは匿名アクセスを許可するエンドポイントでは任意です。',
            apiKeyExtraLmStudio: "（任意、通常は 'EMPTY'）",
            apiKeyPlaceholderDefault: 'API キーを入力',
            apiKeyPlaceholderLmStudio: '通常は EMPTY、または空欄のまま',
            baseUrlName: 'ベース URL / エンドポイント',
            baseUrlDesc: '{provider} の API エンドポイントです。{required}',
            baseUrlRequired: ' 必須です。',
            baseUrlPlaceholder: 'API ベース URL を入力',
            modelName: 'モデル',
            modelDesc: '{provider} で使用するモデル名です。',
            modelPlaceholder: 'モデル名を入力',
            temperatureName: 'Temperature',
            temperatureDesc: 'ランダム性を制御します（0=決定的、1=創造的）。',
            apiVersionName: 'API バージョン',
            apiVersionDesc: 'Azure OpenAI に必要な API バージョン（例: 2024-02-15-preview）',
            apiVersionPlaceholder: 'API バージョンを入力',
            testConnectionName: '{provider} 接続をテスト',
            testConnectionDesc: 'API キー、エンドポイント、モデルへのアクセス可否を確認します。',
            testConnectionButton: '接続をテスト',
            testConnectionTesting: 'テスト中...',
            testConnectionRunning: '{provider} への接続をテスト中...',
            testConnectionBlocked: '{provider} をテストできません: {issues}',
            testConnectionSuccess: '✅ 成功: {message}',
            testConnectionFailed: '❌ 失敗: {message}。コンソールを確認してください。',
            testConnectionError: '接続テスト中のエラー: {message}',
            missingActiveProvider: 'エラー: アクティブなプロバイダーの設定が見つかりませんでした。',
            exportDirectoryError: 'プラグインディレクトリの作成エラー: {message}',
            exportSuccess: 'プロバイダー設定を {path} に正常にエクスポートしました',
            exportError: '設定のエクスポートエラー: {message}',
            importFileMissing: "インポートファイルが {path} に見つかりません。そこに 'notemd-providers.json' を配置してください。",
            importInvalidArray: 'インポートしたファイルに有効なプロバイダー配列が含まれていません。',
            activeProviderReset: 'インポート後に以前のプロバイダーが見つからなかったため、アクティブなプロバイダーを既定値に戻しました。',
            importSuccess: '{newCount} 件の新規設定をインポートし、既存のプロバイダー設定 {updatedCount} 件を更新しました。',
            importError: '設定のインポートエラー: {message}',
            validationRequired: '設定が必要です',
            validationWarning: '設定の警告'
        }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        providerConfig: {
            summaryTitle: '프로바이더 프리셋이 {count}개 항목으로 확장되었습니다.',
            summaryDesc:
                'OpenAI 호환 프로바이더는 이제 하나의 공통 런타임 경로를 공유합니다. 내장 프리셋은 Qwen, Doubao, Moonshot, GLM, MiniMax, Baidu Qianfan, SiliconFlow 같은 중국 중심 서비스를 포함하며, 일반 "OpenAI Compatible" 프리셋은 LiteLLM, vLLM, Perplexity, Vercel AI Gateway 또는 자체 프록시를 대상으로 할 수 있습니다.',
            manageName: '프로바이더 구성 관리',
            manageDesc: '현재 프로바이더 설정을 JSON 파일로 내보내거나 파일에서 설정을 가져옵니다.',
            exportButton: '프로바이더 내보내기',
            exportTooltip: '프로바이더 구성 저장',
            importButton: '프로바이더 가져오기',
            importTooltip: '프로바이더 구성 불러오기(병합)',
            activeProviderName: '활성 프로바이더',
            activeProviderDesc: '처리에 사용할 LLM 프로바이더를 선택합니다.',
            providerDetailsHeading: '{provider} 세부 정보',
            apiKeyName: 'API 키',
            apiKeyDescRequired: '{provider}용 API 키입니다.{extra}',
            apiKeyDescOptional: '{provider}용 API 키입니다. placeholder 또는 익명 접근을 허용하는 endpoint에서는 선택 사항입니다.',
            apiKeyExtraLmStudio: " (선택 사항, 보통 'EMPTY')",
            apiKeyPlaceholderDefault: 'API 키를 입력하세요',
            apiKeyPlaceholderLmStudio: '보통 EMPTY 또는 비워 두기',
            baseUrlName: '기본 URL / endpoint',
            baseUrlDesc: '{provider}용 API endpoint입니다.{required}',
            baseUrlRequired: ' 필수입니다.',
            baseUrlPlaceholder: 'API 기본 URL을 입력하세요',
            modelName: '모델',
            modelDesc: '{provider}와 함께 사용할 모델 이름입니다.',
            modelPlaceholder: '모델 이름을 입력하세요',
            temperatureName: 'Temperature',
            temperatureDesc: '무작위성을 제어합니다 (0=결정적, 1=창의적).',
            apiVersionName: 'API 버전',
            apiVersionDesc: 'Azure OpenAI에 필요한 API 버전(예: 2024-02-15-preview)',
            apiVersionPlaceholder: 'API 버전을 입력하세요',
            testConnectionName: '{provider} 연결 테스트',
            testConnectionDesc: 'API 키, endpoint, 모델 접근 가능 여부를 확인합니다.',
            testConnectionButton: '연결 테스트',
            testConnectionTesting: '테스트 중...',
            testConnectionRunning: '{provider} 연결을 테스트하는 중...',
            testConnectionBlocked: '{provider}를 테스트할 수 없습니다: {issues}',
            testConnectionSuccess: '✅ 성공: {message}',
            testConnectionFailed: '❌ 실패: {message}. 콘솔을 확인하세요.',
            testConnectionError: '연결 테스트 중 오류: {message}',
            missingActiveProvider: '오류: 활성 프로바이더 구성을 찾을 수 없습니다.',
            exportDirectoryError: '플러그인 디렉터리 생성 오류: {message}',
            exportSuccess: '프로바이더 설정을 {path}로 성공적으로 내보냈습니다',
            exportError: '설정 내보내기 오류: {message}',
            importFileMissing: "{path}에서 가져오기 파일을 찾을 수 없습니다. 해당 위치에 'notemd-providers.json' 파일을 두세요.",
            importInvalidArray: '가져온 파일에 유효한 프로바이더 배열이 없습니다.',
            activeProviderReset: '가져온 후 이전 프로바이더를 찾을 수 없어 활성 프로바이더를 기본값으로 재설정했습니다.',
            importSuccess: '{newCount}개의 새 설정을 가져오고 기존 프로바이더 설정 {updatedCount}개를 업데이트했습니다.',
            importError: '설정 가져오기 오류: {message}',
            validationRequired: '구성이 필요합니다',
            validationWarning: '구성 경고'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        providerConfig: { modelName: 'Model AI' }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        providerConfig: { temperatureName: '温度' }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        providerConfig: { temperatureName: '온도' }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        providerConfig: { modelName: 'Modelnaam' }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        providerConfig: { modelName: 'Nazwa modelu' }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        providerConfig: {
            baseUrlName: 'URL พื้นฐาน / endpoint',
            temperatureName: 'อุณหภูมิ'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        providerConfig: { modelName: 'Model adı' }
    }
});
