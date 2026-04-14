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

extendLocale(STRINGS_ES, {
    errorModal: {
        titles: {
            generic: 'Error general'
        }
    }
});

extendLocale(STRINGS_AR, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'استراتيجية أخطاء سير العمل',
            errorStrategyDesc: 'توقف فورًا عند أول خطوة فاشلة، أو تابع وأكمل الخطوات المتبقية.',
            errorStrategyStop: 'توقف عند أول خطأ',
            errorStrategyContinue: 'تابع عند الخطأ',
            visualBuilderName: 'منشئ سير العمل المرئي',
            visualBuilderDesc: 'أنشئ أزرار سير عمل مخصصة من الإجراءات المضمنة دون كتابة DSL.',
            advancedDslName: 'محرر DSL المتقدم',
            advancedDslDesc: 'اختياري: حرّر مباشرة بصيغة Button Name::action-a>action-b. يبقى المحرر المرئي وDSL متزامنين.',
            dslValidationName: 'التحقق من DSL لسير العمل',
            dslValidationDesc: 'تم العثور على {count} مشكلة/مشكلات. تُتجاهل الأسطر غير الصالحة عند عرض الشريط الجانبي.',
            availableActionIdsName: 'معرّفات إجراءات سير العمل المتاحة',
            builderDslWarning: 'تم اكتشاف {count} مشكلة/مشكلات في DSL. حمّل المحرر المرئي حالة سير عمل آمنة احتياطيًا.',
            builderCardTitle: 'سير العمل {index}',
            deleteButton: 'حذف',
            workflowRemovedNotice: 'تمت إزالة سير العمل.',
            buttonNameLabel: 'اسم الزر',
            buttonNamePlaceholder: 'سير العمل {index}',
            actionSequenceTitle: 'تسلسل الإجراءات',
            removeAction: 'إزالة',
            addAction: 'إضافة إجراء',
            addWorkflow: 'إضافة سير عمل',
            workflowAddedNotice: 'تمت إضافة سير العمل.',
            resetDefault: 'استعادة الافتراضي',
            resetDefaultNotice: 'تمت استعادة سير العمل الافتراضي بنقرة واحدة.'
        }
    }
});

extendLocale(STRINGS_DE, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Workflow-Fehlerstrategie',
            errorStrategyDesc: 'Beim ersten fehlgeschlagenen Schritt sofort anhalten oder fortfahren und die restlichen Schritte abschließen.',
            errorStrategyStop: 'Beim ersten Fehler anhalten',
            errorStrategyContinue: 'Bei Fehler fortfahren',
            visualBuilderName: 'Visueller Workflow-Builder',
            visualBuilderDesc: 'Erstellen Sie benutzerdefinierte Workflow-Schaltflächen aus integrierten Aktionen, ohne DSL zu schreiben.',
            advancedDslName: 'Erweiterter DSL-Editor',
            advancedDslDesc: 'Optional: direkt im Format Button Name::action-a>action-b bearbeiten. Visueller Builder und DSL bleiben synchron.',
            dslValidationName: 'Workflow-DSL-Prüfung',
            dslValidationDesc: '{count} Problem(e) gefunden. Ungültige Zeilen werden bei der Darstellung der Seitenleiste ignoriert.',
            availableActionIdsName: 'Verfügbare Workflow-Aktions-IDs',
            builderDslWarning: '{count} DSL-Problem(e) erkannt. Der visuelle Editor hat einen fallback-sicheren Workflow-Zustand geladen.',
            builderCardTitle: 'Arbeitsablauf {index}',
            deleteButton: 'Löschen',
            workflowRemovedNotice: 'Workflow entfernt.',
            buttonNameLabel: 'Schaltflächenname',
            buttonNamePlaceholder: 'Arbeitsablauf {index}',
            actionSequenceTitle: 'Aktionsabfolge',
            removeAction: 'Entfernen',
            addAction: 'Aktion hinzufügen',
            addWorkflow: 'Workflow hinzufügen',
            workflowAddedNotice: 'Workflow hinzugefügt.',
            resetDefault: 'Auf Standard zurücksetzen',
            resetDefaultNotice: 'Standard-Workflows mit einem Klick wiederhergestellt.'
        }
    }
});

extendLocale(STRINGS_ES, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Estrategia de errores del flujo',
            errorStrategyDesc: 'Detén inmediatamente en el primer paso fallido o continúa y termina los pasos restantes.',
            errorStrategyStop: 'Detener en el primer error',
            errorStrategyContinue: 'Continuar con error',
            visualBuilderName: 'Constructor visual de flujos',
            visualBuilderDesc: 'Crea botones de flujo personalizados a partir de acciones integradas sin escribir DSL.',
            advancedDslName: 'Editor DSL avanzado',
            advancedDslDesc: 'Opcional: edita directamente con el formato Button Name::action-a>action-b. El editor visual y el DSL permanecen sincronizados.',
            dslValidationName: 'Validación del DSL del flujo',
            dslValidationDesc: 'Se encontraron {count} problema(s). Las líneas inválidas se ignoran al renderizar la barra lateral.',
            availableActionIdsName: 'IDs de acciones disponibles del flujo',
            builderDslWarning: 'Se detectaron {count} problema(s) del DSL. El editor visual cargó un estado de flujo seguro de respaldo.',
            builderCardTitle: 'Flujo {index}',
            deleteButton: 'Eliminar',
            workflowRemovedNotice: 'Flujo eliminado.',
            buttonNameLabel: 'Nombre del botón',
            buttonNamePlaceholder: 'Flujo {index}',
            actionSequenceTitle: 'Secuencia de acciones',
            removeAction: 'Quitar',
            addAction: 'Agregar acción',
            addWorkflow: 'Agregar flujo',
            workflowAddedNotice: 'Flujo agregado.',
            resetDefault: 'Restablecer predeterminado',
            resetDefaultNotice: 'Se restauraron los flujos predeterminados de un clic.'
        }
    }
});

extendLocale(STRINGS_FA, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'راهبرد خطای گردش‌کار',
            errorStrategyDesc: 'در نخستین گام ناموفق فوراً توقف کنید، یا ادامه دهید و گام‌های باقی‌مانده را کامل کنید.',
            errorStrategyStop: 'در اولین خطا توقف کن',
            errorStrategyContinue: 'در صورت خطا ادامه بده',
            visualBuilderName: 'سازنده دیداری گردش‌کار',
            visualBuilderDesc: 'بدون نوشتن DSL، از اقدام‌های داخلی دکمه‌های گردش‌کار سفارشی بسازید.',
            advancedDslName: 'ویرایشگر پیشرفته DSL',
            advancedDslDesc: 'اختیاری: با قالب Button Name::action-a>action-b مستقیماً ویرایش کنید. سازنده دیداری و DSL همگام می‌مانند.',
            dslValidationName: 'اعتبارسنجی DSL گردش‌کار',
            dslValidationDesc: '{count} مشکل پیدا شد. خط‌های نامعتبر هنگام رندر نوار کناری نادیده گرفته می‌شوند.',
            availableActionIdsName: 'شناسه‌های اقدامِ در دسترسِ گردش‌کار',
            builderDslWarning: '{count} مشکل DSL شناسایی شد. ویرایشگر دیداری حالت امنِ جایگزینِ گردش‌کار را بارگذاری کرد.',
            builderCardTitle: 'کارت گردش‌کار {index}',
            deleteButton: 'حذف',
            workflowRemovedNotice: 'گردش‌کار حذف شد.',
            buttonNameLabel: 'نام دکمه',
            buttonNamePlaceholder: 'گردش‌کار {index}',
            actionSequenceTitle: 'ترتیب اقدام‌ها',
            removeAction: 'حذف',
            addAction: 'افزودن اقدام',
            addWorkflow: 'افزودن گردش‌کار',
            workflowAddedNotice: 'گردش‌کار اضافه شد.',
            resetDefault: 'بازنشانی به پیش‌فرض',
            resetDefaultNotice: 'گردش‌کارهای پیش‌فرض تک‌کلیکی بازگردانی شدند.'
        }
    }
});

extendLocale(STRINGS_FR, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Stratégie d’erreur du workflow',
            errorStrategyDesc: 'Arrêter immédiatement au premier échec ou continuer et terminer les étapes restantes.',
            errorStrategyStop: 'Arrêter à la première erreur',
            errorStrategyContinue: 'Continuer malgré l’erreur',
            visualBuilderName: 'Constructeur visuel de workflow',
            visualBuilderDesc: 'Créez des boutons de workflow personnalisés à partir des actions intégrées sans écrire de DSL.',
            advancedDslName: 'Éditeur DSL avancé',
            advancedDslDesc: 'Optionnel : modifiez directement au format Button Name::action-a>action-b. Le constructeur visuel et le DSL restent synchronisés.',
            dslValidationName: 'Validation DSL du workflow',
            dslValidationDesc: '{count} problème(s) détecté(s). Les lignes invalides sont ignorées lors du rendu de la barre latérale.',
            availableActionIdsName: 'IDs d’action de workflow disponibles',
            builderDslWarning: '{count} problème(s) de DSL détecté(s). L’éditeur visuel a chargé un état de workflow sûr de repli.',
            builderCardTitle: 'Flux de travail {index}',
            deleteButton: 'Supprimer',
            workflowRemovedNotice: 'Workflow supprimé.',
            buttonNameLabel: 'Nom du bouton',
            buttonNamePlaceholder: 'Flux de travail {index}',
            actionSequenceTitle: 'Séquence d’actions',
            removeAction: 'Retirer',
            addAction: 'Ajouter une action',
            addWorkflow: 'Ajouter un workflow',
            workflowAddedNotice: 'Workflow ajouté.',
            resetDefault: 'Réinitialiser par défaut',
            resetDefaultNotice: 'Les workflows par défaut en un clic ont été restaurés.'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Strategi kesalahan alur kerja',
            errorStrategyDesc: 'Segera berhenti pada langkah gagal pertama, atau lanjutkan dan selesaikan langkah yang tersisa.',
            errorStrategyStop: 'Berhenti pada kesalahan pertama',
            errorStrategyContinue: 'Lanjutkan saat ada kesalahan',
            visualBuilderName: 'Pembuat alur kerja visual',
            visualBuilderDesc: 'Buat tombol alur kerja kustom dari aksi bawaan tanpa menulis DSL.',
            advancedDslName: 'Editor DSL lanjutan',
            advancedDslDesc: 'Opsional: edit langsung dengan format Button Name::action-a>action-b. Pembuat visual dan DSL tetap sinkron.',
            dslValidationName: 'Validasi DSL alur kerja',
            dslValidationDesc: 'Ditemukan {count} masalah. Baris tidak valid diabaikan saat sidebar dirender.',
            availableActionIdsName: 'ID aksi alur kerja yang tersedia',
            builderDslWarning: 'Terdeteksi {count} masalah DSL. Editor visual memuat status alur kerja fallback yang aman.',
            builderCardTitle: 'Alur kerja {index}',
            deleteButton: 'Hapus',
            workflowRemovedNotice: 'Alur kerja dihapus.',
            buttonNameLabel: 'Nama tombol',
            buttonNamePlaceholder: 'Alur kerja {index}',
            actionSequenceTitle: 'Urutan aksi',
            removeAction: 'Hapus',
            addAction: 'Tambah aksi',
            addWorkflow: 'Tambah alur kerja',
            workflowAddedNotice: 'Alur kerja ditambahkan.',
            resetDefault: 'Setel ulang ke default',
            resetDefaultNotice: 'Alur kerja satu klik bawaan dipulihkan.'
        }
    }
});

extendLocale(STRINGS_IT, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Strategia errori del workflow',
            errorStrategyDesc: 'Interrompi subito al primo passaggio fallito oppure continua e completa i passaggi rimanenti.',
            errorStrategyStop: 'Interrompi al primo errore',
            errorStrategyContinue: 'Continua in caso di errore',
            visualBuilderName: 'Builder visuale del workflow',
            visualBuilderDesc: 'Crea pulsanti di workflow personalizzati dalle azioni integrate senza scrivere DSL.',
            advancedDslName: 'Editor DSL avanzato',
            advancedDslDesc: 'Opzionale: modifica direttamente con il formato Button Name::action-a>action-b. Builder visuale e DSL restano sincronizzati.',
            dslValidationName: 'Validazione DSL del workflow',
            dslValidationDesc: 'Rilevati {count} problemi. Le righe non valide vengono ignorate nel rendering della barra laterale.',
            availableActionIdsName: 'ID azioni workflow disponibili',
            builderDslWarning: 'Rilevati {count} problemi DSL. L’editor visuale ha caricato uno stato workflow di fallback sicuro.',
            builderCardTitle: 'Flusso di lavoro {index}',
            deleteButton: 'Elimina',
            workflowRemovedNotice: 'Workflow rimosso.',
            buttonNameLabel: 'Nome pulsante',
            buttonNamePlaceholder: 'Flusso di lavoro {index}',
            actionSequenceTitle: 'Sequenza azioni',
            removeAction: 'Rimuovi',
            addAction: 'Aggiungi azione',
            addWorkflow: 'Aggiungi workflow',
            workflowAddedNotice: 'Workflow aggiunto.',
            resetDefault: 'Ripristina predefinito',
            resetDefaultNotice: 'Ripristinati i workflow predefiniti con un clic.'
        }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'ワークフローのエラー戦略',
            errorStrategyDesc: '最初の失敗ステップで直ちに停止するか、続行して残りのステップを完了します。',
            errorStrategyStop: '最初のエラーで停止',
            errorStrategyContinue: 'エラー時も続行',
            visualBuilderName: 'ビジュアルワークフロービルダー',
            visualBuilderDesc: 'DSL を書かずに組み込みアクションからカスタムワークフローボタンを作成します。',
            advancedDslName: '高度な DSL エディター',
            advancedDslDesc: '任意: Button Name::action-a>action-b 形式で直接編集します。ビジュアルビルダーと DSL は同期されたままです。',
            dslValidationName: 'ワークフロー DSL 検証',
            dslValidationDesc: '{count} 件の問題が見つかりました。無効な行はサイドバーの描画時に無視されます。',
            availableActionIdsName: '利用可能なワークフローアクション ID',
            builderDslWarning: '{count} 件の DSL 問題を検出しました。ビジュアルエディターは安全なフォールバック状態のワークフローを読み込みました。',
            builderCardTitle: 'ワークフロー {index}',
            deleteButton: '削除',
            workflowRemovedNotice: 'ワークフローを削除しました。',
            buttonNameLabel: 'ボタン名',
            buttonNamePlaceholder: 'ワークフロー {index}',
            actionSequenceTitle: 'アクション順序',
            removeAction: '削除',
            addAction: 'アクションを追加',
            addWorkflow: 'ワークフローを追加',
            workflowAddedNotice: 'ワークフローを追加しました。',
            resetDefault: 'デフォルトに戻す',
            resetDefaultNotice: 'デフォルトのワンクリックワークフローを復元しました。'
        }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        workflowBuilder: {
            errorStrategyName: '워크플로 오류 전략',
            errorStrategyDesc: '첫 번째 실패 단계에서 즉시 중지하거나 계속 진행하여 남은 단계를 완료합니다.',
            errorStrategyStop: '첫 번째 오류에서 중지',
            errorStrategyContinue: '오류가 있어도 계속',
            visualBuilderName: '시각적 워크플로 빌더',
            visualBuilderDesc: 'DSL을 작성하지 않고 기본 제공 작업으로 사용자 정의 워크플로 버튼을 만듭니다.',
            advancedDslName: '고급 DSL 편집기',
            advancedDslDesc: '선택 사항: Button Name::action-a>action-b 형식으로 직접 편집합니다. 시각적 빌더와 DSL은 계속 동기화됩니다.',
            dslValidationName: '워크플로 DSL 검증',
            dslValidationDesc: '{count}개의 문제가 발견되었습니다. 잘못된 줄은 사이드바 렌더링에서 무시됩니다.',
            availableActionIdsName: '사용 가능한 워크플로 작업 ID',
            builderDslWarning: '{count}개의 DSL 문제가 감지되었습니다. 시각적 편집기가 안전한 fallback 워크플로 상태를 불러왔습니다.',
            builderCardTitle: '워크플로 {index}',
            deleteButton: '삭제',
            workflowRemovedNotice: '워크플로를 제거했습니다.',
            buttonNameLabel: '버튼 이름',
            buttonNamePlaceholder: '워크플로 {index}',
            actionSequenceTitle: '작업 순서',
            removeAction: '제거',
            addAction: '작업 추가',
            addWorkflow: '워크플로 추가',
            workflowAddedNotice: '워크플로를 추가했습니다.',
            resetDefault: '기본값으로 재설정',
            resetDefaultNotice: '기본 원클릭 워크플로를 복원했습니다.'
        }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Werkstroomfoutstrategie',
            errorStrategyDesc: 'Stop direct bij de eerste mislukte stap, of ga door en voltooi de resterende stappen.',
            errorStrategyStop: 'Stop bij eerste fout',
            errorStrategyContinue: 'Ga door bij fout',
            visualBuilderName: 'Visuele werkstroombouwer',
            visualBuilderDesc: 'Maak aangepaste werkstroomknoppen van ingebouwde acties zonder DSL te schrijven.',
            advancedDslName: 'Geavanceerde DSL-editor',
            advancedDslDesc: 'Optioneel: bewerk direct met het formaat Button Name::action-a>action-b. De visuele bouwer en DSL blijven gesynchroniseerd.',
            dslValidationName: 'Workflow-DSL-validatie',
            dslValidationDesc: '{count} probleem/problemen gevonden. Ongeldige regels worden genegeerd bij het renderen van de zijbalk.',
            availableActionIdsName: 'Beschikbare workflow-actie-ID’s',
            builderDslWarning: '{count} DSL-probleem/problemen gedetecteerd. De visuele editor heeft een fallback-veilige workflowstatus geladen.',
            builderCardTitle: 'Werkstroom {index}',
            deleteButton: 'Verwijderen',
            workflowRemovedNotice: 'Werkstroom verwijderd.',
            buttonNameLabel: 'Knopnaam',
            buttonNamePlaceholder: 'Werkstroom {index}',
            actionSequenceTitle: 'Actiesequentie',
            removeAction: 'Verwijderen',
            addAction: 'Actie toevoegen',
            addWorkflow: 'Werkstroom toevoegen',
            workflowAddedNotice: 'Werkstroom toegevoegd.',
            resetDefault: 'Standaard herstellen',
            resetDefaultNotice: 'Standaard éénklik-werkstromen hersteld.'
        }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Strategia błędów workflow',
            errorStrategyDesc: 'Zatrzymaj się natychmiast przy pierwszym nieudanym kroku albo kontynuuj i zakończ pozostałe kroki.',
            errorStrategyStop: 'Zatrzymaj przy pierwszym błędzie',
            errorStrategyContinue: 'Kontynuuj mimo błędu',
            visualBuilderName: 'Wizualny kreator workflow',
            visualBuilderDesc: 'Twórz własne przyciski workflow z wbudowanych akcji bez pisania DSL.',
            advancedDslName: 'Zaawansowany edytor DSL',
            advancedDslDesc: 'Opcjonalnie: edytuj bezpośrednio w formacie Button Name::action-a>action-b. Kreator wizualny i DSL pozostają zsynchronizowane.',
            dslValidationName: 'Walidacja DSL workflow',
            dslValidationDesc: 'Znaleziono {count} problem(y). Nieprawidłowe linie są ignorowane podczas renderowania paska bocznego.',
            availableActionIdsName: 'Dostępne ID akcji workflow',
            builderDslWarning: 'Wykryto {count} problem(y) DSL. Edytor wizualny wczytał bezpieczny stan zapasowy workflow.',
            builderCardTitle: 'Przepływ pracy {index}',
            deleteButton: 'Usuń',
            workflowRemovedNotice: 'Workflow usunięto.',
            buttonNameLabel: 'Nazwa przycisku',
            buttonNamePlaceholder: 'Przepływ pracy {index}',
            actionSequenceTitle: 'Sekwencja akcji',
            removeAction: 'Usuń',
            addAction: 'Dodaj akcję',
            addWorkflow: 'Dodaj workflow',
            workflowAddedNotice: 'Workflow dodano.',
            resetDefault: 'Przywróć domyślne',
            resetDefaultNotice: 'Przywrócono domyślne workflow jednym kliknięciem.'
        }
    }
});

extendLocale(STRINGS_PT, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Estratégia de erro do fluxo de trabalho',
            errorStrategyDesc: 'Pare imediatamente na primeira etapa com falha, ou continue e conclua as etapas restantes.',
            errorStrategyStop: 'Parar no primeiro erro',
            errorStrategyContinue: 'Continuar com erro',
            visualBuilderName: 'Construtor visual de fluxo de trabalho',
            visualBuilderDesc: 'Crie botões de fluxo de trabalho personalizados a partir das ações integradas sem escrever DSL.',
            advancedDslName: 'Editor DSL avançado',
            advancedDslDesc: 'Opcional: edite diretamente com o formato Button Name::action-a>action-b. O construtor visual e o DSL mantêm-se sincronizados.',
            dslValidationName: 'Validação DSL do fluxo de trabalho',
            dslValidationDesc: 'Foram encontrados {count} problema(s). As linhas inválidas são ignoradas ao renderizar a barra lateral.',
            availableActionIdsName: 'IDs de ação de fluxo de trabalho disponíveis',
            builderDslWarning: 'Foram detetados {count} problema(s) de DSL. O editor visual carregou um estado de fluxo de trabalho seguro de fallback.',
            builderCardTitle: 'Fluxo de trabalho {index}',
            deleteButton: 'Eliminar',
            workflowRemovedNotice: 'Fluxo de trabalho removido.',
            buttonNameLabel: 'Nome do botão',
            buttonNamePlaceholder: 'Fluxo de trabalho {index}',
            actionSequenceTitle: 'Sequência de ações',
            removeAction: 'Remover',
            addAction: 'Adicionar ação',
            addWorkflow: 'Adicionar fluxo de trabalho',
            workflowAddedNotice: 'Fluxo de trabalho adicionado.',
            resetDefault: 'Repor predefinição',
            resetDefaultNotice: 'Os fluxos de trabalho predefinidos de um clique foram restaurados.'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    settings: {
        workflowBuilder: {
            errorStrategyName: 'Estratégia de erro do fluxo de trabalho',
            errorStrategyDesc: 'Pare imediatamente no primeiro passo com falha ou continue e conclua os passos restantes.',
            errorStrategyStop: 'Parar no primeiro erro',
            errorStrategyContinue: 'Continuar com erro',
            visualBuilderName: 'Construtor visual de fluxo de trabalho',
            visualBuilderDesc: 'Crie botões de fluxo de trabalho personalizados a partir das ações integradas sem escrever DSL.',
            advancedDslName: 'Editor DSL avançado',
            advancedDslDesc: 'Opcional: edite diretamente com o formato Button Name::action-a>action-b. O construtor visual e o DSL permanecem sincronizados.',
            dslValidationName: 'Validação DSL do fluxo de trabalho',
            dslValidationDesc: 'Foram encontrados {count} problema(s). Linhas inválidas são ignoradas ao renderizar a barra lateral.',
            availableActionIdsName: 'IDs de ação de fluxo de trabalho disponíveis',
            builderDslWarning: 'Foram detectados {count} problema(s) de DSL. O editor visual carregou um estado de fallback seguro do fluxo de trabalho.',
            builderCardTitle: 'Fluxo de trabalho {index}',
            deleteButton: 'Excluir',
            workflowRemovedNotice: 'Fluxo de trabalho removido.',
            buttonNameLabel: 'Nome do botão',
            buttonNamePlaceholder: 'Fluxo de trabalho {index}',
            actionSequenceTitle: 'Sequência de ações',
            removeAction: 'Remover',
            addAction: 'Adicionar ação',
            addWorkflow: 'Adicionar fluxo de trabalho',
            workflowAddedNotice: 'Fluxo de trabalho adicionado.',
            resetDefault: 'Restaurar padrão',
            resetDefaultNotice: 'Os fluxos de trabalho padrão de um clique foram restaurados.'
        }
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
    sidebar: {
        status: {
            workflowStart: 'Werkstroom: {name}',
            workflowComplete: 'Werkstroom "{name}" voltooid',
            workflowFailed: 'Werkstroom mislukt',
            workflowFailedLog: 'Werkstroom mislukt: {message}',
            workflowFinishedWithErrors: 'Werkstroom "{name}" voltooid met {count} fout(en)',
            stepLabel: '[{current}/{total}] Stap: {label}',
            stepLog: 'Stap {current}/{total}: {label}',
            processingActive: 'Verwerken... (Actief: {count})',
            timeRemaining: 'Geschatte resterende tijd: {time}',
            timeRemainingCalculating: 'Geschatte resterende tijd: berekenen...',
            stopped: 'Gestopt'
        },
        builtInActionsPrefix: 'Ingebouwde {category}-acties.',
        workflowFallbackWarning: 'De workflow-DSL heeft {count} probleem/problemen. De zijbalk gebruikt de standaardfallback.'
    },
    errorModal: {
        titles: {
            processing: 'Notemd-verwerkingsfout',
            batchProcessing: 'Notemd-batchverwerkingsfout',
            llmConnectionTest: 'LLM-verbindingsfout bij test',
            contentGeneration: 'Fout bij inhoudsgeneratie',
            batchGeneration: 'Notemd-batchgeneratiefout',
            duplicateCheckRemove: 'Fout bij controleren/verwijderen van duplicaten',
            batchMermaidFix: 'Notemd-batch-Mermaid-herstel fout',
            translation: 'Vertaalfout',
            conceptExtraction: 'Fout bij conceptextractie',
            batchConceptExtraction: 'Fout bij batch-conceptextractie',
            generic: 'Fout',
            extraction: 'Extractiefout'
        }
    }
});

extendLocale(STRINGS_PL, {
    sidebar: {
        status: {
            workflowStart: 'Przepływ: {name}',
            workflowComplete: 'Przepływ „{name}” ukończono',
            workflowFailed: 'Przepływ nie powiódł się',
            workflowFailedLog: 'Przepływ nie powiódł się: {message}',
            workflowFinishedWithErrors: 'Przepływ „{name}” zakończył się z {count} błędem/błędami',
            stepLabel: '[{current}/{total}] Krok: {label}',
            stepLog: 'Krok {current}/{total}: {label}',
            processingActive: 'Przetwarzanie... (Aktywne: {count})',
            timeRemaining: 'Szacowany pozostały czas: {time}',
            timeRemainingCalculating: 'Szacowany pozostały czas: obliczanie...',
            stopped: 'Zatrzymano'
        },
        builtInActionsPrefix: 'Wbudowane akcje {category}.',
        workflowFallbackWarning: 'DSL workflow zawiera {count} problem(y). Pasek boczny używa domyślnego fallbacku.'
    },
    errorModal: {
        titles: {
            processing: 'Błąd przetwarzania Notemd',
            batchProcessing: 'Błąd przetwarzania wsadowego Notemd',
            llmConnectionTest: 'Błąd testu połączenia LLM',
            contentGeneration: 'Błąd generowania treści',
            batchGeneration: 'Błąd generowania wsadowego Notemd',
            duplicateCheckRemove: 'Błąd sprawdzania/usuwania duplikatów',
            batchMermaidFix: 'Błąd wsadowej naprawy Mermaid w Notemd',
            translation: 'Błąd tłumaczenia',
            conceptExtraction: 'Błąd ekstrakcji pojęć',
            batchConceptExtraction: 'Błąd wsadowej ekstrakcji pojęć',
            generic: 'Błąd',
            extraction: 'Błąd ekstrakcji'
        }
    }
});

extendLocale(STRINGS_PT, {
    sidebar: {
        status: {
            workflowStart: 'Fluxo: {name}',
            workflowComplete: 'Fluxo "{name}" concluído',
            workflowFailed: 'Fluxo falhou',
            workflowFailedLog: 'Fluxo falhou: {message}',
            workflowFinishedWithErrors: 'Fluxo "{name}" terminou com {count} erro(s)',
            stepLabel: '[{current}/{total}] Etapa: {label}',
            stepLog: 'Etapa {current}/{total}: {label}',
            processingActive: 'A processar... (Ativos: {count})',
            timeRemaining: 'Tempo restante estimado: {time}',
            timeRemainingCalculating: 'Tempo restante estimado: a calcular...',
            stopped: 'Parado'
        },
        builtInActionsPrefix: 'Ações integradas de {category}.',
        workflowFallbackWarning: 'O DSL do fluxo de trabalho tem {count} problema(s). A barra lateral está a usar o fallback predefinido.'
    },
    errorModal: {
        titles: {
            processing: 'Erro de processamento do Notemd',
            batchProcessing: 'Erro de processamento em lote do Notemd',
            llmConnectionTest: 'Erro no teste de ligação LLM',
            contentGeneration: 'Erro de geração de conteúdo',
            batchGeneration: 'Erro de geração em lote do Notemd',
            duplicateCheckRemove: 'Erro de verificação/remoção de duplicados',
            batchMermaidFix: 'Erro de correção Mermaid em lote do Notemd',
            translation: 'Erro de tradução',
            conceptExtraction: 'Erro de extração de conceitos',
            batchConceptExtraction: 'Erro de extração de conceitos em lote',
            generic: 'Erro',
            extraction: 'Erro de extração'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    sidebar: {
        status: {
            workflowStart: 'Fluxo: {name}',
            workflowComplete: 'Fluxo "{name}" concluído',
            workflowFailed: 'Fluxo falhou',
            workflowFailedLog: 'Fluxo falhou: {message}',
            workflowFinishedWithErrors: 'Fluxo "{name}" terminou com {count} erro(s)',
            stepLabel: '[{current}/{total}] Etapa: {label}',
            stepLog: 'Etapa {current}/{total}: {label}',
            processingActive: 'Processando... (Ativos: {count})',
            timeRemaining: 'Tempo restante estimado: {time}',
            timeRemainingCalculating: 'Tempo restante estimado: calculando...',
            stopped: 'Parado'
        },
        builtInActionsPrefix: 'Ações integradas de {category}.',
        workflowFallbackWarning: 'O DSL do fluxo de trabalho tem {count} problema(s). A barra lateral está usando o fallback padrão.'
    },
    errorModal: {
        titles: {
            processing: 'Erro de processamento do Notemd',
            batchProcessing: 'Erro de processamento em lote do Notemd',
            llmConnectionTest: 'Erro no teste de conexão LLM',
            contentGeneration: 'Erro de geração de conteúdo',
            batchGeneration: 'Erro de geração em lote do Notemd',
            duplicateCheckRemove: 'Erro de verificação/remoção de duplicatas',
            batchMermaidFix: 'Erro de correção Mermaid em lote do Notemd',
            translation: 'Erro de tradução',
            conceptExtraction: 'Erro de extração de conceitos',
            batchConceptExtraction: 'Erro de extração de conceitos em lote',
            generic: 'Erro',
            extraction: 'Erro de extração'
        }
    }
});

extendLocale(STRINGS_RU, {
    sidebar: {
        status: {
            workflowStart: 'Сценарий: {name}',
            workflowComplete: 'Сценарий "{name}" завершён',
            workflowFailed: 'Сценарий завершился ошибкой',
            workflowFailedLog: 'Сценарий завершился ошибкой: {message}',
            workflowFinishedWithErrors: 'Сценарий "{name}" завершён, ошибок: {count}',
            stepLabel: '[{current}/{total}] Шаг: {label}',
            stepLog: 'Шаг {current}/{total}: {label}',
            processingActive: 'Обработка... (Активно: {count})',
            timeRemaining: 'Оценка оставшегося времени: {time}',
            timeRemainingCalculating: 'Оценка оставшегося времени: вычисление...',
            stopped: 'Остановлено'
        },
        builtInActionsPrefix: 'Встроенные действия категории {category}.',
        workflowFallbackWarning: 'В DSL workflow обнаружено {count} проблем. Боковая панель использует стандартный fallback.'
    },
    errorModal: {
        titles: {
            processing: 'Ошибка обработки Notemd',
            batchProcessing: 'Ошибка пакетной обработки Notemd',
            llmConnectionTest: 'Ошибка теста подключения LLM',
            contentGeneration: 'Ошибка генерации контента',
            batchGeneration: 'Ошибка пакетной генерации Notemd',
            duplicateCheckRemove: 'Ошибка проверки/удаления дубликатов',
            batchMermaidFix: 'Ошибка пакетного исправления Mermaid в Notemd',
            translation: 'Ошибка перевода',
            conceptExtraction: 'Ошибка извлечения концептов',
            batchConceptExtraction: 'Ошибка пакетного извлечения концептов',
            generic: 'Ошибка',
            extraction: 'Ошибка извлечения'
        }
    }
});

extendLocale(STRINGS_TH, {
    sidebar: {
        status: {
            workflowStart: 'เวิร์กโฟลว์: {name}',
            workflowComplete: 'เวิร์กโฟลว์ "{name}" เสร็จสมบูรณ์',
            workflowFailed: 'เวิร์กโฟลว์ล้มเหลว',
            workflowFailedLog: 'เวิร์กโฟลว์ล้มเหลว: {message}',
            workflowFinishedWithErrors: 'เวิร์กโฟลว์ "{name}" เสร็จสิ้นพร้อมข้อผิดพลาด {count} รายการ',
            stepLabel: '[{current}/{total}] ขั้นตอน: {label}',
            stepLog: 'ขั้นตอน {current}/{total}: {label}',
            processingActive: 'กำลังประมวลผล... (กำลังทำงาน: {count})',
            timeRemaining: 'เวลาคงเหลือโดยประมาณ: {time}',
            timeRemainingCalculating: 'เวลาคงเหลือโดยประมาณ: กำลังคำนวณ...',
            stopped: 'หยุดแล้ว'
        },
        builtInActionsPrefix: 'แอ็กชัน {category} ที่มีมาในตัว',
        workflowFallbackWarning: 'DSL ของเวิร์กโฟลว์มีปัญหา {count} รายการ แถบด้านข้างจึงใช้ fallback เริ่มต้น'
    },
    errorModal: {
        titles: {
            processing: 'ข้อผิดพลาดการประมวลผลของ Notemd',
            batchProcessing: 'ข้อผิดพลาดการประมวลผลแบบกลุ่มของ Notemd',
            llmConnectionTest: 'ข้อผิดพลาดการทดสอบการเชื่อมต่อ LLM',
            contentGeneration: 'ข้อผิดพลาดในการสร้างเนื้อหา',
            batchGeneration: 'ข้อผิดพลาดการสร้างแบบกลุ่มของ Notemd',
            duplicateCheckRemove: 'ข้อผิดพลาดในการตรวจสอบ/ลบรายการซ้ำ',
            batchMermaidFix: 'ข้อผิดพลาดการแก้ Mermaid แบบกลุ่มของ Notemd',
            translation: 'ข้อผิดพลาดการแปล',
            conceptExtraction: 'ข้อผิดพลาดการสกัดแนวคิด',
            batchConceptExtraction: 'ข้อผิดพลาดการสกัดแนวคิดแบบกลุ่ม',
            generic: 'ข้อผิดพลาด',
            extraction: 'ข้อผิดพลาดการสกัด'
        }
    }
});

extendLocale(STRINGS_TR, {
    sidebar: {
        status: {
            workflowStart: 'İş akışı: {name}',
            workflowComplete: '"{name}" iş akışı tamamlandı',
            workflowFailed: 'İş akışı başarısız oldu',
            workflowFailedLog: 'İş akışı başarısız oldu: {message}',
            workflowFinishedWithErrors: '"{name}" iş akışı {count} hata ile tamamlandı',
            stepLabel: '[{current}/{total}] Adım: {label}',
            stepLog: 'Adım {current}/{total}: {label}',
            processingActive: 'İşleniyor... (Etkin: {count})',
            timeRemaining: 'Tahmini kalan süre: {time}',
            timeRemainingCalculating: 'Tahmini kalan süre: hesaplanıyor...',
            stopped: 'Durduruldu'
        },
        builtInActionsPrefix: 'Yerleşik {category} eylemleri.',
        workflowFallbackWarning: 'İş akışı DSL’sinde {count} sorun var. Kenar çubuğu varsayılan fallback kullanıyor.'
    },
    errorModal: {
        titles: {
            processing: 'Notemd işleme hatası',
            batchProcessing: 'Notemd toplu işleme hatası',
            llmConnectionTest: 'LLM bağlantı testi hatası',
            contentGeneration: 'İçerik oluşturma hatası',
            batchGeneration: 'Notemd toplu üretim hatası',
            duplicateCheckRemove: 'Yinelenen kontrol/kaldırma hatası',
            batchMermaidFix: 'Notemd toplu Mermaid düzeltme hatası',
            translation: 'Çeviri hatası',
            conceptExtraction: 'Kavram çıkarma hatası',
            batchConceptExtraction: 'Toplu kavram çıkarma hatası',
            generic: 'Hata',
            extraction: 'Çıkarma hatası'
        }
    }
});

extendLocale(STRINGS_UK, {
    sidebar: {
        status: {
            workflowStart: 'Процес: {name}',
            workflowComplete: 'Процес "{name}" завершено',
            workflowFailed: 'Процес завершився з помилкою',
            workflowFailedLog: 'Процес завершився з помилкою: {message}',
            workflowFinishedWithErrors: 'Процес "{name}" завершено з {count} помилками',
            stepLabel: '[{current}/{total}] Крок: {label}',
            stepLog: 'Крок {current}/{total}: {label}',
            processingActive: 'Обробка... (Активно: {count})',
            timeRemaining: 'Оцінка залишкового часу: {time}',
            timeRemainingCalculating: 'Оцінка залишкового часу: обчислення...',
            stopped: 'Зупинено'
        },
        builtInActionsPrefix: 'Вбудовані дії категорії {category}.',
        workflowFallbackWarning: 'DSL workflow має {count} проблем. Бокова панель використовує стандартний fallback.'
    },
    errorModal: {
        titles: {
            processing: 'Помилка обробки Notemd',
            batchProcessing: 'Помилка пакетної обробки Notemd',
            llmConnectionTest: 'Помилка тесту підключення LLM',
            contentGeneration: 'Помилка генерації контенту',
            batchGeneration: 'Помилка пакетної генерації Notemd',
            duplicateCheckRemove: 'Помилка перевірки/видалення дублікатів',
            batchMermaidFix: 'Помилка пакетного виправлення Mermaid у Notemd',
            translation: 'Помилка перекладу',
            conceptExtraction: 'Помилка видобування концептів',
            batchConceptExtraction: 'Помилка пакетного видобування концептів',
            generic: 'Помилка',
            extraction: 'Помилка видобування'
        }
    }
});

extendLocale(STRINGS_VI, {
    sidebar: {
        status: {
            workflowStart: 'Quy trình: {name}',
            workflowComplete: 'Quy trình "{name}" đã hoàn tất',
            workflowFailed: 'Quy trình thất bại',
            workflowFailedLog: 'Quy trình thất bại: {message}',
            workflowFinishedWithErrors: 'Quy trình "{name}" hoàn tất với {count} lỗi',
            stepLabel: '[{current}/{total}] Bước: {label}',
            stepLog: 'Bước {current}/{total}: {label}',
            processingActive: 'Đang xử lý... (Đang hoạt động: {count})',
            timeRemaining: 'Thời gian còn lại ước tính: {time}',
            timeRemainingCalculating: 'Thời gian còn lại ước tính: đang tính...',
            stopped: 'Đã dừng'
        },
        builtInActionsPrefix: 'Các hành động {category} tích hợp sẵn.',
        workflowFallbackWarning: 'DSL quy trình có {count} vấn đề. Sidebar đang dùng fallback mặc định.'
    },
    errorModal: {
        titles: {
            processing: 'Lỗi xử lý Notemd',
            batchProcessing: 'Lỗi xử lý hàng loạt Notemd',
            llmConnectionTest: 'Lỗi kiểm tra kết nối LLM',
            contentGeneration: 'Lỗi tạo nội dung',
            batchGeneration: 'Lỗi tạo nội dung hàng loạt của Notemd',
            duplicateCheckRemove: 'Lỗi kiểm tra/xóa trùng lặp',
            batchMermaidFix: 'Lỗi sửa Mermaid hàng loạt của Notemd',
            translation: 'Lỗi dịch',
            conceptExtraction: 'Lỗi trích xuất khái niệm',
            batchConceptExtraction: 'Lỗi trích xuất khái niệm hàng loạt',
            generic: 'Lỗi',
            extraction: 'Lỗi trích xuất'
        }
    }
});

extendLocale(STRINGS_ES, {
    errorModal: {
        titles: {
            generic: 'Error general'
        }
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

extendLocale(STRINGS_AR, {
    settings: {
        providerConfig: {
            categoryCloud: 'سحابي',
            categoryGateway: 'بوابة',
            categoryLocal: 'محلي',
            categoryOther: 'مزوّد',
            presetSummaryTitle: 'الإعداد المسبق لـ {provider}',
            presetSummaryHint: 'نقطة النهاية الافتراضية: {baseUrl} · النموذج الافتراضي: {model}'
        },
        customPrompts: {
            taskToggleName: 'استخدام مطالبة مخصصة لـ "{task}"',
            taskToggleDesc: 'تشغيل: استخدم مطالبتك المخصصة أدناه لهذه المهمة. إيقاف: استخدم المطالبة الافتراضية.',
            copyDefaultButton: 'نسخ المطالبة الافتراضية',
            copyDefaultNotice: 'تم نسخ المطالبة الافتراضية إلى الحافظة!',
            defaultPromptLabel: 'المطالبة الافتراضية لـ "{task}":',
            customPromptName: 'مطالبة مخصصة لـ "{task}"',
            customPromptDesc: 'أدخل مطالبتك المخصصة. سيتم استبدال العناصر النائبة مثل {TITLE} أو {RESEARCH_CONTEXT_SECTION} عند الحاجة لهذه المهمة. راجع المطالبة الافتراضية لمعرفة العناصر المتاحة.',
            customPromptPlaceholder: 'أدخل مطالبتك المخصصة لـ {task}...'
        }
    }
});

extendLocale(STRINGS_DE, {
    settings: {
        providerConfig: {
            categoryCloud: 'Cloud-Dienst',
            categoryGateway: 'Gateway-Dienst',
            categoryLocal: 'Lokal',
            categoryOther: 'Anbieter',
            presetSummaryTitle: '{provider}-Voreinstellung',
            presetSummaryHint: 'Standard-Endpunkt: {baseUrl} · Standardmodell: {model}'
        },
        customPrompts: {
            taskToggleName: 'Benutzerdefinierten Prompt für "{task}" verwenden',
            taskToggleDesc: 'An: Verwenden Sie für diese Aufgabe Ihren benutzerdefinierten Prompt unten. Aus: Verwenden Sie den Standard-Prompt.',
            copyDefaultButton: 'Standard-Prompt kopieren',
            copyDefaultNotice: 'Standard-Prompt in die Zwischenablage kopiert!',
            defaultPromptLabel: 'Standard-Prompt für "{task}":',
            customPromptName: 'Benutzerdefinierter Prompt für "{task}"',
            customPromptDesc: 'Geben Sie Ihren benutzerdefinierten Prompt ein. Platzhalter wie {TITLE} oder {RESEARCH_CONTEXT_SECTION} werden ersetzt, sofern sie für die Aufgabe gelten. Hinweise auf verfügbare Platzhalter finden Sie im Standard-Prompt.',
            customPromptPlaceholder: 'Geben Sie Ihren benutzerdefinierten Prompt für {task} ein...'
        }
    }
});

extendLocale(STRINGS_ES, {
    settings: {
        providerConfig: {
            categoryCloud: 'Nube',
            categoryGateway: 'Pasarela',
            categoryLocal: 'Entorno local',
            categoryOther: 'Proveedor',
            presetSummaryTitle: 'Preajuste de {provider}',
            presetSummaryHint: 'Endpoint predeterminado: {baseUrl} · Modelo predeterminado: {model}'
        },
        customPrompts: {
            taskToggleName: 'Usar prompt personalizado para "{task}"',
            taskToggleDesc: 'Activado: usa tu prompt personalizado de abajo para esta tarea. Desactivado: usa el prompt predeterminado.',
            copyDefaultButton: 'Copiar prompt predeterminado',
            copyDefaultNotice: '¡Prompt predeterminado copiado al portapapeles!',
            defaultPromptLabel: 'Prompt predeterminado para "{task}":',
            customPromptName: 'Prompt personalizado para "{task}"',
            customPromptDesc: 'Introduce tu prompt personalizado. Los marcadores como {TITLE} o {RESEARCH_CONTEXT_SECTION} se sustituirán si aplican a la tarea. Consulta el prompt predeterminado para ver los marcadores disponibles.',
            customPromptPlaceholder: 'Introduce tu prompt personalizado para {task}...'
        }
    }
});

extendLocale(STRINGS_FA, {
    settings: {
        providerConfig: {
            categoryCloud: 'ابری',
            categoryGateway: 'درگاه',
            categoryLocal: 'محلی',
            categoryOther: 'ارائه‌دهنده',
            presetSummaryTitle: 'پیش‌تنظیم {provider}',
            presetSummaryHint: 'endpoint پیش‌فرض: {baseUrl} · مدل پیش‌فرض: {model}'
        },
        customPrompts: {
            taskToggleName: 'استفاده از پرامپت سفارشی برای "{task}"',
            taskToggleDesc: 'روشن: برای این کار از پرامپت سفارشی زیر استفاده شود. خاموش: از پرامپت پیش‌فرض استفاده شود.',
            copyDefaultButton: 'کپی پرامپت پیش‌فرض',
            copyDefaultNotice: 'پرامپت پیش‌فرض در کلیپ‌بورد کپی شد!',
            defaultPromptLabel: 'پرامپت پیش‌فرض برای "{task}":',
            customPromptName: 'پرامپت سفارشی برای "{task}"',
            customPromptDesc: 'پرامپت سفارشی خود را وارد کنید. placeholderهایی مانند {TITLE} یا {RESEARCH_CONTEXT_SECTION} در صورت نیاز برای این کار جایگزین می‌شوند. برای دیدن placeholderهای قابل استفاده به پرامپت پیش‌فرض مراجعه کنید.',
            customPromptPlaceholder: 'پرامپت سفارشی خود را برای {task} وارد کنید...'
        }
    }
});

extendLocale(STRINGS_FR, {
    settings: {
        providerConfig: {
            categoryCloud: 'Nuage',
            categoryGateway: 'Passerelle',
            categoryLocal: 'Machine locale',
            categoryOther: 'Fournisseur',
            presetSummaryTitle: 'Préréglage {provider}',
            presetSummaryHint: 'Point de terminaison par défaut : {baseUrl} · Modèle par défaut : {model}'
        },
        customPrompts: {
            taskToggleName: 'Utiliser un prompt personnalisé pour "{task}"',
            taskToggleDesc: 'Activé : utilisez votre prompt personnalisé ci-dessous pour cette tâche. Désactivé : utilisez le prompt par défaut.',
            copyDefaultButton: 'Copier le prompt par défaut',
            copyDefaultNotice: 'Prompt par défaut copié dans le presse-papiers !',
            defaultPromptLabel: 'Prompt par défaut pour "{task}" :',
            customPromptName: 'Prompt personnalisé pour "{task}"',
            customPromptDesc: 'Saisissez votre prompt personnalisé. Les espaces réservés comme {TITLE} ou {RESEARCH_CONTEXT_SECTION} seront remplacés s’ils s’appliquent à la tâche. Consultez le prompt par défaut pour voir les espaces réservés disponibles.',
            customPromptPlaceholder: 'Saisissez votre prompt personnalisé pour {task}...'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        providerConfig: {
            categoryCloud: 'Awan',
            categoryGateway: 'Gerbang',
            categoryLocal: 'Lokal',
            categoryOther: 'Penyedia',
            presetSummaryTitle: 'Preset {provider}',
            presetSummaryHint: 'Endpoint default: {baseUrl} · Model default: {model}'
        },
        customPrompts: {
            taskToggleName: 'Gunakan prompt kustom untuk "{task}"',
            taskToggleDesc: 'Aktif: gunakan prompt kustom Anda di bawah untuk tugas ini. Nonaktif: gunakan prompt default.',
            copyDefaultButton: 'Salin prompt default',
            copyDefaultNotice: 'Prompt default disalin ke clipboard!',
            defaultPromptLabel: 'Prompt default untuk "{task}":',
            customPromptName: 'Prompt kustom untuk "{task}"',
            customPromptDesc: 'Masukkan prompt kustom Anda. Placeholder seperti {TITLE} atau {RESEARCH_CONTEXT_SECTION} akan diganti jika berlaku untuk tugas ini. Lihat prompt default untuk mengetahui placeholder yang tersedia.',
            customPromptPlaceholder: 'Masukkan prompt kustom Anda untuk {task}...'
        }
    }
});

extendLocale(STRINGS_IT, {
    settings: {
        providerConfig: {
            categoryCloud: 'Servizio cloud',
            categoryGateway: 'Gateway API',
            categoryLocal: 'Locale',
            categoryOther: 'Fornitore',
            presetSummaryTitle: 'Preset {provider}',
            presetSummaryHint: 'Endpoint predefinito: {baseUrl} · Modello predefinito: {model}'
        },
        customPrompts: {
            taskToggleName: 'Usa un prompt personalizzato per "{task}"',
            taskToggleDesc: 'Attivo: usa il prompt personalizzato qui sotto per questa attività. Disattivo: usa il prompt predefinito.',
            copyDefaultButton: 'Copia prompt predefinito',
            copyDefaultNotice: 'Prompt predefinito copiato negli appunti!',
            defaultPromptLabel: 'Prompt predefinito per "{task}":',
            customPromptName: 'Prompt personalizzato per "{task}"',
            customPromptDesc: 'Inserisci il tuo prompt personalizzato. I segnaposto come {TITLE} o {RESEARCH_CONTEXT_SECTION} verranno sostituiti se applicabili all’attività. Consulta il prompt predefinito per i segnaposto disponibili.',
            customPromptPlaceholder: 'Inserisci il tuo prompt personalizzato per {task}...'
        }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        providerConfig: {
            categoryCloud: 'クラウド',
            categoryGateway: 'ゲートウェイ',
            categoryLocal: 'ローカル',
            categoryOther: 'プロバイダー',
            presetSummaryTitle: '{provider} プリセット',
            presetSummaryHint: '既定の endpoint: {baseUrl} · 既定のモデル: {model}'
        },
        customPrompts: {
            taskToggleName: '「{task}」にカスタムプロンプトを使う',
            taskToggleDesc: 'オン: このタスクでは下のカスタムプロンプトを使います。オフ: 既定のプロンプトを使います。',
            copyDefaultButton: '既定のプロンプトをコピー',
            copyDefaultNotice: '既定のプロンプトをクリップボードにコピーしました。',
            defaultPromptLabel: '「{task}」の既定プロンプト:',
            customPromptName: '「{task}」のカスタムプロンプト',
            customPromptDesc: 'カスタムプロンプトを入力してください。{TITLE} や {RESEARCH_CONTEXT_SECTION} などのプレースホルダーは、このタスクで使える場合に置き換えられます。利用できるプレースホルダーは既定のプロンプトを参照してください。',
            customPromptPlaceholder: '{task} 用のカスタムプロンプトを入力してください...'
        }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        providerConfig: {
            categoryCloud: '클라우드',
            categoryGateway: '게이트웨이',
            categoryLocal: '로컬',
            categoryOther: '프로바이더',
            presetSummaryTitle: '{provider} 프리셋',
            presetSummaryHint: '기본 endpoint: {baseUrl} · 기본 모델: {model}'
        },
        customPrompts: {
            taskToggleName: '"{task}"에 사용자 정의 프롬프트 사용',
            taskToggleDesc: '켜기: 이 작업에는 아래의 사용자 정의 프롬프트를 사용합니다. 끄기: 기본 프롬프트를 사용합니다.',
            copyDefaultButton: '기본 프롬프트 복사',
            copyDefaultNotice: '기본 프롬프트가 클립보드에 복사되었습니다!',
            defaultPromptLabel: '"{task}"의 기본 프롬프트:',
            customPromptName: '"{task}"의 사용자 정의 프롬프트',
            customPromptDesc: '사용자 정의 프롬프트를 입력하세요. {TITLE} 또는 {RESEARCH_CONTEXT_SECTION} 같은 placeholder는 이 작업에 적용될 때 치환됩니다. 사용 가능한 placeholder는 기본 프롬프트를 참고하세요.',
            customPromptPlaceholder: '{task}용 사용자 정의 프롬프트를 입력하세요...'
        }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        providerConfig: {
            categoryCloud: 'Cloudservice',
            categoryGateway: 'Gatewaydienst',
            categoryLocal: 'Lokaal',
            categoryOther: 'Aanbieder',
            presetSummaryTitle: 'Voorinstelling voor {provider}',
            presetSummaryHint: 'Standaard-endpoint: {baseUrl} · Standaardmodel: {model}'
        },
        customPrompts: {
            taskToggleName: 'Aangepaste prompt gebruiken voor "{task}"',
            taskToggleDesc: 'Aan: gebruik je aangepaste prompt hieronder voor deze taak. Uit: gebruik de standaardprompt.',
            copyDefaultButton: 'Standaardprompt kopiëren',
            copyDefaultNotice: 'Standaardprompt naar het klembord gekopieerd!',
            defaultPromptLabel: 'Standaardprompt voor "{task}":',
            customPromptName: 'Aangepaste prompt voor "{task}"',
            customPromptDesc: 'Voer je aangepaste prompt in. Plaatshouders zoals {TITLE} of {RESEARCH_CONTEXT_SECTION} worden vervangen als ze voor deze taak gelden. Zie de standaardprompt voor beschikbare plaatshouders.',
            customPromptPlaceholder: 'Voer je aangepaste prompt in voor {task}...'
        }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        providerConfig: {
            categoryCloud: 'Chmura',
            categoryGateway: 'Brama',
            categoryLocal: 'Lokalny',
            categoryOther: 'Dostawca',
            presetSummaryTitle: 'Ustawienie wstępne {provider}',
            presetSummaryHint: 'Domyślny endpoint: {baseUrl} · Domyślny model: {model}'
        },
        customPrompts: {
            taskToggleName: 'Użyj własnego promptu dla "{task}"',
            taskToggleDesc: 'Włączone: użyj poniżej własnego promptu dla tego zadania. Wyłączone: użyj domyślnego promptu.',
            copyDefaultButton: 'Kopiuj domyślny prompt',
            copyDefaultNotice: 'Domyślny prompt skopiowano do schowka!',
            defaultPromptLabel: 'Domyślny prompt dla "{task}":',
            customPromptName: 'Własny prompt dla "{task}"',
            customPromptDesc: 'Wprowadź własny prompt. Symbole zastępcze, takie jak {TITLE} lub {RESEARCH_CONTEXT_SECTION}, zostaną podmienione, jeśli mają zastosowanie do tego zadania. Sprawdź domyślny prompt, aby zobaczyć dostępne symbole zastępcze.',
            customPromptPlaceholder: 'Wprowadź własny prompt dla {task}...'
        }
    }
});

extendLocale(STRINGS_PT, {
    settings: {
        providerConfig: {
            categoryCloud: 'Nuvem',
            categoryGateway: 'Gateway de API',
            categoryLocal: 'Instância local',
            categoryOther: 'Fornecedor',
            presetSummaryTitle: 'Predefinição de {provider}',
            presetSummaryHint: 'Endpoint predefinido: {baseUrl} · Modelo predefinido: {model}'
        },
        customPrompts: {
            taskToggleName: 'Usar prompt personalizado para "{task}"',
            taskToggleDesc: 'Ativado: use o seu prompt personalizado abaixo para esta tarefa. Desativado: use o prompt predefinido.',
            copyDefaultButton: 'Copiar prompt predefinido',
            copyDefaultNotice: 'Prompt predefinido copiado para a área de transferência!',
            defaultPromptLabel: 'Prompt predefinido para "{task}":',
            customPromptName: 'Prompt personalizado para "{task}"',
            customPromptDesc: 'Introduza o seu prompt personalizado. Marcadores como {TITLE} ou {RESEARCH_CONTEXT_SECTION} serão substituídos quando se aplicarem a esta tarefa. Consulte o prompt predefinido para ver os marcadores disponíveis.',
            customPromptPlaceholder: 'Introduza o seu prompt personalizado para {task}...'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    settings: {
        providerConfig: {
            categoryCloud: 'Nuvem',
            categoryGateway: 'Gateway de API',
            categoryLocal: 'Instância local',
            categoryOther: 'Provedor',
            presetSummaryTitle: 'Predefinição de {provider}',
            presetSummaryHint: 'Endpoint padrão: {baseUrl} · Modelo padrão: {model}'
        },
        customPrompts: {
            taskToggleName: 'Usar prompt personalizado para "{task}"',
            taskToggleDesc: 'Ativado: use seu prompt personalizado abaixo para esta tarefa. Desativado: use o prompt padrão.',
            copyDefaultButton: 'Copiar prompt padrão',
            copyDefaultNotice: 'Prompt padrão copiado para a área de transferência!',
            defaultPromptLabel: 'Prompt padrão para "{task}":',
            customPromptName: 'Prompt personalizado para "{task}"',
            customPromptDesc: 'Digite seu prompt personalizado. Marcadores como {TITLE} ou {RESEARCH_CONTEXT_SECTION} serão substituídos quando se aplicarem a esta tarefa. Consulte o prompt padrão para ver os marcadores disponíveis.',
            customPromptPlaceholder: 'Digite seu prompt personalizado para {task}...'
        }
    }
});

extendLocale(STRINGS_RU, {
    settings: {
        providerConfig: {
            categoryCloud: 'Облачный',
            categoryGateway: 'Шлюз',
            categoryLocal: 'Локальный',
            categoryOther: 'Провайдер',
            presetSummaryTitle: 'Предустановка {provider}',
            presetSummaryHint: 'Базовый endpoint: {baseUrl} · Модель по умолчанию: {model}'
        },
        customPrompts: {
            taskToggleName: 'Использовать пользовательский prompt для "{task}"',
            taskToggleDesc: 'Вкл.: использовать ваш пользовательский prompt ниже для этой задачи. Выкл.: использовать стандартный prompt.',
            copyDefaultButton: 'Скопировать стандартный prompt',
            copyDefaultNotice: 'Стандартный prompt скопирован в буфер обмена!',
            defaultPromptLabel: 'Стандартный prompt для "{task}":',
            customPromptName: 'Пользовательский prompt для "{task}"',
            customPromptDesc: 'Введите свой пользовательский prompt. Плейсхолдеры вроде {TITLE} или {RESEARCH_CONTEXT_SECTION} будут заменены, если они применимы к этой задаче. Доступные плейсхолдеры смотрите в стандартном prompt.',
            customPromptPlaceholder: 'Введите пользовательский prompt для {task}...'
        }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        providerConfig: {
            categoryCloud: 'คลาวด์',
            categoryGateway: 'เกตเวย์',
            categoryLocal: 'ภายในเครื่อง',
            categoryOther: 'ผู้ให้บริการ',
            presetSummaryTitle: 'พรีเซ็ต {provider}',
            presetSummaryHint: 'endpoint เริ่มต้น: {baseUrl} · โมเดลเริ่มต้น: {model}'
        },
        customPrompts: {
            taskToggleName: 'ใช้พรอมป์ต์แบบกำหนดเองสำหรับ "{task}"',
            taskToggleDesc: 'เปิด: ใช้พรอมป์ต์แบบกำหนดเองด้านล่างสำหรับงานนี้ ปิด: ใช้พรอมป์ต์เริ่มต้น',
            copyDefaultButton: 'คัดลอกพรอมป์ต์เริ่มต้น',
            copyDefaultNotice: 'คัดลอกพรอมป์ต์เริ่มต้นไปยังคลิปบอร์ดแล้ว!',
            defaultPromptLabel: 'พรอมป์ต์เริ่มต้นสำหรับ "{task}":',
            customPromptName: 'พรอมป์ต์แบบกำหนดเองสำหรับ "{task}"',
            customPromptDesc: 'ป้อนพรอมป์ต์แบบกำหนดเองของคุณ placeholder อย่าง {TITLE} หรือ {RESEARCH_CONTEXT_SECTION} จะถูกแทนที่เมื่อใช้ได้กับงานนี้ ดูพรอมป์ต์เริ่มต้นเพื่อดู placeholder ที่รองรับ',
            customPromptPlaceholder: 'ป้อนพรอมป์ต์แบบกำหนดเองของคุณสำหรับ {task}...'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        providerConfig: {
            categoryCloud: 'Bulut',
            categoryGateway: 'Ağ geçidi',
            categoryLocal: 'Yerel',
            categoryOther: 'Sağlayıcı',
            presetSummaryTitle: '{provider} ön ayarı',
            presetSummaryHint: 'Varsayılan endpoint: {baseUrl} · Varsayılan model: {model}'
        },
        customPrompts: {
            taskToggleName: '"{task}" için özel istem kullan',
            taskToggleDesc: 'Açık: bu görev için aşağıdaki özel isteminizi kullanın. Kapalı: varsayılan istemi kullanın.',
            copyDefaultButton: 'Varsayılan istemi kopyala',
            copyDefaultNotice: 'Varsayılan istem panoya kopyalandı!',
            defaultPromptLabel: '"{task}" için varsayılan istem:',
            customPromptName: '"{task}" için özel istem',
            customPromptDesc: 'Özel isteminizi girin. {TITLE} veya {RESEARCH_CONTEXT_SECTION} gibi placeholderlar bu görev için uygunsa değiştirilir. Kullanılabilir placeholderlar için varsayılan isteme bakın.',
            customPromptPlaceholder: '{task} için özel isteminizi girin...'
        }
    }
});

extendLocale(STRINGS_UK, {
    settings: {
        providerConfig: {
            categoryCloud: 'Хмарний',
            categoryGateway: 'Шлюз',
            categoryLocal: 'Локальний',
            categoryOther: 'Провайдер',
            presetSummaryTitle: 'Попереднє налаштування {provider}',
            presetSummaryHint: 'Типовий endpoint: {baseUrl} · Типова модель: {model}'
        },
        customPrompts: {
            taskToggleName: 'Використовувати власний prompt для "{task}"',
            taskToggleDesc: 'Увімкнено: використовувати ваш власний prompt нижче для цього завдання. Вимкнено: використовувати стандартний prompt.',
            copyDefaultButton: 'Скопіювати стандартний prompt',
            copyDefaultNotice: 'Стандартний prompt скопійовано до буфера обміну!',
            defaultPromptLabel: 'Стандартний prompt для "{task}":',
            customPromptName: 'Власний prompt для "{task}"',
            customPromptDesc: 'Введіть власний prompt. Плейсхолдери на кшталт {TITLE} або {RESEARCH_CONTEXT_SECTION} буде замінено, якщо вони застосовні до цього завдання. Дивіться стандартний prompt, щоб побачити доступні плейсхолдери.',
            customPromptPlaceholder: 'Введіть власний prompt для {task}...'
        }
    }
});

extendLocale(STRINGS_VI, {
    settings: {
        providerConfig: {
            categoryCloud: 'Đám mây',
            categoryGateway: 'Cổng',
            categoryLocal: 'Cục bộ',
            categoryOther: 'Nhà cung cấp',
            presetSummaryTitle: 'Thiết lập sẵn {provider}',
            presetSummaryHint: 'Endpoint mặc định: {baseUrl} · Mô hình mặc định: {model}'
        },
        customPrompts: {
            taskToggleName: 'Dùng prompt tùy chỉnh cho "{task}"',
            taskToggleDesc: 'Bật: dùng prompt tùy chỉnh bên dưới cho tác vụ này. Tắt: dùng prompt mặc định.',
            copyDefaultButton: 'Sao chép prompt mặc định',
            copyDefaultNotice: 'Đã sao chép prompt mặc định vào bộ nhớ tạm!',
            defaultPromptLabel: 'Prompt mặc định cho "{task}":',
            customPromptName: 'Prompt tùy chỉnh cho "{task}"',
            customPromptDesc: 'Nhập prompt tùy chỉnh của bạn. Các placeholder như {TITLE} hoặc {RESEARCH_CONTEXT_SECTION} sẽ được thay thế nếu áp dụng cho tác vụ này. Hãy xem prompt mặc định để biết các placeholder có sẵn.',
            customPromptPlaceholder: 'Nhập prompt tùy chỉnh của bạn cho {task}...'
        }
    }
});

extendLocale(STRINGS_AR, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'يعالج الملف الحالي وينشئ روابط ويكي/ملاحظات مفاهيم.' },
            processFolderAddLinks: { tooltip: 'يعالج جميع الملاحظات المؤهلة داخل مجلد.' },
            generateFromTitle: { tooltip: 'ينشئ محتوى الملاحظة من عنوان الملاحظة الحالية.' },
            batchGenerateFromTitles: { tooltip: 'ينشئ المحتوى دفعيًا من عناوين الملاحظات داخل مجلد.' },
            researchAndSummarize: { tooltip: 'يبحث في الموضوع/العنوان المحدد ويُلحق ملخصًا.' },
            summarizeAsMermaid: { tooltip: 'ينشئ ملخصًا على شكل مخطط Mermaid من الملاحظة الحالية.' },
            translateCurrentFile: { tooltip: 'يترجم الملف النشط إلى لغة الإخراج المحددة.' },
            batchTranslateFolder: { tooltip: 'يترجم جميع ملفات Markdown داخل مجلد.' },
            extractConceptsCurrent: { tooltip: 'يستخرج المفاهيم من الملف الحالي فقط.' },
            extractConceptsFolder: { tooltip: 'يستخرج المفاهيم من كل ملف داخل مجلد محدد.' },
            extractOriginalText: { tooltip: 'يستخرج مقتطفات حرفية من المصدر للأسئلة المُعدّة.' },
            batchMermaidFix: { tooltip: 'يشغّل إصلاحًا دفعيًا لصياغة Mermaid/LaTeX على المجلد المحدد.' },
            fixFormulaCurrent: { tooltip: 'يوحّد محددات الصيغ في الملف الحالي.' },
            batchFixFormula: { tooltip: 'يوحّد محددات الصيغ عبر المجلد المحدد.' },
            checkDuplicatesCurrent: { tooltip: 'يكتشف المصطلحات المكررة في الملف الحالي.' },
            checkRemoveDuplicateConcepts: { tooltip: 'يكتشف ملاحظات المفاهيم المكررة ويزيلها.' },
            testLlmConnection: { tooltip: 'يختبر اتصال المزوّد النشط وبيانات الاعتماد الخاصة به.' }
        }
    }
});

extendLocale(STRINGS_DE, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Verarbeitet die aktuelle Datei und erstellt Wiki-Links/Konzeptnotizen.' },
            processFolderAddLinks: { tooltip: 'Verarbeitet alle geeigneten Notizen in einem Ordner.' },
            generateFromTitle: { tooltip: 'Erzeugt Notizinhalte aus dem Titel der aktuellen Notiz.' },
            batchGenerateFromTitles: { tooltip: 'Erzeugt Inhalte stapelweise aus Notiztiteln in einem Ordner.' },
            researchAndSummarize: { tooltip: 'Recherchiert das ausgewählte Thema/den Titel und hängt eine Zusammenfassung an.' },
            summarizeAsMermaid: { tooltip: 'Erstellt eine Mermaid-Diagrammzusammenfassung aus der aktuellen Notiz.' },
            translateCurrentFile: { tooltip: 'Übersetzt die aktive Datei in die ausgewählte Ausgabesprache.' },
            batchTranslateFolder: { tooltip: 'Übersetzt alle Markdown-Dateien in einem Ordner.' },
            extractConceptsCurrent: { tooltip: 'Extrahiert Konzepte nur aus der aktuellen Datei.' },
            extractConceptsFolder: { tooltip: 'Extrahiert Konzepte aus jeder Datei in einem ausgewählten Ordner.' },
            extractOriginalText: { tooltip: 'Extrahiert wortgetreue Quellauszüge für konfigurierte Fragen.' },
            batchMermaidFix: { tooltip: 'Führt die Stapel-Syntaxkorrektur für Mermaid/LaTeX im ausgewählten Ordner aus.' },
            fixFormulaCurrent: { tooltip: 'Normalisiert Formeldelimiter in der aktuellen Datei.' },
            batchFixFormula: { tooltip: 'Normalisiert Formeldelimiter in einem ausgewählten Ordner.' },
            checkDuplicatesCurrent: { tooltip: 'Erkennt doppelte Begriffe in der aktuellen Datei.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Erkennt und entfernt doppelte Konzeptnotizen.' },
            testLlmConnection: { tooltip: 'Testet Verbindung und Zugangsdaten des aktiven Anbieters.' }
        }
    }
});

extendLocale(STRINGS_ES, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Procesa el archivo actual y crea wiki-links/notas de concepto.' },
            processFolderAddLinks: { tooltip: 'Procesa todas las notas compatibles de una carpeta.' },
            generateFromTitle: { tooltip: 'Genera contenido de nota a partir del título de la nota actual.' },
            batchGenerateFromTitles: { tooltip: 'Genera en lote contenido a partir de títulos de notas en una carpeta.' },
            researchAndSummarize: { tooltip: 'Investiga el tema/título seleccionado y añade un resumen.' },
            summarizeAsMermaid: { tooltip: 'Genera un resumen en diagrama Mermaid a partir de la nota actual.' },
            translateCurrentFile: { tooltip: 'Traduce el archivo activo al idioma de salida seleccionado.' },
            batchTranslateFolder: { tooltip: 'Traduce todos los archivos Markdown de una carpeta.' },
            extractConceptsCurrent: { tooltip: 'Extrae conceptos solo del archivo actual.' },
            extractConceptsFolder: { tooltip: 'Extrae conceptos de cada archivo de una carpeta seleccionada.' },
            extractOriginalText: { tooltip: 'Extrae fragmentos literales del texto fuente para las preguntas configuradas.' },
            batchMermaidFix: { tooltip: 'Ejecuta la corrección por lotes de sintaxis Mermaid/LaTeX en la carpeta seleccionada.' },
            fixFormulaCurrent: { tooltip: 'Normaliza los delimitadores de fórmulas en el archivo actual.' },
            batchFixFormula: { tooltip: 'Normaliza los delimitadores de fórmulas en una carpeta seleccionada.' },
            checkDuplicatesCurrent: { tooltip: 'Detecta términos duplicados en el archivo actual.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Detecta y elimina notas de concepto duplicadas.' },
            testLlmConnection: { tooltip: 'Prueba la conexión y las credenciales del proveedor activo.' }
        }
    }
});

extendLocale(STRINGS_FA, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'فایل فعلی را پردازش می‌کند و ویکی‌لینک/یادداشت مفهومی می‌سازد.' },
            processFolderAddLinks: { tooltip: 'همهٔ یادداشت‌های واجد شرایط را در یک پوشه پردازش می‌کند.' },
            generateFromTitle: { tooltip: 'محتوای یادداشت را از عنوان یادداشت فعلی تولید می‌کند.' },
            batchGenerateFromTitles: { tooltip: 'محتوا را به‌صورت دسته‌ای از عنوان یادداشت‌ها در یک پوشه تولید می‌کند.' },
            researchAndSummarize: { tooltip: 'موضوع/عنوان انتخاب‌شده را پژوهش می‌کند و خلاصه را می‌افزاید.' },
            summarizeAsMermaid: { tooltip: 'از یادداشت فعلی خلاصهٔ نمودار Mermaid تولید می‌کند.' },
            translateCurrentFile: { tooltip: 'فایل فعال را به زبان خروجی انتخاب‌شده ترجمه می‌کند.' },
            batchTranslateFolder: { tooltip: 'همهٔ فایل‌های Markdown را در یک پوشه ترجمه می‌کند.' },
            extractConceptsCurrent: { tooltip: 'فقط از فایل فعلی مفهوم‌ها را استخراج می‌کند.' },
            extractConceptsFolder: { tooltip: 'از هر فایل در پوشهٔ انتخاب‌شده مفهوم‌ها را استخراج می‌کند.' },
            extractOriginalText: { tooltip: 'برای پرسش‌های پیکربندی‌شده، گزیده‌های لفظ‌به‌لفظ منبع را استخراج می‌کند.' },
            batchMermaidFix: { tooltip: 'اصلاح نحوی دسته‌ای Mermaid/LaTeX را روی پوشهٔ انتخاب‌شده اجرا می‌کند.' },
            fixFormulaCurrent: { tooltip: 'جداکننده‌های فرمول را در فایل فعلی نرمال‌سازی می‌کند.' },
            batchFixFormula: { tooltip: 'جداکننده‌های فرمول را در سراسر پوشهٔ انتخاب‌شده نرمال‌سازی می‌کند.' },
            checkDuplicatesCurrent: { tooltip: 'اصطلاحات تکراری را در فایل فعلی تشخیص می‌دهد.' },
            checkRemoveDuplicateConcepts: { tooltip: 'یادداشت‌های مفهومی تکراری را تشخیص می‌دهد و حذف می‌کند.' },
            testLlmConnection: { tooltip: 'اتصال و اطلاعات کاربری ارائه‌دهندهٔ فعال را آزمایش می‌کند.' }
        }
    }
});

extendLocale(STRINGS_FR, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Traite le fichier actuel et crée des wikiliens/notes de concept.' },
            processFolderAddLinks: { tooltip: 'Traite toutes les notes admissibles d’un dossier.' },
            generateFromTitle: { tooltip: 'Génère le contenu de la note à partir du titre de la note actuelle.' },
            batchGenerateFromTitles: { tooltip: 'Génère en lot du contenu à partir des titres de notes d’un dossier.' },
            researchAndSummarize: { tooltip: 'Recherche le sujet/titre sélectionné et ajoute un résumé.' },
            summarizeAsMermaid: { tooltip: 'Génère un résumé en diagramme Mermaid à partir de la note actuelle.' },
            translateCurrentFile: { tooltip: 'Traduit le fichier actif dans la langue de sortie sélectionnée.' },
            batchTranslateFolder: { tooltip: 'Traduit tous les fichiers Markdown d’un dossier.' },
            extractConceptsCurrent: { tooltip: 'Extrait les concepts uniquement du fichier actuel.' },
            extractConceptsFolder: { tooltip: 'Extrait les concepts de chaque fichier d’un dossier sélectionné.' },
            extractOriginalText: { tooltip: 'Extrait des passages sources verbatim pour les questions configurées.' },
            batchMermaidFix: { tooltip: 'Exécute la correction syntaxique Mermaid/LaTeX par lot sur le dossier sélectionné.' },
            fixFormulaCurrent: { tooltip: 'Normalise les délimiteurs de formules dans le fichier actuel.' },
            batchFixFormula: { tooltip: 'Normalise les délimiteurs de formules dans un dossier sélectionné.' },
            checkDuplicatesCurrent: { tooltip: 'Détecte les termes en double dans le fichier actuel.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Détecte et supprime les notes de concept en double.' },
            testLlmConnection: { tooltip: 'Teste la connexion et les identifiants du fournisseur actif.' }
        }
    }
});

extendLocale(STRINGS_ID, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Memproses file saat ini dan membuat tautan wiki/catatan konsep.' },
            processFolderAddLinks: { tooltip: 'Memproses semua catatan yang memenuhi syarat dalam folder.' },
            generateFromTitle: { tooltip: 'Membuat konten catatan dari judul catatan saat ini.' },
            batchGenerateFromTitles: { tooltip: 'Membuat konten secara batch dari judul catatan dalam folder.' },
            researchAndSummarize: { tooltip: 'Meneliti topik/judul yang dipilih dan menambahkan ringkasan.' },
            summarizeAsMermaid: { tooltip: 'Membuat ringkasan diagram Mermaid dari catatan saat ini.' },
            translateCurrentFile: { tooltip: 'Menerjemahkan file aktif ke bahasa keluaran yang dipilih.' },
            batchTranslateFolder: { tooltip: 'Menerjemahkan semua file Markdown dalam folder.' },
            extractConceptsCurrent: { tooltip: 'Mengekstrak konsep hanya dari file saat ini.' },
            extractConceptsFolder: { tooltip: 'Mengekstrak konsep dari setiap file dalam folder yang dipilih.' },
            extractOriginalText: { tooltip: 'Mengekstrak kutipan sumber verbatim untuk pertanyaan yang dikonfigurasi.' },
            batchMermaidFix: { tooltip: 'Menjalankan perbaikan sintaks batch Mermaid/LaTeX pada folder yang dipilih.' },
            fixFormulaCurrent: { tooltip: 'Menormalkan delimiter formula dalam file saat ini.' },
            batchFixFormula: { tooltip: 'Menormalkan delimiter formula di seluruh folder yang dipilih.' },
            checkDuplicatesCurrent: { tooltip: 'Mendeteksi istilah duplikat dalam file saat ini.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Mendeteksi dan menghapus catatan konsep duplikat.' },
            testLlmConnection: { tooltip: 'Menguji koneksi dan kredensial penyedia aktif.' }
        }
    }
});

extendLocale(STRINGS_IT, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Elabora il file corrente e crea wiki-link/note concetto.' },
            processFolderAddLinks: { tooltip: 'Elabora tutte le note idonee in una cartella.' },
            generateFromTitle: { tooltip: 'Genera il contenuto della nota dal titolo della nota corrente.' },
            batchGenerateFromTitles: { tooltip: 'Genera in batch contenuti dai titoli delle note in una cartella.' },
            researchAndSummarize: { tooltip: 'Esegue ricerche sul tema/titolo selezionato e aggiunge un riepilogo.' },
            summarizeAsMermaid: { tooltip: 'Genera un riepilogo in diagramma Mermaid dalla nota corrente.' },
            translateCurrentFile: { tooltip: 'Traduce il file attivo nella lingua di output selezionata.' },
            batchTranslateFolder: { tooltip: 'Traduce tutti i file Markdown in una cartella.' },
            extractConceptsCurrent: { tooltip: 'Estrae concetti solo dal file corrente.' },
            extractConceptsFolder: { tooltip: 'Estrae concetti da ogni file in una cartella selezionata.' },
            extractOriginalText: { tooltip: 'Estrae estratti testuali letterali dal testo sorgente per le domande configurate.' },
            batchMermaidFix: { tooltip: 'Esegue la correzione batch della sintassi Mermaid/LaTeX sulla cartella selezionata.' },
            fixFormulaCurrent: { tooltip: 'Normalizza i delimitatori delle formule nel file corrente.' },
            batchFixFormula: { tooltip: 'Normalizza i delimitatori delle formule in una cartella selezionata.' },
            checkDuplicatesCurrent: { tooltip: 'Rileva termini duplicati nel file corrente.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Rileva e rimuove note concetto duplicate.' },
            testLlmConnection: { tooltip: 'Testa la connessione e le credenziali del provider attivo.' }
        }
    }
});

extendLocale(STRINGS_JA, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: '現在のファイルを処理し、Wiki リンクと概念ノートを作成します。' },
            processFolderAddLinks: { tooltip: 'フォルダー内の対象ノートをすべて処理します。' },
            generateFromTitle: { tooltip: '現在のノートタイトルからノート内容を生成します。' },
            batchGenerateFromTitles: { tooltip: 'フォルダー内のノートタイトルから内容を一括生成します。' },
            researchAndSummarize: { tooltip: '選択したトピックまたはタイトルを調査し、要約を追記します。' },
            summarizeAsMermaid: { tooltip: '現在のノートから Mermaid 図の要約を生成します。' },
            translateCurrentFile: { tooltip: 'アクティブなファイルを選択した出力言語に翻訳します。' },
            batchTranslateFolder: { tooltip: 'フォルダー内のすべての Markdown ファイルを翻訳します。' },
            extractConceptsCurrent: { tooltip: '現在のファイルからのみ概念を抽出します。' },
            extractConceptsFolder: { tooltip: '選択したフォルダー内のすべてのファイルから概念を抽出します。' },
            extractOriginalText: { tooltip: '設定した質問に対する原文抜粋をそのまま抽出します。' },
            batchMermaidFix: { tooltip: '選択したフォルダーで Mermaid/LaTeX の構文修正を一括実行します。' },
            fixFormulaCurrent: { tooltip: '現在のファイル内の数式区切り記号を正規化します。' },
            batchFixFormula: { tooltip: '選択したフォルダー全体の数式区切り記号を正規化します。' },
            checkDuplicatesCurrent: { tooltip: '現在のファイル内の重複語句を検出します。' },
            checkRemoveDuplicateConcepts: { tooltip: '重複した概念ノートを検出して削除します。' },
            testLlmConnection: { tooltip: 'アクティブなプロバイダーの接続と認証情報をテストします。' }
        }
    }
});

extendLocale(STRINGS_KO, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: '현재 파일을 처리하고 위키 링크/개념 노트를 생성합니다.' },
            processFolderAddLinks: { tooltip: '폴더의 모든 대상 노트를 처리합니다.' },
            generateFromTitle: { tooltip: '현재 노트 제목에서 노트 콘텐츠를 생성합니다.' },
            batchGenerateFromTitles: { tooltip: '폴더 내 노트 제목에서 콘텐츠를 일괄 생성합니다.' },
            researchAndSummarize: { tooltip: '선택한 주제/제목을 조사하고 요약을 덧붙입니다.' },
            summarizeAsMermaid: { tooltip: '현재 노트에서 Mermaid 다이어그램 요약을 생성합니다.' },
            translateCurrentFile: { tooltip: '활성 파일을 선택한 출력 언어로 번역합니다.' },
            batchTranslateFolder: { tooltip: '폴더의 모든 Markdown 파일을 번역합니다.' },
            extractConceptsCurrent: { tooltip: '현재 파일에서만 개념을 추출합니다.' },
            extractConceptsFolder: { tooltip: '선택한 폴더의 모든 파일에서 개념을 추출합니다.' },
            extractOriginalText: { tooltip: '구성된 질문에 대한 원문 발췌를 그대로 추출합니다.' },
            batchMermaidFix: { tooltip: '선택한 폴더에 Mermaid/LaTeX 일괄 구문 수정을 실행합니다.' },
            fixFormulaCurrent: { tooltip: '현재 파일의 수식 구분자를 정규화합니다.' },
            batchFixFormula: { tooltip: '선택한 폴더 전체의 수식 구분자를 정규화합니다.' },
            checkDuplicatesCurrent: { tooltip: '현재 파일의 중복 용어를 감지합니다.' },
            checkRemoveDuplicateConcepts: { tooltip: '중복된 개념 노트를 감지하고 제거합니다.' },
            testLlmConnection: { tooltip: '활성 공급자의 연결과 자격 증명을 테스트합니다.' }
        }
    }
});

extendLocale(STRINGS_NL, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Verwerkt het huidige bestand en maakt wiki-links/conceptnotities.' },
            processFolderAddLinks: { tooltip: 'Verwerkt alle geschikte notities in een map.' },
            generateFromTitle: { tooltip: 'Genereert notitie-inhoud op basis van de titel van de huidige notitie.' },
            batchGenerateFromTitles: { tooltip: 'Genereert batchgewijs inhoud uit notitietitels in een map.' },
            researchAndSummarize: { tooltip: 'Onderzoekt het geselecteerde onderwerp/de geselecteerde titel en voegt een samenvatting toe.' },
            summarizeAsMermaid: { tooltip: 'Genereert een Mermaid-diagramsamenvatting uit de huidige notitie.' },
            translateCurrentFile: { tooltip: 'Vertaalt het actieve bestand naar de geselecteerde uitvoertaal.' },
            batchTranslateFolder: { tooltip: 'Vertaalt alle Markdown-bestanden in een map.' },
            extractConceptsCurrent: { tooltip: 'Extraheert concepten alleen uit het huidige bestand.' },
            extractConceptsFolder: { tooltip: 'Extraheert concepten uit elk bestand in een geselecteerde map.' },
            extractOriginalText: { tooltip: 'Extraheert letterlijke bronfragmenten voor geconfigureerde vragen.' },
            batchMermaidFix: { tooltip: 'Voert de batch-syntaxisreparatie voor Mermaid/LaTeX uit op de geselecteerde map.' },
            fixFormulaCurrent: { tooltip: 'Normaliseert formulescheidingstekens in het huidige bestand.' },
            batchFixFormula: { tooltip: 'Normaliseert formulescheidingstekens in een geselecteerde map.' },
            checkDuplicatesCurrent: { tooltip: 'Detecteert dubbele termen in het huidige bestand.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Detecteert en verwijdert dubbele conceptnotities.' },
            testLlmConnection: { tooltip: 'Test de verbinding en inloggegevens van de actieve provider.' }
        }
    }
});

extendLocale(STRINGS_PL, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Przetwarza bieżący plik i tworzy wiki-linki/notatki pojęciowe.' },
            processFolderAddLinks: { tooltip: 'Przetwarza wszystkie kwalifikujące się notatki w folderze.' },
            generateFromTitle: { tooltip: 'Generuje treść notatki na podstawie tytułu bieżącej notatki.' },
            batchGenerateFromTitles: { tooltip: 'Wsadowo generuje treść z tytułów notatek w folderze.' },
            researchAndSummarize: { tooltip: 'Bada wybrany temat/tytuł i dopisuje podsumowanie.' },
            summarizeAsMermaid: { tooltip: 'Generuje podsumowanie diagramu Mermaid z bieżącej notatki.' },
            translateCurrentFile: { tooltip: 'Tłumaczy aktywny plik na wybrany język wyjściowy.' },
            batchTranslateFolder: { tooltip: 'Tłumaczy wszystkie pliki Markdown w folderze.' },
            extractConceptsCurrent: { tooltip: 'Wyodrębnia pojęcia tylko z bieżącego pliku.' },
            extractConceptsFolder: { tooltip: 'Wyodrębnia pojęcia z każdego pliku w wybranym folderze.' },
            extractOriginalText: { tooltip: 'Wyodrębnia dosłowne fragmenty źródłowe dla skonfigurowanych pytań.' },
            batchMermaidFix: { tooltip: 'Uruchamia wsadową naprawę składni Mermaid/LaTeX w wybranym folderze.' },
            fixFormulaCurrent: { tooltip: 'Normalizuje delimitery formuł w bieżącym pliku.' },
            batchFixFormula: { tooltip: 'Normalizuje delimitery formuł w całym wybranym folderze.' },
            checkDuplicatesCurrent: { tooltip: 'Wykrywa zduplikowane terminy w bieżącym pliku.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Wykrywa i usuwa zduplikowane notatki pojęciowe.' },
            testLlmConnection: { tooltip: 'Testuje połączenie i dane uwierzytelniające aktywnego dostawcy.' }
        }
    }
});

extendLocale(STRINGS_PT, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Processa o ficheiro atual e cria wiki-links/notas de conceito.' },
            processFolderAddLinks: { tooltip: 'Processa todas as notas elegíveis numa pasta.' },
            generateFromTitle: { tooltip: 'Gera conteúdo da nota a partir do título da nota atual.' },
            batchGenerateFromTitles: { tooltip: 'Gera conteúdo em lote a partir dos títulos das notas numa pasta.' },
            researchAndSummarize: { tooltip: 'Pesquisa o tópico/título selecionado e acrescenta um resumo.' },
            summarizeAsMermaid: { tooltip: 'Gera um resumo em diagrama Mermaid a partir da nota atual.' },
            translateCurrentFile: { tooltip: 'Traduz o ficheiro ativo para o idioma de saída selecionado.' },
            batchTranslateFolder: { tooltip: 'Traduz todos os ficheiros Markdown numa pasta.' },
            extractConceptsCurrent: { tooltip: 'Extrai conceitos apenas do ficheiro atual.' },
            extractConceptsFolder: { tooltip: 'Extrai conceitos de cada ficheiro numa pasta selecionada.' },
            extractOriginalText: { tooltip: 'Extrai excertos literais da fonte para as perguntas configuradas.' },
            batchMermaidFix: { tooltip: 'Executa a correção sintática em lote de Mermaid/LaTeX na pasta selecionada.' },
            fixFormulaCurrent: { tooltip: 'Normaliza os delimitadores de fórmulas no ficheiro atual.' },
            batchFixFormula: { tooltip: 'Normaliza os delimitadores de fórmulas em toda a pasta selecionada.' },
            checkDuplicatesCurrent: { tooltip: 'Deteta termos duplicados no ficheiro atual.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Deteta e remove notas de conceito duplicadas.' },
            testLlmConnection: { tooltip: 'Testa a ligação e as credenciais do fornecedor ativo.' }
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Processa o arquivo atual e cria wiki-links/notas de conceito.' },
            processFolderAddLinks: { tooltip: 'Processa todas as notas elegíveis em uma pasta.' },
            generateFromTitle: { tooltip: 'Gera conteúdo da nota a partir do título da nota atual.' },
            batchGenerateFromTitles: { tooltip: 'Gera conteúdo em lote a partir dos títulos das notas em uma pasta.' },
            researchAndSummarize: { tooltip: 'Pesquisa o tópico/título selecionado e acrescenta um resumo.' },
            summarizeAsMermaid: { tooltip: 'Gera um resumo em diagrama Mermaid a partir da nota atual.' },
            translateCurrentFile: { tooltip: 'Traduz o arquivo ativo para o idioma de saída selecionado.' },
            batchTranslateFolder: { tooltip: 'Traduz todos os arquivos Markdown em uma pasta.' },
            extractConceptsCurrent: { tooltip: 'Extrai conceitos apenas do arquivo atual.' },
            extractConceptsFolder: { tooltip: 'Extrai conceitos de cada arquivo em uma pasta selecionada.' },
            extractOriginalText: { tooltip: 'Extrai trechos literais da fonte para as perguntas configuradas.' },
            batchMermaidFix: { tooltip: 'Executa a correção sintática em lote de Mermaid/LaTeX na pasta selecionada.' },
            fixFormulaCurrent: { tooltip: 'Normaliza os delimitadores de fórmulas no arquivo atual.' },
            batchFixFormula: { tooltip: 'Normaliza os delimitadores de fórmulas em toda a pasta selecionada.' },
            checkDuplicatesCurrent: { tooltip: 'Detecta termos duplicados no arquivo atual.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Detecta e remove notas de conceito duplicadas.' },
            testLlmConnection: { tooltip: 'Testa a conexão e as credenciais do provedor ativo.' }
        }
    }
});

extendLocale(STRINGS_RU, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Обрабатывает текущий файл и создает вики-ссылки/заметки-концепты.' },
            processFolderAddLinks: { tooltip: 'Обрабатывает все подходящие заметки в папке.' },
            generateFromTitle: { tooltip: 'Генерирует содержимое заметки из заголовка текущей заметки.' },
            batchGenerateFromTitles: { tooltip: 'Пакетно генерирует содержимое из заголовков заметок в папке.' },
            researchAndSummarize: { tooltip: 'Исследует выбранную тему/заголовок и добавляет сводку.' },
            summarizeAsMermaid: { tooltip: 'Создает Mermaid-диаграмму-сводку из текущей заметки.' },
            translateCurrentFile: { tooltip: 'Переводит активный файл на выбранный язык вывода.' },
            batchTranslateFolder: { tooltip: 'Переводит все Markdown-файлы в папке.' },
            extractConceptsCurrent: { tooltip: 'Извлекает концепты только из текущего файла.' },
            extractConceptsFolder: { tooltip: 'Извлекает концепты из каждого файла в выбранной папке.' },
            extractOriginalText: { tooltip: 'Извлекает дословные фрагменты исходного текста по настроенным вопросам.' },
            batchMermaidFix: { tooltip: 'Запускает пакетное исправление синтаксиса Mermaid/LaTeX для выбранной папки.' },
            fixFormulaCurrent: { tooltip: 'Нормализует разделители формул в текущем файле.' },
            batchFixFormula: { tooltip: 'Нормализует разделители формул во всей выбранной папке.' },
            checkDuplicatesCurrent: { tooltip: 'Обнаруживает повторяющиеся термины в текущем файле.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Обнаруживает и удаляет дублирующиеся заметки-концепты.' },
            testLlmConnection: { tooltip: 'Проверяет подключение и учетные данные активного провайдера.' }
        }
    }
});

extendLocale(STRINGS_TH, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'ประมวลผลไฟล์ปัจจุบันและสร้างวิกิลิงก์/โน้ตแนวคิด' },
            processFolderAddLinks: { tooltip: 'ประมวลผลโน้ตที่เข้าเงื่อนไขทั้งหมดในโฟลเดอร์' },
            generateFromTitle: { tooltip: 'สร้างเนื้อหาโน้ตจากชื่อโน้ตปัจจุบัน' },
            batchGenerateFromTitles: { tooltip: 'สร้างเนื้อหาแบบกลุ่มจากชื่อโน้ตในโฟลเดอร์' },
            researchAndSummarize: { tooltip: 'ค้นคว้าหัวข้อ/ชื่อเรื่องที่เลือกและเพิ่มสรุปต่อท้าย' },
            summarizeAsMermaid: { tooltip: 'สร้างสรุปเป็นแผนภาพ Mermaid จากโน้ตปัจจุบัน' },
            translateCurrentFile: { tooltip: 'แปลไฟล์ที่ใช้งานอยู่เป็นภาษาผลลัพธ์ที่เลือก' },
            batchTranslateFolder: { tooltip: 'แปลไฟล์ Markdown ทั้งหมดในโฟลเดอร์' },
            extractConceptsCurrent: { tooltip: 'สกัดแนวคิดจากไฟล์ปัจจุบันเท่านั้น' },
            extractConceptsFolder: { tooltip: 'สกัดแนวคิดจากทุกไฟล์ในโฟลเดอร์ที่เลือก' },
            extractOriginalText: { tooltip: 'สกัดข้อความต้นฉบับแบบตรงตัวตามคำถามที่กำหนด' },
            batchMermaidFix: { tooltip: 'รันการแก้ไวยากรณ์ Mermaid/LaTeX แบบกลุ่มในโฟลเดอร์ที่เลือก' },
            fixFormulaCurrent: { tooltip: 'ปรับตัวคั่นสูตรในไฟล์ปัจจุบันให้เป็นมาตรฐาน' },
            batchFixFormula: { tooltip: 'ปรับตัวคั่นสูตรในทั้งโฟลเดอร์ที่เลือกให้เป็นมาตรฐาน' },
            checkDuplicatesCurrent: { tooltip: 'ตรวจจับคำที่ซ้ำกันในไฟล์ปัจจุบัน' },
            checkRemoveDuplicateConcepts: { tooltip: 'ตรวจจับและลบโน้ตแนวคิดที่ซ้ำกัน' },
            testLlmConnection: { tooltip: 'ทดสอบการเชื่อมต่อและข้อมูลรับรองของผู้ให้บริการที่ใช้งานอยู่' }
        }
    }
});

extendLocale(STRINGS_TR, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Geçerli dosyayı işler ve wiki bağlantıları/kavram notları oluşturur.' },
            processFolderAddLinks: { tooltip: 'Klasördeki uygun tüm notları işler.' },
            generateFromTitle: { tooltip: 'Geçerli not başlığından not içeriği üretir.' },
            batchGenerateFromTitles: { tooltip: 'Klasördeki not başlıklarından toplu içerik üretir.' },
            researchAndSummarize: { tooltip: 'Seçili konu/başlığı araştırır ve özet ekler.' },
            summarizeAsMermaid: { tooltip: 'Geçerli nottan Mermaid diyagram özeti üretir.' },
            translateCurrentFile: { tooltip: 'Etkin dosyayı seçili çıktı diline çevirir.' },
            batchTranslateFolder: { tooltip: 'Klasördeki tüm Markdown dosyalarını çevirir.' },
            extractConceptsCurrent: { tooltip: 'Kavramları yalnızca geçerli dosyadan çıkarır.' },
            extractConceptsFolder: { tooltip: 'Seçili klasördeki her dosyadan kavram çıkarır.' },
            extractOriginalText: { tooltip: 'Yapılandırılmış sorular için kaynağın birebir alıntılarını çıkarır.' },
            batchMermaidFix: { tooltip: 'Seçili klasörde Mermaid/LaTeX toplu sözdizimi düzeltmesini çalıştırır.' },
            fixFormulaCurrent: { tooltip: 'Geçerli dosyadaki formül ayraçlarını normalize eder.' },
            batchFixFormula: { tooltip: 'Seçili klasör genelinde formül ayraçlarını normalize eder.' },
            checkDuplicatesCurrent: { tooltip: 'Geçerli dosyadaki yinelenen terimleri algılar.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Yinelenen kavram notlarını algılar ve kaldırır.' },
            testLlmConnection: { tooltip: 'Etkin sağlayıcı bağlantısını ve kimlik bilgilerini test eder.' }
        }
    }
});

extendLocale(STRINGS_UK, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Обробляє поточний файл і створює вікіпосилання/нотатки-концепти.' },
            processFolderAddLinks: { tooltip: 'Обробляє всі відповідні нотатки в папці.' },
            generateFromTitle: { tooltip: 'Генерує вміст нотатки із заголовка поточної нотатки.' },
            batchGenerateFromTitles: { tooltip: 'Пакетно генерує вміст із заголовків нотаток у папці.' },
            researchAndSummarize: { tooltip: 'Досліджує вибрану тему/заголовок і додає підсумок.' },
            summarizeAsMermaid: { tooltip: 'Створює підсумок у вигляді Mermaid-діаграми з поточної нотатки.' },
            translateCurrentFile: { tooltip: 'Перекладає активний файл вибраною мовою виводу.' },
            batchTranslateFolder: { tooltip: 'Перекладає всі Markdown-файли в папці.' },
            extractConceptsCurrent: { tooltip: 'Видобуває концепти лише з поточного файла.' },
            extractConceptsFolder: { tooltip: 'Видобуває концепти з кожного файла у вибраній папці.' },
            extractOriginalText: { tooltip: 'Видобуває дослівні уривки джерела для налаштованих запитань.' },
            batchMermaidFix: { tooltip: 'Запускає пакетне виправлення синтаксису Mermaid/LaTeX для вибраної папки.' },
            fixFormulaCurrent: { tooltip: 'Нормалізує розділювачі формул у поточному файлі.' },
            batchFixFormula: { tooltip: 'Нормалізує розділювачі формул у всій вибраній папці.' },
            checkDuplicatesCurrent: { tooltip: 'Виявляє дубльовані терміни в поточному файлі.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Виявляє та видаляє дубльовані нотатки-концепти.' },
            testLlmConnection: { tooltip: 'Перевіряє з’єднання та облікові дані активного провайдера.' }
        }
    }
});

extendLocale(STRINGS_VI, {
    sidebar: {
        actions: {
            processCurrentAddLinks: { tooltip: 'Xử lý tệp hiện tại và tạo wiki-link/ghi chú khái niệm.' },
            processFolderAddLinks: { tooltip: 'Xử lý tất cả ghi chú đủ điều kiện trong một thư mục.' },
            generateFromTitle: { tooltip: 'Tạo nội dung ghi chú từ tiêu đề ghi chú hiện tại.' },
            batchGenerateFromTitles: { tooltip: 'Tạo nội dung hàng loạt từ tiêu đề ghi chú trong một thư mục.' },
            researchAndSummarize: { tooltip: 'Nghiên cứu chủ đề/tiêu đề đã chọn và thêm phần tóm tắt.' },
            summarizeAsMermaid: { tooltip: 'Tạo bản tóm tắt dạng sơ đồ Mermaid từ ghi chú hiện tại.' },
            translateCurrentFile: { tooltip: 'Dịch tệp đang hoạt động sang ngôn ngữ đầu ra đã chọn.' },
            batchTranslateFolder: { tooltip: 'Dịch tất cả tệp Markdown trong một thư mục.' },
            extractConceptsCurrent: { tooltip: 'Trích xuất khái niệm chỉ từ tệp hiện tại.' },
            extractConceptsFolder: { tooltip: 'Trích xuất khái niệm từ mọi tệp trong thư mục đã chọn.' },
            extractOriginalText: { tooltip: 'Trích xuất nguyên văn các đoạn nguồn cho những câu hỏi đã cấu hình.' },
            batchMermaidFix: { tooltip: 'Chạy sửa cú pháp Mermaid/LaTeX hàng loạt trên thư mục đã chọn.' },
            fixFormulaCurrent: { tooltip: 'Chuẩn hóa dấu phân cách công thức trong tệp hiện tại.' },
            batchFixFormula: { tooltip: 'Chuẩn hóa dấu phân cách công thức trên toàn bộ thư mục đã chọn.' },
            checkDuplicatesCurrent: { tooltip: 'Phát hiện các thuật ngữ trùng lặp trong tệp hiện tại.' },
            checkRemoveDuplicateConcepts: { tooltip: 'Phát hiện và xóa ghi chú khái niệm trùng lặp.' },
            testLlmConnection: { tooltip: 'Kiểm tra kết nối và thông tin xác thực của nhà cung cấp đang hoạt động.' }
        }
    }
});

extendLocale(STRINGS_AR, {
    settings: {
        extractOriginalText: {
            questionsName: 'أسئلة الاستخراج',
            questionsDesc: 'أدخل قائمة الأسئلة لاستخراج النصوص المقابلة لها، سؤالًا في كل سطر.',
            questionsPlaceholder: 'أدخل أسئلتك هنا...',
            translateOutputName: 'ترجمة المخرجات إلى اللغة المقابلة',
            translateOutputDesc: 'عند التفعيل، ستتضمن المخرجات ترجمة إلى لغة الاستخراج المحددة.',
            mergedQueryName: 'وضع الاستعلام المدمج',
            mergedQueryDesc: 'تشغيل: أرسل جميع الأسئلة في مطالبة LLM واحدة (أسرع/أوفر). إيقاف: عالج كل سؤال على حدة (دقة أعلى).',
            customOutputName: 'تخصيص مسار حفظ النص المستخرج واسم الملف',
            customOutputDesc: 'تشغيل: استخدم مجلدًا ولاحقة مخصصين للملفات المستخرجة. إيقاف: احفظ في المجلد الأصلي مع اللاحقة الافتراضية "_Extracted".',
            savePathName: 'مسار حفظ الملف المستخرج',
            savePathDesc: 'المجلد الذي ستُحفظ فيه الملفات المستخرجة (بالنسبة إلى جذر المستودع).',
            savePathPlaceholder: 'مثال: ExtractedData',
            customSuffixName: 'لاحقة مخصصة',
            customSuffixDesc: 'اللاحقة المخصصة التي ستُلحق باسم الملف (مثل: "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_DE, {
    settings: {
        extractOriginalText: {
            questionsName: 'Fragen für die Extraktion',
            questionsDesc: 'Geben Sie die Liste der Fragen ein, für die spezifischer Text extrahiert werden soll, jeweils eine pro Zeile.',
            questionsPlaceholder: 'Geben Sie hier Ihre Fragen ein...',
            translateOutputName: 'Ausgabe in die entsprechende Sprache übersetzen',
            translateOutputDesc: 'Wenn ausgewählt, enthält die Ausgabe eine Übersetzung in die ausgewählte Extraktionssprache.',
            mergedQueryName: 'Zusammengeführter Abfragemodus',
            mergedQueryDesc: 'Ein: Alle Fragen in einem einzigen LLM-Prompt senden (schneller/günstiger). Aus: Jede Frage einzeln verarbeiten (höhere Genauigkeit).',
            customOutputName: 'Speicherpfad und Dateiname für extrahierten Text anpassen',
            customOutputDesc: 'Ein: Benutzerdefinierten Ordner und Suffix für extrahierte Dateien verwenden. Aus: Im Originalordner mit dem Standardsuffix "_Extracted" speichern.',
            savePathName: 'Speicherpfad für extrahierte Dateien',
            savePathDesc: 'Der Ordner, in dem extrahierte Dateien gespeichert werden (relativ zum Tresor-Stammverzeichnis).',
            savePathPlaceholder: 'z. B. ExtractedData',
            customSuffixName: 'Benutzerdefiniertes Suffix',
            customSuffixDesc: 'Das benutzerdefinierte Suffix, das an den Dateinamen angehängt wird (z. B. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_ES, {
    settings: {
        extractOriginalText: {
            questionsName: 'Preguntas para la extracción',
            questionsDesc: 'Introduce la lista de preguntas para extraer el texto correspondiente, una por línea.',
            questionsPlaceholder: 'Introduce aquí tus preguntas...',
            translateOutputName: 'Traducir la salida al idioma correspondiente',
            translateOutputDesc: 'Si se activa, la salida incluirá una traducción al idioma de extracción seleccionado.',
            mergedQueryName: 'Modo de consulta combinada',
            mergedQueryDesc: 'Activado: envía todas las preguntas en un único prompt de LLM (más rápido/más barato). Desactivado: procesa cada pregunta por separado (mayor precisión).',
            customOutputName: 'Personalizar la ruta y el nombre del archivo del texto extraído',
            customOutputDesc: 'Activado: usa carpeta y sufijo personalizados para los archivos extraídos. Desactivado: guarda en la carpeta original con el sufijo predeterminado "_Extracted".',
            savePathName: 'Ruta de guardado del archivo extraído',
            savePathDesc: 'La carpeta donde se guardarán los archivos extraídos (relativa a la raíz del vault).',
            savePathPlaceholder: 'p. ej., ExtractedData',
            customSuffixName: 'Sufijo personalizado',
            customSuffixDesc: 'El sufijo personalizado que se añadirá al nombre del archivo (p. ej., "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_FA, {
    settings: {
        extractOriginalText: {
            questionsName: 'پرسش‌های استخراج',
            questionsDesc: 'فهرست پرسش‌هایی را که می‌خواهید متن متناظرشان استخراج شود، هر کدام در یک خط، وارد کنید.',
            questionsPlaceholder: 'پرسش‌های خود را اینجا وارد کنید...',
            translateOutputName: 'ترجمهٔ خروجی به زبان متناظر',
            translateOutputDesc: 'اگر فعال باشد، خروجی شامل ترجمه‌ای به زبان استخراج انتخاب‌شده خواهد بود.',
            mergedQueryName: 'حالت پرس‌وجوی ادغام‌شده',
            mergedQueryDesc: 'روشن: همهٔ پرسش‌ها را در یک پرامپت LLM ارسال می‌کند (سریع‌تر/کم‌هزینه‌تر). خاموش: هر پرسش را جداگانه پردازش می‌کند (دقت بالاتر).',
            customOutputName: 'شخصی‌سازی مسیر ذخیره و نام فایل متن استخراج‌شده',
            customOutputDesc: 'روشن: برای فایل‌های استخراج‌شده از پوشه و پسوند سفارشی استفاده می‌کند. خاموش: در پوشهٔ اصلی با پسوند پیش‌فرض "_Extracted" ذخیره می‌کند.',
            savePathName: 'مسیر ذخیرهٔ فایل استخراج‌شده',
            savePathDesc: 'پوشه‌ای که فایل‌های استخراج‌شده در آن ذخیره می‌شوند (نسبت به ریشهٔ vault).',
            savePathPlaceholder: 'مثلاً: ExtractedData',
            customSuffixName: 'پسوند سفارشی',
            customSuffixDesc: 'پسوند سفارشی‌ای که به نام فایل افزوده می‌شود (برای نمونه "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_FR, {
    settings: {
        extractOriginalText: {
            questionsName: 'Questions d’extraction',
            questionsDesc: 'Entrez la liste des questions pour lesquelles extraire un texte spécifique, une par ligne.',
            questionsPlaceholder: 'Saisissez vos questions ici...',
            translateOutputName: 'Traduire la sortie dans la langue correspondante',
            translateOutputDesc: 'Si activé, la sortie inclura une traduction dans la langue d’extraction sélectionnée.',
            mergedQueryName: 'Mode de requête fusionnée',
            mergedQueryDesc: 'Activé : envoyer toutes les questions dans une seule invite LLM (plus rapide/moins coûteux). Désactivé : traiter chaque question individuellement (précision plus élevée).',
            customOutputName: 'Personnaliser le chemin d’enregistrement et le nom du fichier du texte extrait',
            customOutputDesc: 'Activé : utiliser un dossier et un suffixe personnalisés pour les fichiers extraits. Désactivé : enregistrer dans le dossier d’origine avec le suffixe par défaut "_Extracted".',
            savePathName: 'Chemin d’enregistrement du fichier extrait',
            savePathDesc: 'Le dossier où les fichiers extraits seront enregistrés (relatif à la racine du coffre).',
            savePathPlaceholder: 'p. ex. ExtractedData',
            customSuffixName: 'Suffixe personnalisé',
            customSuffixDesc: 'Le suffixe personnalisé à ajouter au nom du fichier (p. ex. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        extractOriginalText: {
            questionsName: 'Pertanyaan untuk ekstraksi',
            questionsDesc: 'Masukkan daftar pertanyaan untuk mengekstrak teks yang sesuai, satu per baris.',
            questionsPlaceholder: 'Masukkan pertanyaan Anda di sini...',
            translateOutputName: 'Terjemahkan keluaran ke bahasa yang sesuai',
            translateOutputDesc: 'Jika diaktifkan, keluaran akan menyertakan terjemahan ke bahasa ekstraksi yang dipilih.',
            mergedQueryName: 'Mode kueri gabungan',
            mergedQueryDesc: 'Aktif: kirim semua pertanyaan dalam satu prompt LLM (lebih cepat/lebih hemat). Nonaktif: proses setiap pertanyaan secara terpisah (presisi lebih tinggi).',
            customOutputName: 'Sesuaikan jalur simpan dan nama file teks hasil ekstraksi',
            customOutputDesc: 'Aktif: gunakan folder dan sufiks khusus untuk file hasil ekstraksi. Nonaktif: simpan di folder asli dengan sufiks default "_Extracted".',
            savePathName: 'Jalur simpan file hasil ekstraksi',
            savePathDesc: 'Folder tempat file hasil ekstraksi akan disimpan (relatif terhadap akar vault).',
            savePathPlaceholder: 'mis., ExtractedData',
            customSuffixName: 'Sufiks khusus',
            customSuffixDesc: 'Sufiks khusus yang akan ditambahkan ke nama file (mis. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_IT, {
    settings: {
        extractOriginalText: {
            questionsName: 'Domande per l’estrazione',
            questionsDesc: 'Inserisci l’elenco delle domande per cui estrarre il testo corrispondente, una per riga.',
            questionsPlaceholder: 'Inserisci qui le tue domande...',
            translateOutputName: 'Traduci l’output nella lingua corrispondente',
            translateOutputDesc: 'Se selezionato, l’output includerà una traduzione nella lingua di estrazione selezionata.',
            mergedQueryName: 'Modalità query unificata',
            mergedQueryDesc: 'Attiva: invia tutte le domande in un unico prompt LLM (più veloce/più economico). Disattiva: elabora ogni domanda singolarmente (maggiore precisione).',
            customOutputName: 'Personalizza percorso di salvataggio e nome file del testo estratto',
            customOutputDesc: 'Attiva: usa cartella e suffisso personalizzati per i file estratti. Disattiva: salva nella cartella originale con il suffisso predefinito "_Extracted".',
            savePathName: 'Percorso di salvataggio del file estratto',
            savePathDesc: 'La cartella in cui verranno salvati i file estratti (relativa alla radice del vault).',
            savePathPlaceholder: 'es. ExtractedData',
            customSuffixName: 'Suffisso personalizzato',
            customSuffixDesc: 'Il suffisso personalizzato da aggiungere al nome file (ad es. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        extractOriginalText: {
            questionsName: '抽出用の質問',
            questionsDesc: '対応する原文を抽出したい質問一覧を、1 行に 1 件ずつ入力してください。',
            questionsPlaceholder: 'ここに質問を入力...',
            translateOutputName: '出力を対応する言語に翻訳',
            translateOutputDesc: '有効にすると、出力には選択した抽出言語への翻訳が含まれます。',
            mergedQueryName: '統合クエリモード',
            mergedQueryDesc: 'オン: すべての質問を 1 つの LLM プロンプトで送信します（より速く、低コスト）。オフ: 各質問を個別に処理します（精度が高い）。',
            customOutputName: '抽出テキストの保存パスとファイル名をカスタマイズ',
            customOutputDesc: 'オン: 抽出ファイルにカスタムフォルダーとサフィックスを使用します。オフ: 元のフォルダーにデフォルトの "_Extracted" サフィックスで保存します。',
            savePathName: '抽出ファイルの保存パス',
            savePathDesc: '抽出ファイルを保存するフォルダー（Vault ルートからの相対パス）。',
            savePathPlaceholder: '例: ExtractedData',
            customSuffixName: 'カスタムサフィックス',
            customSuffixDesc: 'ファイル名に追加するカスタムサフィックス（例: "_MyExtract"）。'
        }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        extractOriginalText: {
            questionsName: '추출 질문',
            questionsDesc: '해당 원문을 추출할 질문 목록을 한 줄에 하나씩 입력하세요.',
            questionsPlaceholder: '여기에 질문을 입력하세요...',
            translateOutputName: '출력을 해당 언어로 번역',
            translateOutputDesc: '활성화하면 출력에 선택한 추출 언어 번역이 포함됩니다.',
            mergedQueryName: '통합 질의 모드',
            mergedQueryDesc: '켜기: 모든 질문을 하나의 LLM 프롬프트로 보냅니다(더 빠르고 저렴함). 끄기: 각 질문을 개별적으로 처리합니다(더 높은 정확도).',
            customOutputName: '추출 텍스트 저장 경로 및 파일명 사용자 지정',
            customOutputDesc: '켜기: 추출 파일에 사용자 지정 폴더와 접미사를 사용합니다. 끄기: 원본 폴더에 기본 "_Extracted" 접미사로 저장합니다.',
            savePathName: '추출 파일 저장 경로',
            savePathDesc: '추출 파일을 저장할 폴더입니다(Vault 루트 기준 상대 경로).',
            savePathPlaceholder: '예: ExtractedData',
            customSuffixName: '사용자 지정 접미사',
            customSuffixDesc: '파일명에 추가할 사용자 지정 접미사입니다(예: "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        extractOriginalText: {
            questionsName: 'Vragen voor extractie',
            questionsDesc: 'Voer de lijst met vragen in waarvoor specifieke tekst moet worden geëxtraheerd, één per regel.',
            questionsPlaceholder: 'Voer hier uw vragen in...',
            translateOutputName: 'Uitvoer vertalen naar de overeenkomstige taal',
            translateOutputDesc: 'Indien geselecteerd, bevat de uitvoer een vertaling in de gekozen extractietaal.',
            mergedQueryName: 'Samengevoegde querymodus',
            mergedQueryDesc: 'Aan: dien alle vragen in één LLM-prompt in (sneller/goedkoper). Uit: verwerk elke vraag afzonderlijk (hogere precisie).',
            customOutputName: 'Opslagpad en bestandsnaam van geëxtraheerde tekst aanpassen',
            customOutputDesc: 'Aan: gebruik een aangepaste map en achtervoegsel voor geëxtraheerde bestanden. Uit: sla op in de oorspronkelijke map met het standaardsuffix "_Extracted".',
            savePathName: 'Opslagpad voor geëxtraheerde bestanden',
            savePathDesc: 'De map waarin geëxtraheerde bestanden worden opgeslagen (relatief aan de vault-hoofdmap).',
            savePathPlaceholder: 'bijv. ExtractedData',
            customSuffixName: 'Aangepast achtervoegsel',
            customSuffixDesc: 'Het aangepaste achtervoegsel dat aan de bestandsnaam wordt toegevoegd (bijv. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        extractOriginalText: {
            questionsName: 'Pytania do ekstrakcji',
            questionsDesc: 'Wprowadź listę pytań, dla których ma zostać wyodrębniony odpowiedni tekst, po jednym w wierszu.',
            questionsPlaceholder: 'Wpisz tutaj swoje pytania...',
            translateOutputName: 'Przetłumacz wynik na odpowiadający język',
            translateOutputDesc: 'Po włączeniu wynik będzie zawierał tłumaczenie na wybrany język ekstrakcji.',
            mergedQueryName: 'Tryb scalonego zapytania',
            mergedQueryDesc: 'Wł.: wyślij wszystkie pytania w jednym monicie LLM (szybciej/taniej). Wył.: przetwarzaj każde pytanie osobno (wyższa precyzja).',
            customOutputName: 'Dostosuj ścieżkę zapisu i nazwę pliku wyodrębnionego tekstu',
            customOutputDesc: 'Wł.: użyj niestandardowego folderu i sufiksu dla wyodrębnionych plików. Wył.: zapisz w oryginalnym folderze z domyślnym sufiksem "_Extracted".',
            savePathName: 'Ścieżka zapisu wyodrębnionego pliku',
            savePathDesc: 'Folder, w którym będą zapisywane wyodrębnione pliki (względem katalogu głównego vaultu).',
            savePathPlaceholder: 'np. ExtractedData',
            customSuffixName: 'Niestandardowy sufiks',
            customSuffixDesc: 'Niestandardowy sufiks dodawany do nazwy pliku (np. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_PT, {
    settings: {
        extractOriginalText: {
            questionsName: 'Perguntas para extração',
            questionsDesc: 'Introduza a lista de perguntas para extrair o texto correspondente, uma por linha.',
            questionsPlaceholder: 'Introduza aqui as suas perguntas...',
            translateOutputName: 'Traduzir a saída para o idioma correspondente',
            translateOutputDesc: 'Se ativado, a saída incluirá uma tradução para o idioma de extração selecionado.',
            mergedQueryName: 'Modo de consulta combinada',
            mergedQueryDesc: 'Ativado: envia todas as perguntas num único prompt LLM (mais rápido/mais barato). Desativado: processa cada pergunta individualmente (maior precisão).',
            customOutputName: 'Personalizar caminho de gravação e nome do ficheiro do texto extraído',
            customOutputDesc: 'Ativado: usar pasta e sufixo personalizados para os ficheiros extraídos. Desativado: guardar na pasta original com o sufixo predefinido "_Extracted".',
            savePathName: 'Caminho de gravação do ficheiro extraído',
            savePathDesc: 'A pasta onde os ficheiros extraídos serão guardados (relativo à raiz do vault).',
            savePathPlaceholder: 'Ex.: ExtractedData',
            customSuffixName: 'Sufixo personalizado',
            customSuffixDesc: 'O sufixo personalizado a acrescentar ao nome do ficheiro (por ex. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    settings: {
        extractOriginalText: {
            questionsName: 'Perguntas para extração',
            questionsDesc: 'Digite a lista de perguntas para extrair o texto correspondente, uma por linha.',
            questionsPlaceholder: 'Digite suas perguntas aqui...',
            translateOutputName: 'Traduzir a saída para o idioma correspondente',
            translateOutputDesc: 'Se ativado, a saída incluirá uma tradução para o idioma de extração selecionado.',
            mergedQueryName: 'Modo de consulta combinada',
            mergedQueryDesc: 'Ativado: envia todas as perguntas em um único prompt LLM (mais rápido/mais barato). Desativado: processa cada pergunta individualmente (maior precisão).',
            customOutputName: 'Personalizar caminho de salvamento e nome do arquivo do texto extraído',
            customOutputDesc: 'Ativado: usar pasta e sufixo personalizados para os arquivos extraídos. Desativado: salvar na pasta original com o sufixo padrão "_Extracted".',
            savePathName: 'Caminho de salvamento do arquivo extraído',
            savePathDesc: 'A pasta onde os arquivos extraídos serão salvos (relativo à raiz do vault).',
            savePathPlaceholder: 'Ex.: ExtractedData',
            customSuffixName: 'Sufixo personalizado',
            customSuffixDesc: 'O sufixo personalizado a acrescentar ao nome do arquivo (por ex. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_RU, {
    settings: {
        extractOriginalText: {
            questionsName: 'Вопросы для извлечения',
            questionsDesc: 'Введите список вопросов для извлечения соответствующего текста, по одному на строку.',
            questionsPlaceholder: 'Введите ваши вопросы здесь...',
            translateOutputName: 'Переводить вывод на соответствующий язык',
            translateOutputDesc: 'Если включено, вывод будет включать перевод на выбранный язык извлечения.',
            mergedQueryName: 'Режим объединенного запроса',
            mergedQueryDesc: 'Вкл: отправлять все вопросы в одном запросе к LLM (быстрее/дешевле). Выкл: обрабатывать каждый вопрос отдельно (выше точность).',
            customOutputName: 'Настроить путь сохранения и имя файла извлеченного текста',
            customOutputDesc: 'Вкл: использовать пользовательскую папку и суффикс для извлеченных файлов. Выкл: сохранять в исходной папке с суффиксом по умолчанию "_Extracted".',
            savePathName: 'Путь сохранения извлеченного файла',
            savePathDesc: 'Папка, в которую будут сохраняться извлеченные файлы (относительно корня хранилища).',
            savePathPlaceholder: 'Напр.: ExtractedData',
            customSuffixName: 'Пользовательский суффикс',
            customSuffixDesc: 'Пользовательский суффикс, добавляемый к имени файла (например, "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        extractOriginalText: {
            questionsName: 'คำถามสำหรับการดึงข้อความ',
            questionsDesc: 'ป้อนรายการคำถามสำหรับดึงข้อความที่ตรงกัน โดยใส่ทีละบรรทัด',
            questionsPlaceholder: 'ป้อนคำถามของคุณที่นี่...',
            translateOutputName: 'แปลผลลัพธ์เป็นภาษาที่สอดคล้องกัน',
            translateOutputDesc: 'เมื่อเปิดใช้งาน ผลลัพธ์จะมีคำแปลเป็นภาษาที่เลือกสำหรับการดึงข้อความ',
            mergedQueryName: 'โหมดคำค้นแบบรวม',
            mergedQueryDesc: 'เปิด: ส่งทุกคำถามในพรอมป์ LLM เดียว (เร็วกว่า/ประหยัดกว่า) ปิด: ประมวลผลแต่ละคำถามแยกกัน (แม่นยำกว่า)',
            customOutputName: 'กำหนดเส้นทางบันทึกและชื่อไฟล์ของข้อความที่ดึงได้เอง',
            customOutputDesc: 'เปิด: ใช้โฟลเดอร์และส่วนต่อท้ายแบบกำหนดเองสำหรับไฟล์ที่ดึงได้ ปิด: บันทึกในโฟลเดอร์เดิมพร้อมส่วนต่อท้ายเริ่มต้น "_Extracted"',
            savePathName: 'เส้นทางบันทึกไฟล์ที่ดึงได้',
            savePathDesc: 'โฟลเดอร์ที่จะบันทึกไฟล์ที่ดึงได้ (อ้างอิงจากราก vault)',
            savePathPlaceholder: 'เช่น ExtractedData',
            customSuffixName: 'ส่วนต่อท้ายแบบกำหนดเอง',
            customSuffixDesc: 'ส่วนต่อท้ายแบบกำหนดเองที่จะเติมท้ายชื่อไฟล์ (เช่น "_MyExtract")'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        extractOriginalText: {
            questionsName: 'Çıkarma soruları',
            questionsDesc: 'Belirli metni çıkarmak istediğiniz soruların listesini her satıra bir soru gelecek şekilde girin.',
            questionsPlaceholder: 'Sorularınızı buraya girin...',
            translateOutputName: 'Çıktıyı karşılık gelen dile çevir',
            translateOutputDesc: 'Seçilirse çıktı, seçilen çıkarma dilinde bir çeviri içerecektir.',
            mergedQueryName: 'Birleştirilmiş sorgu modu',
            mergedQueryDesc: 'Açık: tüm soruları tek bir LLM isteminde gönderir (daha hızlı/daha ucuz). Kapalı: her soruyu ayrı işler (daha yüksek doğruluk).',
            customOutputName: 'Çıkarılan metin için kayıt yolu ve dosya adını özelleştir',
            customOutputDesc: 'Açık: çıkarılan dosyalar için özel klasör ve sonek kullanır. Kapalı: özgün klasöre varsayılan "_Extracted" sonekiyle kaydeder.',
            savePathName: 'Çıkarılan dosya kayıt yolu',
            savePathDesc: 'Çıkarılan dosyaların kaydedileceği klasör (vault köküne göre).',
            savePathPlaceholder: 'Örn. ExtractedData',
            customSuffixName: 'Özel sonek',
            customSuffixDesc: 'Dosya adına eklenecek özel sonek (örn. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_UK, {
    settings: {
        extractOriginalText: {
            questionsName: 'Питання для видобування',
            questionsDesc: 'Введіть список питань для видобування відповідного тексту, по одному на рядок.',
            questionsPlaceholder: 'Введіть свої питання тут...',
            translateOutputName: 'Перекладати вивід відповідною мовою',
            translateOutputDesc: 'Якщо ввімкнено, вивід міститиме переклад вибраною мовою видобування.',
            mergedQueryName: 'Режим об’єднаного запиту',
            mergedQueryDesc: 'Увімкнено: надсилати всі питання в одному LLM-запиті (швидше/дешевше). Вимкнено: обробляти кожне питання окремо (вища точність).',
            customOutputName: 'Налаштувати шлях збереження й ім’я файла для видобутого тексту',
            customOutputDesc: 'Увімкнено: використовувати власну папку та суфікс для видобутих файлів. Вимкнено: зберігати в початковій папці з типовим суфіксом "_Extracted".',
            savePathName: 'Шлях збереження видобутого файла',
            savePathDesc: 'Папка, куди зберігатимуться видобуті файли (відносно кореня vault).',
            savePathPlaceholder: 'Напр.: ExtractedData',
            customSuffixName: 'Користувацький суфікс',
            customSuffixDesc: 'Користувацький суфікс, що додається до імені файла (напр. "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_VI, {
    settings: {
        extractOriginalText: {
            questionsName: 'Câu hỏi trích xuất',
            questionsDesc: 'Nhập danh sách câu hỏi để trích xuất đoạn văn bản tương ứng, mỗi dòng một câu.',
            questionsPlaceholder: 'Nhập câu hỏi của bạn tại đây...',
            translateOutputName: 'Dịch đầu ra sang ngôn ngữ tương ứng',
            translateOutputDesc: 'Nếu bật, đầu ra sẽ bao gồm bản dịch sang ngôn ngữ trích xuất đã chọn.',
            mergedQueryName: 'Chế độ truy vấn gộp',
            mergedQueryDesc: 'Bật: gửi tất cả câu hỏi trong một prompt LLM duy nhất (nhanh hơn/rẻ hơn). Tắt: xử lý từng câu hỏi riêng lẻ (độ chính xác cao hơn).',
            customOutputName: 'Tùy chỉnh đường dẫn lưu và tên tệp của văn bản đã trích xuất',
            customOutputDesc: 'Bật: dùng thư mục và hậu tố tùy chỉnh cho các tệp đã trích xuất. Tắt: lưu trong thư mục gốc với hậu tố mặc định "_Extracted".',
            savePathName: 'Đường dẫn lưu tệp đã trích xuất',
            savePathDesc: 'Thư mục sẽ lưu các tệp đã trích xuất (tương đối so với thư mục gốc của vault).',
            savePathPlaceholder: 'Ví dụ: ExtractedData',
            customSuffixName: 'Hậu tố tùy chỉnh',
            customSuffixDesc: 'Hậu tố tùy chỉnh sẽ được thêm vào tên tệp (ví dụ: "_MyExtract").'
        }
    }
});

extendLocale(STRINGS_AR, {
    settings: {
        stableApi: {
            enableName: 'تمكين استدعاءات API المستقرة (منطق إعادة المحاولة)',
            enableDesc: 'تشغيل: أعد محاولة استدعاءات LLM API الفاشلة تلقائيًا. إيقاف: افشل عند أول خطأ.',
            retryIntervalName: 'فاصل إعادة المحاولة (بالثواني)',
            retryIntervalDesc: 'مدة الانتظار بين المحاولات.',
            maxRetriesName: 'الحد الأقصى لإعادات المحاولة',
            maxRetriesDesc: 'أقصى عدد لمحاولات إعادة التنفيذ.',
            debugModeName: 'وضع تصحيح أخطاء API',
            debugModeDesc: 'تشغيل: فعّل تسجيل الأخطاء التفصيلي (على نمط DeepSeek) لجميع المزوّدين للمساعدة في تشخيص مشاكل API. إيقاف: استخدم تقارير أخطاء مختصرة قياسية.',
            diagnosticCallModeName: 'وضع استدعاء التشخيص',
            diagnosticCallModeDesc: 'اختر مسار الاستدعاء أثناء التشغيل الذي تستخدمه أدوات تشخيص المطور لهذا المزوّد.',
            diagnosticTimeoutName: 'مهلة التشخيص (بالثواني)',
            diagnosticTimeoutDesc: 'المهلة لكل تشغيل من عمليات تشخيص المطور (15-3600 ثانية).',
            stabilityRunsName: 'عدد مرات اختبار الاستقرار',
            stabilityRunsDesc: 'عدد مرات التكرار التي ستُنفذ في "تشغيل اختبار الاستقرار" (1-10).',
            longRequestName: 'تشخيص المزوّد للمطور (طلب طويل)',
            longRequestDesc: 'نفّذ تشخيصًا واحدًا بطلب طويل باستخدام وضع الاستدعاء المحدد واحفظ تقريرًا كاملًا في جذر المستودع.'
        },
        webResearch: {
            searchProviderName: 'مزوّد البحث',
            searchProviderDesc: 'المحرك المستخدم في "البحث والتلخيص".',
            tavilyOption: 'Tavily (يتطلب مفتاح API)',
            duckduckgoOption: 'DuckDuckGo (تجريبي)',
            tavilyApiKeyName: 'مفتاح Tavily API',
            tavilyApiKeyDesc: 'مطلوب لـ Tavily. احصل عليه من tavily.com.',
            tavilyApiKeyPlaceholder: 'أدخل مفتاح Tavily API (tvly-...)',
            tavilyMaxResultsName: 'الحد الأقصى لنتائج Tavily',
            tavilyMaxResultsDesc: 'الحد الأقصى للنتائج (1-20).',
            tavilySearchDepthName: 'عمق بحث Tavily',
            tavilySearchDepthDesc: 'يستخدم "advanced" أرصدة أكثر.',
            tavilySearchDepthBasic: 'أساسي',
            tavilySearchDepthAdvanced: 'متقدم (رصيدان)',
            duckduckgoMaxResultsName: 'الحد الأقصى لنتائج DuckDuckGo',
            duckduckgoMaxResultsDesc: 'أقصى عدد نتائج سيتم تحليلها.',
            duckduckgoFetchTimeoutName: 'مهلة جلب محتوى DuckDuckGo (بالثواني)',
            duckduckgoFetchTimeoutDesc: 'أقصى مدة انتظار لكل عنوان URL في النتائج.',
            maxResearchTokensName: 'الحد الأقصى لرموز محتوى البحث',
            maxResearchTokensDesc: 'الحد الأقصى التقريبي للرموز المأخوذة من نتائج الويب لاستخدامها في مطالبة التلخيص.'
        },
        duplicateScope: {
            modeName: 'وضع نطاق فحص التكرار',
            modeDesc: 'حدّد نطاق العثور على النظائر المكررة.',
            optionVault: 'المستودع بالكامل (الافتراضي - يقارن ملاحظات المفاهيم بجميع الملاحظات الأخرى)',
            optionInclude: 'تضمين مجلدات محددة فقط (يقارن ملاحظات المفاهيم بالملاحظات الموجودة في المجلدات المحددة)',
            optionExclude: 'استبعاد مجلدات محددة (يقارن ملاحظات المفاهيم بالملاحظات خارج المجلدات المحددة)',
            optionConceptFolderOnly: 'مجلد المفاهيم فقط (يقارن ملاحظات المفاهيم ببعضها البعض)',
            includeFoldersName: 'تضمين المجلدات',
            excludeFoldersName: 'استبعاد المجلدات',
            pathsDesc: 'أدخل المسارات النسبية (واحدًا في كل سطر) للمجلدات المطلوب {mode}ها. هذا الحقل مطلوب إذا لم يكن الوضع "المستودع بالكامل" أو "مجلد المفاهيم فقط". المسارات حساسة لحالة الأحرف وتستخدم "/" كفاصل.',
            pathsModeInclude: 'تضمين',
            pathsModeExclude: 'استبعاد',
            pathsPlaceholder: 'مثال: Notes/ProjectA\nSource Material',
            invalidPathNotice: `مسار غير صالح: "{path}". استخدم "/" كفاصل مسار، وليس "\\".`,
            invalidCharacterNotice: 'حرف غير صالح "{char}" في المسار: "{path}". الأحرف المحظورة: مسافة، \\، <، >، :، |، ?، #، ^، [، ]',
            emptyPathsNotice: 'لا يمكن أن تكون مسارات المجلدات فارغة عند اختيار وضع "التضمين" أو "الاستبعاد".',
            invalidPathsNotSaved: 'تم اكتشاف مسار/مسارات غير صالحة. لم تُحفَظ إعدادات هذا الحقل.'
        }
    }
});

extendLocale(STRINGS_DE, {
    settings: {
        stableApi: {
            enableName: 'Stabile API-Aufrufe aktivieren (Wiederholungslogik)',
            enableDesc: 'Ein: Fehlgeschlagene LLM-API-Aufrufe automatisch wiederholen. Aus: Beim ersten Fehler abbrechen.',
            retryIntervalName: 'Wiederholungsintervall (Sekunden)',
            retryIntervalDesc: 'Wartezeit zwischen Wiederholungen.',
            maxRetriesName: 'Maximale Wiederholungen',
            maxRetriesDesc: 'Maximale Anzahl von Wiederholungsversuchen.',
            debugModeName: 'API-Fehler-Debugmodus',
            debugModeDesc: 'Ein: Aktiviert ausführliche Fehlerprotokolle (im DeepSeek-Stil) für alle Anbieter, um API-Probleme zu diagnostizieren. Aus: Verwendet standardmäßige knappe Fehlermeldungen.',
            diagnosticCallModeName: 'Diagnose-Aufrufmodus',
            diagnosticCallModeDesc: 'Wählen Sie den Laufzeit-Aufrufpfad, den die Entwicklerdiagnose für diesen Anbieter verwendet.',
            diagnosticTimeoutName: 'Diagnose-Timeout (Sekunden)',
            diagnosticTimeoutDesc: 'Timeout für jeden Durchlauf der Entwicklerdiagnose (15-3600 Sekunden).',
            stabilityRunsName: 'Stabilitätstest-Durchläufe',
            stabilityRunsDesc: 'Wie viele Wiederholungen in „Stabilitätstest ausführen“ ausgeführt werden (1-10).',
            longRequestName: 'Anbieterdiagnose für Entwickler (lange Anfrage)',
            longRequestDesc: 'Führen Sie eine lange Diagnoseanfrage mit dem ausgewählten Aufrufmodus aus und speichern Sie einen vollständigen Bericht im Vault-Stammverzeichnis.'
        },
        webResearch: {
            searchProviderName: 'Suchanbieter',
            searchProviderDesc: 'Engine für „Recherchieren und zusammenfassen“.',
            tavilyOption: 'Tavily (API-Schlüssel erforderlich)',
            duckduckgoOption: 'DuckDuckGo (experimentell)',
            tavilyApiKeyName: 'Tavily-API-Schlüssel',
            tavilyApiKeyDesc: 'Für Tavily erforderlich. Erhältlich auf tavily.com.',
            tavilyApiKeyPlaceholder: 'Tavily-API-Schlüssel eingeben (tvly-...)',
            tavilyMaxResultsName: 'Maximale Tavily-Ergebnisse',
            tavilyMaxResultsDesc: 'Maximale Anzahl an Ergebnissen (1-20).',
            tavilySearchDepthName: 'Tavily-Suchtiefe',
            tavilySearchDepthDesc: '„advanced“ verbraucht mehr Guthaben.',
            tavilySearchDepthBasic: 'Einfach',
            tavilySearchDepthAdvanced: 'Erweitert (2 Guthaben)',
            duckduckgoMaxResultsName: 'Maximale DuckDuckGo-Ergebnisse',
            duckduckgoMaxResultsDesc: 'Maximale Anzahl auszuwertender Ergebnisse.',
            duckduckgoFetchTimeoutName: 'DuckDuckGo-Timeout für Inhaltsabruf (Sekunden)',
            duckduckgoFetchTimeoutDesc: 'Maximale Wartezeit pro Ergebnis-URL.',
            maxResearchTokensName: 'Maximale Tokens für Rechercheinhalt',
            maxResearchTokensDesc: 'Ungefähre maximale Token-Anzahl aus Webergebnissen für den Zusammenfassungs-Prompt.'
        },
        duplicateScope: {
            modeName: 'Modus für den Duplikatsprüfungsbereich',
            modeDesc: 'Definiert den Bereich, in dem doppelte Gegenstücke gesucht werden.',
            optionVault: 'Gesamter Vault (Standard - vergleicht Konzeptnotizen mit allen anderen Notizen)',
            optionInclude: 'Nur bestimmte Ordner einschließen (vergleicht Konzeptnotizen mit Notizen in angegebenen Ordnern)',
            optionExclude: 'Bestimmte Ordner ausschließen (vergleicht Konzeptnotizen mit Notizen außerhalb der angegebenen Ordner)',
            optionConceptFolderOnly: 'Nur Konzeptordner (vergleicht Konzeptnotizen untereinander)',
            includeFoldersName: 'Ordner einschließen',
            excludeFoldersName: 'Ordner ausschließen',
            pathsDesc: 'Geben Sie relative Pfade (einen pro Zeile) für Ordner ein, die {mode} werden sollen. Erforderlich, wenn der Modus nicht „Gesamter Vault“ oder „Nur Konzeptordner“ ist. Pfade sind groß-/kleinschreibungssensitiv und verwenden „/“ als Trennzeichen.',
            pathsModeInclude: 'eingeschlossen',
            pathsModeExclude: 'ausgeschlossen',
            pathsPlaceholder: 'z. B. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Ungültiger Pfad: "{path}". Verwenden Sie "/" als Pfadtrennzeichen, nicht "\\".`,
            invalidCharacterNotice: 'Ungültiges Zeichen "{char}" im Pfad: "{path}". Verbotene Zeichen: Leerzeichen, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Ordnerpfade dürfen nicht leer sein, wenn der Modus „Einschließen“ oder „Ausschließen“ gewählt ist.',
            invalidPathsNotSaved: 'Ungültige(r) Pfad(e) erkannt. Einstellungen für dieses Feld wurden nicht gespeichert.'
        }
    }
});

extendLocale(STRINGS_ES, {
    settings: {
        stableApi: {
            enableName: 'Habilitar llamadas API estables (lógica de reintento)',
            enableDesc: 'Activado: vuelve a intentar automáticamente las llamadas fallidas a la API de LLM. Desactivado: falla en el primer error.',
            retryIntervalName: 'Intervalo de reintento (segundos)',
            retryIntervalDesc: 'Tiempo de espera entre reintentos.',
            maxRetriesName: 'Número máximo de reintentos',
            maxRetriesDesc: 'Cantidad máxima de intentos de reintento.',
            debugModeName: 'Modo de depuración de errores de API',
            debugModeDesc: 'Activado: habilita registros de error detallados (estilo DeepSeek) para todos los proveedores a fin de diagnosticar problemas de API. Desactivado: usa informes de error concisos estándar.',
            diagnosticCallModeName: 'Modo de llamada de diagnóstico',
            diagnosticCallModeDesc: 'Selecciona la ruta de llamada en tiempo de ejecución que usan los diagnósticos de desarrollador para este proveedor.',
            diagnosticTimeoutName: 'Tiempo de espera del diagnóstico (segundos)',
            diagnosticTimeoutDesc: 'Tiempo de espera para cada ejecución de diagnóstico de desarrollador (15-3600 segundos).',
            stabilityRunsName: 'Ejecuciones de la prueba de estabilidad',
            stabilityRunsDesc: 'Cuántas repeticiones ejecutar en «Ejecutar prueba de estabilidad» (1-10).',
            longRequestName: 'Diagnóstico del proveedor para desarrolladores (solicitud larga)',
            longRequestDesc: 'Ejecuta un diagnóstico de solicitud larga con el modo de llamada seleccionado y guarda un informe completo en la raíz del vault.'
        },
        webResearch: {
            searchProviderName: 'Proveedor de búsqueda',
            searchProviderDesc: 'Motor para «Investigar y resumir».',
            tavilyOption: 'Tavily (requiere clave API)',
            duckduckgoOption: 'DuckDuckGo (modo experimental)',
            tavilyApiKeyName: 'Clave API de Tavily',
            tavilyApiKeyDesc: 'Obligatoria para Tavily. Consíguela en tavily.com.',
            tavilyApiKeyPlaceholder: 'Introduce la clave API de Tavily (tvly-...)',
            tavilyMaxResultsName: 'Máximo de resultados de Tavily',
            tavilyMaxResultsDesc: 'Máximo de resultados (1-20).',
            tavilySearchDepthName: 'Profundidad de búsqueda de Tavily',
            tavilySearchDepthDesc: '«advanced» usa más créditos.',
            tavilySearchDepthBasic: 'Básica',
            tavilySearchDepthAdvanced: 'Avanzada (2 créditos)',
            duckduckgoMaxResultsName: 'Máximo de resultados de DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Cantidad máxima de resultados a analizar.',
            duckduckgoFetchTimeoutName: 'Tiempo de espera de recuperación de contenido de DuckDuckGo (segundos)',
            duckduckgoFetchTimeoutDesc: 'Tiempo máximo de espera por URL de resultado.',
            maxResearchTokensName: 'Máximo de tokens de contenido de investigación',
            maxResearchTokensDesc: 'Cantidad aproximada máxima de tokens tomados de resultados web para el prompt de resumen.'
        },
        duplicateScope: {
            modeName: 'Modo de alcance de comprobación de duplicados',
            modeDesc: 'Define el alcance para encontrar equivalentes duplicados.',
            optionVault: 'Vault completo (predeterminado: compara las notas de concepto con todas las demás notas)',
            optionInclude: 'Incluir solo carpetas específicas (compara las notas de concepto con notas en carpetas especificadas)',
            optionExclude: 'Excluir carpetas específicas (compara las notas de concepto con notas fuera de las carpetas especificadas)',
            optionConceptFolderOnly: 'Solo carpeta de conceptos (compara las notas de concepto entre sí)',
            includeFoldersName: 'Incluir carpetas',
            excludeFoldersName: 'Excluir carpetas',
            pathsDesc: 'Introduce rutas relativas (una por línea) para las carpetas que se deben {mode}. Es obligatorio si el modo no es «Vault completo» ni «Solo carpeta de conceptos». Las rutas distinguen mayúsculas y usan «/» como separador.',
            pathsModeInclude: 'incluir',
            pathsModeExclude: 'excluir',
            pathsPlaceholder: 'p. ej., Notes/ProjectA\nSource Material',
            invalidPathNotice: `Ruta no válida: "{path}". Usa "/" como separador de ruta, no "\\".`,
            invalidCharacterNotice: 'Carácter no válido "{char}" en la ruta: "{path}". Caracteres prohibidos: espacio, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Las rutas de carpeta no pueden estar vacías cuando se selecciona el modo «Incluir» o «Excluir».',
            invalidPathsNotSaved: 'Se detectaron rutas no válidas. No se guardaron los ajustes de este campo.'
        }
    }
});

extendLocale(STRINGS_FA, {
    settings: {
        stableApi: {
            enableName: 'فعال‌سازی فراخوانی‌های پایدار API (منطق تلاش مجدد)',
            enableDesc: 'روشن: فراخوانی‌های ناموفق LLM API را به‌صورت خودکار دوباره امتحان می‌کند. خاموش: در نخستین خطا متوقف می‌شود.',
            retryIntervalName: 'فاصلهٔ تلاش مجدد (ثانیه)',
            retryIntervalDesc: 'زمان انتظار بین تلاش‌های مجدد.',
            maxRetriesName: 'حداکثر تلاش مجدد',
            maxRetriesDesc: 'بیشترین تعداد تلاش مجدد.',
            debugModeName: 'حالت اشکال‌زدایی خطاهای API',
            debugModeDesc: 'روشن: ثبت خطای تفصیلی (به سبک DeepSeek) را برای همهٔ ارائه‌دهندگان فعال می‌کند تا به عیب‌یابی مشکلات API کمک کند. خاموش: از گزارش خطای استاندارد و خلاصه استفاده می‌کند.',
            diagnosticCallModeName: 'حالت فراخوانی عیب‌یابی',
            diagnosticCallModeDesc: 'مسیر فراخوانی زمان اجرا را که عیب‌یابی توسعه‌دهنده برای این ارائه‌دهنده استفاده می‌کند انتخاب کنید.',
            diagnosticTimeoutName: 'مهلت عیب‌یابی (ثانیه)',
            diagnosticTimeoutDesc: 'مهلت هر اجرای عیب‌یابی توسعه‌دهنده (15 تا 3600 ثانیه).',
            stabilityRunsName: 'دفعات آزمون پایداری',
            stabilityRunsDesc: 'اینکه در «اجرای آزمون پایداری» چند بار تکرار انجام شود (1 تا 10).',
            longRequestName: 'عیب‌یابی ارائه‌دهنده برای توسعه‌دهنده (درخواست طولانی)',
            longRequestDesc: 'یک عیب‌یابی با درخواست طولانی را با حالت فراخوانی انتخاب‌شده اجرا کنید و گزارش کامل را در ریشهٔ vault ذخیره کنید.'
        },
        webResearch: {
            searchProviderName: 'ارائه‌دهندهٔ جستجو',
            searchProviderDesc: 'موتور مورد استفاده برای «پژوهش و خلاصه‌سازی».',
            tavilyOption: 'Tavily (نیازمند کلید API)',
            duckduckgoOption: 'DuckDuckGo (آزمایشی)',
            tavilyApiKeyName: 'کلید API Tavily',
            tavilyApiKeyDesc: 'برای Tavily الزامی است. از tavily.com دریافت کنید.',
            tavilyApiKeyPlaceholder: 'کلید API Tavily را وارد کنید (tvly-...)',
            tavilyMaxResultsName: 'حداکثر نتایج Tavily',
            tavilyMaxResultsDesc: 'حداکثر نتایج (1 تا 20).',
            tavilySearchDepthName: 'عمق جستجوی Tavily',
            tavilySearchDepthDesc: 'حالت "advanced" اعتبار بیشتری مصرف می‌کند.',
            tavilySearchDepthBasic: 'پایه',
            tavilySearchDepthAdvanced: 'پیشرفته (2 اعتبار)',
            duckduckgoMaxResultsName: 'حداکثر نتایج DuckDuckGo',
            duckduckgoMaxResultsDesc: 'حداکثر تعداد نتایج برای پردازش.',
            duckduckgoFetchTimeoutName: 'مهلت دریافت محتوای DuckDuckGo (ثانیه)',
            duckduckgoFetchTimeoutDesc: 'بیشترین زمان انتظار برای هر URL نتیجه.',
            maxResearchTokensName: 'حداکثر توکن‌های محتوای پژوهش',
            maxResearchTokensDesc: 'حداکثر تقریبی توکن‌های گرفته‌شده از نتایج وب برای پرامپت خلاصه‌سازی.'
        },
        duplicateScope: {
            modeName: 'حالت دامنهٔ بررسی موارد تکراری',
            modeDesc: 'دامنهٔ یافتن همتایان تکراری را تعیین کنید.',
            optionVault: 'کل vault (پیش‌فرض - یادداشت‌های مفهومی را با همهٔ یادداشت‌های دیگر مقایسه می‌کند)',
            optionInclude: 'فقط پوشه‌های مشخص را شامل شود (یادداشت‌های مفهومی را با یادداشت‌های داخل پوشه‌های مشخص مقایسه می‌کند)',
            optionExclude: 'پوشه‌های مشخص را مستثنا کند (یادداشت‌های مفهومی را با یادداشت‌های بیرون از پوشه‌های مشخص مقایسه می‌کند)',
            optionConceptFolderOnly: 'فقط پوشهٔ مفاهیم (یادداشت‌های مفهومی را با یکدیگر مقایسه می‌کند)',
            includeFoldersName: 'شامل کردن پوشه‌ها',
            excludeFoldersName: 'مستثنا کردن پوشه‌ها',
            pathsDesc: 'مسیرهای نسبی (هر کدام در یک خط) را برای پوشه‌هایی که باید {mode} شوند وارد کنید. اگر حالت «کل vault» یا «فقط پوشهٔ مفاهیم» نباشد، این فیلد الزامی است. مسیرها به بزرگی و کوچکی حروف حساس‌اند و از "/" به‌عنوان جداکننده استفاده می‌کنند.',
            pathsModeInclude: 'شامل',
            pathsModeExclude: 'مستثنا',
            pathsPlaceholder: 'مثلاً Notes/ProjectA\nSource Material',
            invalidPathNotice: `مسیر نامعتبر: "{path}". از "/" به‌عنوان جداکنندهٔ مسیر استفاده کنید، نه "\\".`,
            invalidCharacterNotice: 'نویسهٔ نامعتبر "{char}" در مسیر "{path}". نویسه‌های ممنوع: فاصله، \\، <، >، :، |، ?، #، ^، [، ]',
            emptyPathsNotice: 'وقتی حالت «شامل» یا «مستثنا» انتخاب شده باشد، مسیر پوشه‌ها نمی‌تواند خالی باشد.',
            invalidPathsNotSaved: 'مسیر(های) نامعتبر شناسایی شد. تنظیمات این فیلد ذخیره نشد.'
        }
    }
});

extendLocale(STRINGS_FR, {
    settings: {
        stableApi: {
            enableName: 'Activer les appels API stables (logique de nouvelle tentative)',
            enableDesc: 'Activé : relance automatiquement les appels d’API LLM échoués. Désactivé : échoue dès la première erreur.',
            retryIntervalName: 'Intervalle de nouvelle tentative (secondes)',
            retryIntervalDesc: 'Temps d’attente entre deux tentatives.',
            maxRetriesName: 'Nombre maximal de tentatives',
            maxRetriesDesc: 'Nombre maximal de tentatives de reprise.',
            debugModeName: 'Mode de débogage des erreurs API',
            debugModeDesc: 'Activé : active une journalisation détaillée des erreurs (style DeepSeek) pour tous les fournisseurs afin d’aider au diagnostic des problèmes d’API. Désactivé : utilise des rapports d’erreur standard et concis.',
            diagnosticCallModeName: 'Mode d’appel de diagnostic',
            diagnosticCallModeDesc: 'Sélectionnez le chemin d’appel d’exécution utilisé par les diagnostics développeur pour ce fournisseur.',
            diagnosticTimeoutName: 'Délai d’expiration du diagnostic (secondes)',
            diagnosticTimeoutDesc: 'Délai d’expiration pour chaque exécution de diagnostic développeur (15 à 3600 secondes).',
            stabilityRunsName: 'Exécutions du test de stabilité',
            stabilityRunsDesc: 'Nombre de répétitions à effectuer dans « Lancer le test de stabilité » (1 à 10).',
            longRequestName: 'Diagnostic fournisseur développeur (requête longue)',
            longRequestDesc: 'Exécutez un diagnostic à requête longue avec le mode d’appel sélectionné et enregistrez un rapport complet à la racine du coffre.'
        },
        webResearch: {
            searchProviderName: 'Fournisseur de recherche',
            searchProviderDesc: 'Moteur utilisé pour « Rechercher et résumer ».',
            tavilyOption: 'Tavily (clé API requise)',
            duckduckgoOption: 'DuckDuckGo (expérimental)',
            tavilyApiKeyName: 'Clé API Tavily',
            tavilyApiKeyDesc: 'Obligatoire pour Tavily. À obtenir sur tavily.com.',
            tavilyApiKeyPlaceholder: 'Saisir la clé API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Nombre maximal de résultats Tavily',
            tavilyMaxResultsDesc: 'Nombre maximal de résultats (1-20).',
            tavilySearchDepthName: 'Profondeur de recherche Tavily',
            tavilySearchDepthDesc: '« advanced » consomme plus de crédits.',
            tavilySearchDepthBasic: 'Basique',
            tavilySearchDepthAdvanced: 'Avancé (2 crédits)',
            duckduckgoMaxResultsName: 'Nombre maximal de résultats DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Nombre maximal de résultats à analyser.',
            duckduckgoFetchTimeoutName: 'Délai de récupération du contenu DuckDuckGo (secondes)',
            duckduckgoFetchTimeoutDesc: 'Temps d’attente maximal par URL de résultat.',
            maxResearchTokensName: 'Nombre maximal de jetons de contenu de recherche',
            maxResearchTokensDesc: 'Nombre approximatif maximal de jetons provenant des résultats web pour l’invite de synthèse.'
        },
        duplicateScope: {
            modeName: 'Mode de portée de vérification des doublons',
            modeDesc: 'Définissez la portée pour trouver les correspondances en double.',
            optionVault: 'Coffre entier (par défaut - compare les notes de concept à toutes les autres notes)',
            optionInclude: 'Inclure uniquement des dossiers spécifiques (compare les notes de concept aux notes présentes dans les dossiers indiqués)',
            optionExclude: 'Exclure des dossiers spécifiques (compare les notes de concept aux notes situées hors des dossiers indiqués)',
            optionConceptFolderOnly: 'Dossier de concepts uniquement (compare les notes de concept entre elles)',
            includeFoldersName: 'Inclure les dossiers',
            excludeFoldersName: 'Exclure les dossiers',
            pathsDesc: 'Saisissez des chemins relatifs (un par ligne) pour les dossiers à {mode}. Requis si le mode n’est ni « Coffre entier » ni « Dossier de concepts uniquement ». Les chemins sont sensibles à la casse et utilisent « / » comme séparateur.',
            pathsModeInclude: 'inclure',
            pathsModeExclude: 'exclure',
            pathsPlaceholder: 'p. ex. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Chemin invalide : "{path}". Utilisez "/" comme séparateur de chemin, pas "\\".`,
            invalidCharacterNotice: 'Caractère invalide "{char}" dans le chemin : "{path}". Caractères interdits : espace, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Les chemins de dossier ne peuvent pas être vides lorsque le mode « Inclure » ou « Exclure » est sélectionné.',
            invalidPathsNotSaved: 'Chemin(s) invalide(s) détecté(s). Les réglages de ce champ n’ont pas été enregistrés.'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        stableApi: {
            enableName: 'Aktifkan panggilan API stabil (logika percobaan ulang)',
            enableDesc: 'Aktif: otomatis mencoba ulang panggilan API LLM yang gagal. Nonaktif: gagal pada kesalahan pertama.',
            retryIntervalName: 'Interval percobaan ulang (detik)',
            retryIntervalDesc: 'Waktu tunggu antar percobaan ulang.',
            maxRetriesName: 'Maksimum percobaan ulang',
            maxRetriesDesc: 'Jumlah maksimum percobaan ulang.',
            debugModeName: 'Mode debug kesalahan API',
            debugModeDesc: 'Aktif: mengaktifkan pencatatan kesalahan terperinci (gaya DeepSeek) untuk semua penyedia guna membantu mendiagnosis masalah API. Nonaktif: gunakan pelaporan kesalahan standar yang ringkas.',
            diagnosticCallModeName: 'Mode panggilan diagnostik',
            diagnosticCallModeDesc: 'Pilih jalur panggilan runtime yang digunakan diagnostik pengembang untuk penyedia ini.',
            diagnosticTimeoutName: 'Batas waktu diagnostik (detik)',
            diagnosticTimeoutDesc: 'Batas waktu untuk setiap eksekusi diagnostik pengembang (15-3600 detik).',
            stabilityRunsName: 'Jumlah uji stabilitas',
            stabilityRunsDesc: 'Berapa banyak pengulangan yang dijalankan dalam "Jalankan uji stabilitas" (1-10).',
            longRequestName: 'Diagnostik penyedia pengembang (permintaan panjang)',
            longRequestDesc: 'Jalankan satu diagnostik permintaan panjang dengan mode panggilan yang dipilih dan simpan laporan lengkap ke akar vault.'
        },
        webResearch: {
            searchProviderName: 'Penyedia pencarian',
            searchProviderDesc: 'Mesin untuk "Teliti dan rangkum".',
            tavilyOption: 'Tavily (memerlukan kunci API)',
            duckduckgoOption: 'DuckDuckGo (eksperimental)',
            tavilyApiKeyName: 'Kunci API Tavily',
            tavilyApiKeyDesc: 'Wajib untuk Tavily. Dapatkan dari tavily.com.',
            tavilyApiKeyPlaceholder: 'Masukkan kunci API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Hasil maksimum Tavily',
            tavilyMaxResultsDesc: 'Jumlah hasil maksimum (1-20).',
            tavilySearchDepthName: 'Kedalaman pencarian Tavily',
            tavilySearchDepthDesc: '"advanced" menggunakan lebih banyak kredit.',
            tavilySearchDepthBasic: 'Dasar',
            tavilySearchDepthAdvanced: 'Lanjutan (2 kredit)',
            duckduckgoMaxResultsName: 'Hasil maksimum DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Jumlah hasil maksimum yang akan diurai.',
            duckduckgoFetchTimeoutName: 'Batas waktu pengambilan konten DuckDuckGo (detik)',
            duckduckgoFetchTimeoutDesc: 'Waktu tunggu maksimum per URL hasil.',
            maxResearchTokensName: 'Token maksimum konten riset',
            maxResearchTokensDesc: 'Perkiraan jumlah token maksimum dari hasil web untuk prompt peringkasan.'
        },
        duplicateScope: {
            modeName: 'Mode cakupan pemeriksaan duplikat',
            modeDesc: 'Tentukan cakupan untuk menemukan padanan duplikat.',
            optionVault: 'Seluruh vault (default - membandingkan catatan konsep dengan semua catatan lain)',
            optionInclude: 'Hanya sertakan folder tertentu (membandingkan catatan konsep dengan catatan di folder yang ditentukan)',
            optionExclude: 'Kecualikan folder tertentu (membandingkan catatan konsep dengan catatan di luar folder yang ditentukan)',
            optionConceptFolderOnly: 'Hanya folder konsep (membandingkan catatan konsep satu sama lain)',
            includeFoldersName: 'Sertakan folder',
            excludeFoldersName: 'Kecualikan folder',
            pathsDesc: 'Masukkan jalur relatif (satu per baris) untuk folder yang akan di-{mode}. Wajib diisi jika mode bukan "Seluruh vault" atau "Hanya folder konsep". Jalur peka huruf besar-kecil dan menggunakan "/" sebagai pemisah.',
            pathsModeInclude: 'sertakan',
            pathsModeExclude: 'kecualikan',
            pathsPlaceholder: 'mis. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Jalur tidak valid: "{path}". Gunakan "/" sebagai pemisah jalur, bukan "\\".`,
            invalidCharacterNotice: 'Karakter tidak valid "{char}" pada jalur: "{path}". Karakter terlarang: spasi, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Jalur folder tidak boleh kosong saat mode "Sertakan" atau "Kecualikan" dipilih.',
            invalidPathsNotSaved: 'Terdeteksi jalur tidak valid. Pengaturan untuk bidang ini tidak disimpan.'
        }
    }
});

extendLocale(STRINGS_IT, {
    settings: {
        stableApi: {
            enableName: 'Abilita chiamate API stabili (logica di retry)',
            enableDesc: 'Attivo: ritenta automaticamente le chiamate API LLM non riuscite. Disattivo: interrompe al primo errore.',
            retryIntervalName: 'Intervallo di retry (secondi)',
            retryIntervalDesc: 'Tempo di attesa tra un retry e l’altro.',
            maxRetriesName: 'Numero massimo di retry',
            maxRetriesDesc: 'Numero massimo di tentativi di retry.',
            debugModeName: 'Modalità di debug errori API',
            debugModeDesc: 'Attivo: abilita il logging dettagliato degli errori (stile DeepSeek) per tutti i provider, per aiutare a diagnosticare i problemi API. Disattivo: usa segnalazioni di errore standard e concise.',
            diagnosticCallModeName: 'Modalità di chiamata diagnostica',
            diagnosticCallModeDesc: 'Seleziona il percorso di chiamata runtime usato dalla diagnostica sviluppatore per questo provider.',
            diagnosticTimeoutName: 'Timeout diagnostica (secondi)',
            diagnosticTimeoutDesc: 'Timeout per ogni esecuzione della diagnostica sviluppatore (15-3600 secondi).',
            stabilityRunsName: 'Esecuzioni del test di stabilità',
            stabilityRunsDesc: 'Quante ripetizioni eseguire in "Esegui test di stabilità" (1-10).',
            longRequestName: 'Diagnostica provider per sviluppatori (richiesta lunga)',
            longRequestDesc: 'Esegui una diagnostica con richiesta lunga usando la modalità di chiamata selezionata e salva un report completo nella radice del vault.'
        },
        webResearch: {
            searchProviderName: 'Provider di ricerca',
            searchProviderDesc: 'Motore usato per "Ricerca e riepiloga".',
            tavilyOption: 'Tavily (richiede chiave API)',
            duckduckgoOption: 'DuckDuckGo (sperimentale)',
            tavilyApiKeyName: 'Chiave API Tavily',
            tavilyApiKeyDesc: 'Obbligatoria per Tavily. Ottienila da tavily.com.',
            tavilyApiKeyPlaceholder: 'Inserisci la chiave API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Risultati massimi Tavily',
            tavilyMaxResultsDesc: 'Numero massimo di risultati (1-20).',
            tavilySearchDepthName: 'Profondità di ricerca Tavily',
            tavilySearchDepthDesc: '"advanced" usa più crediti.',
            tavilySearchDepthBasic: 'Base',
            tavilySearchDepthAdvanced: 'Avanzata (2 crediti)',
            duckduckgoMaxResultsName: 'Risultati massimi DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Numero massimo di risultati da analizzare.',
            duckduckgoFetchTimeoutName: 'Timeout recupero contenuti DuckDuckGo (secondi)',
            duckduckgoFetchTimeoutDesc: 'Tempo massimo di attesa per ogni URL di risultato.',
            maxResearchTokensName: 'Token massimi del contenuto di ricerca',
            maxResearchTokensDesc: 'Numero massimo approssimativo di token dai risultati web per il prompt di riepilogo.'
        },
        duplicateScope: {
            modeName: 'Modalità ambito controllo duplicati',
            modeDesc: 'Definisci l’ambito per trovare controparti duplicate.',
            optionVault: 'Intero vault (predefinito - confronta le note concetto con tutte le altre note)',
            optionInclude: 'Includi solo cartelle specifiche (confronta le note concetto con le note nelle cartelle specificate)',
            optionExclude: 'Escludi cartelle specifiche (confronta le note concetto con le note fuori dalle cartelle specificate)',
            optionConceptFolderOnly: 'Solo cartella concetti (confronta le note concetto tra loro)',
            includeFoldersName: 'Includi cartelle',
            excludeFoldersName: 'Escludi cartelle',
            pathsDesc: 'Inserisci i percorsi relativi (uno per riga) delle cartelle da {mode}. Obbligatorio se la modalità non è "Intero vault" o "Solo cartella concetti". I percorsi distinguono tra maiuscole e minuscole e usano "/" come separatore.',
            pathsModeInclude: 'includere',
            pathsModeExclude: 'escludere',
            pathsPlaceholder: 'es. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Percorso non valido: "{path}". Usa "/" come separatore di percorso, non "\\".`,
            invalidCharacterNotice: 'Carattere non valido "{char}" nel percorso: "{path}". Caratteri vietati: spazio, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'I percorsi delle cartelle non possono essere vuoti quando è selezionata la modalità "Includi" o "Escludi".',
            invalidPathsNotSaved: 'Rilevato/i percorso/i non valido/i. Le impostazioni di questo campo non sono state salvate.'
        }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        stableApi: {
            enableName: '安定した API 呼び出しを有効化（リトライロジック）',
            enableDesc: 'オン: 失敗した LLM API 呼び出しを自動で再試行します。オフ: 最初のエラーで失敗します。',
            retryIntervalName: '再試行間隔（秒）',
            retryIntervalDesc: '再試行の間に待機する時間です。',
            maxRetriesName: '最大再試行回数',
            maxRetriesDesc: '再試行の最大回数です。',
            debugModeName: 'API エラーデバッグモード',
            debugModeDesc: 'オン: すべてのプロバイダーで詳細なエラーログ（DeepSeek スタイル）を有効にし、API 問題の診断を支援します。オフ: 標準の簡潔なエラー報告を使用します。',
            diagnosticCallModeName: '診断呼び出しモード',
            diagnosticCallModeDesc: 'このプロバイダーに対して開発者診断が使用する実行時の呼び出し経路を選択します。',
            diagnosticTimeoutName: '診断タイムアウト（秒）',
            diagnosticTimeoutDesc: '各開発者診断実行のタイムアウトです（15〜3600 秒）。',
            stabilityRunsName: '安定性テストの実行回数',
            stabilityRunsDesc: '「安定性テストを実行」で繰り返す回数です（1〜10）。',
            longRequestName: '開発者向けプロバイダー診断（長時間リクエスト）',
            longRequestDesc: '選択した呼び出しモードで長時間リクエスト診断を 1 回実行し、完全なレポートを Vault ルートに保存します。'
        },
        webResearch: {
            searchProviderName: '検索プロバイダー',
            searchProviderDesc: '「調査して要約」で使用するエンジンです。',
            tavilyOption: 'Tavily（API キーが必要）',
            duckduckgoOption: 'DuckDuckGo（実験的）',
            tavilyApiKeyName: 'Tavily API キー',
            tavilyApiKeyDesc: 'Tavily には必須です。tavily.com で取得してください。',
            tavilyApiKeyPlaceholder: 'Tavily API キーを入力 (tvly-...)',
            tavilyMaxResultsName: 'Tavily 最大結果数',
            tavilyMaxResultsDesc: '最大結果数（1〜20）。',
            tavilySearchDepthName: 'Tavily 検索深度',
            tavilySearchDepthDesc: '「advanced」はより多くのクレジットを使用します。',
            tavilySearchDepthBasic: '基本',
            tavilySearchDepthAdvanced: '高度（2 クレジット）',
            duckduckgoMaxResultsName: 'DuckDuckGo 最大結果数',
            duckduckgoMaxResultsDesc: '解析する結果の最大数です。',
            duckduckgoFetchTimeoutName: 'DuckDuckGo コンテンツ取得タイムアウト（秒）',
            duckduckgoFetchTimeoutDesc: '各結果 URL ごとの最大待機時間です。',
            maxResearchTokensName: '調査コンテンツの最大トークン数',
            maxResearchTokensDesc: '要約プロンプトに使用する Web 結果由来トークンの概算上限です。'
        },
        duplicateScope: {
            modeName: '重複チェック範囲モード',
            modeDesc: '重複候補を探す範囲を定義します。',
            optionVault: 'Vault 全体（既定 - 概念ノートを他のすべてのノートと比較）',
            optionInclude: '特定フォルダーのみ含める（概念ノートを指定フォルダー内のノートと比較）',
            optionExclude: '特定フォルダーを除外する（概念ノートを指定フォルダー外のノートと比較）',
            optionConceptFolderOnly: '概念フォルダーのみ（概念ノート同士を比較）',
            includeFoldersName: '含めるフォルダー',
            excludeFoldersName: '除外するフォルダー',
            pathsDesc: '{mode} 対象のフォルダー相対パスを 1 行に 1 つずつ入力してください。モードが「Vault 全体」または「概念フォルダーのみ」でない場合は必須です。パスは大文字小文字を区別し、区切りには "/" を使用します。',
            pathsModeInclude: '含める',
            pathsModeExclude: '除外する',
            pathsPlaceholder: '例: Notes/ProjectA\nSource Material',
            invalidPathNotice: `無効なパスです: "{path}"。パス区切りには "\\" ではなく "/" を使用してください。`,
            invalidCharacterNotice: 'パス "{path}" に無効な文字 "{char}" があります。使用禁止文字: 空白、\\、<、>、:、|、?、#、^、[、]',
            emptyPathsNotice: '「含める」または「除外する」モードが選択されている場合、フォルダーパスを空にできません。',
            invalidPathsNotSaved: '無効なパスが検出されたため、このフィールドの設定は保存されませんでした。'
        }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        stableApi: {
            enableName: '안정적인 API 호출 활성화(재시도 로직)',
            enableDesc: '켜기: 실패한 LLM API 호출을 자동으로 재시도합니다. 끄기: 첫 오류에서 실패합니다.',
            retryIntervalName: '재시도 간격(초)',
            retryIntervalDesc: '재시도 사이의 대기 시간입니다.',
            maxRetriesName: '최대 재시도 횟수',
            maxRetriesDesc: '재시도의 최대 시도 횟수입니다.',
            debugModeName: 'API 오류 디버깅 모드',
            debugModeDesc: '켜기: 모든 공급자에 대해 상세 오류 로깅(DeepSeek 스타일)을 활성화하여 API 문제 진단을 돕습니다. 끄기: 표준의 간결한 오류 보고를 사용합니다.',
            diagnosticCallModeName: '진단 호출 모드',
            diagnosticCallModeDesc: '이 공급자에 대해 개발자 진단이 사용할 런타임 호출 경로를 선택합니다.',
            diagnosticTimeoutName: '진단 시간 제한(초)',
            diagnosticTimeoutDesc: '각 개발자 진단 실행의 시간 제한입니다(15-3600초).',
            stabilityRunsName: '안정성 테스트 실행 횟수',
            stabilityRunsDesc: '"안정성 테스트 실행"에서 반복 실행할 횟수입니다(1-10).',
            longRequestName: '개발자 공급자 진단(장시간 요청)',
            longRequestDesc: '선택한 호출 모드로 장시간 요청 진단을 한 번 실행하고 전체 보고서를 Vault 루트에 저장합니다.'
        },
        webResearch: {
            searchProviderName: '검색 공급자',
            searchProviderDesc: '"조사 및 요약"에 사용하는 엔진입니다.',
            tavilyOption: 'Tavily(API 키 필요)',
            duckduckgoOption: 'DuckDuckGo(실험적)',
            tavilyApiKeyName: 'Tavily API 키',
            tavilyApiKeyDesc: 'Tavily에 필수입니다. tavily.com에서 받으세요.',
            tavilyApiKeyPlaceholder: 'Tavily API 키 입력 (tvly-...)',
            tavilyMaxResultsName: 'Tavily 최대 결과 수',
            tavilyMaxResultsDesc: '최대 결과 수(1-20)입니다.',
            tavilySearchDepthName: 'Tavily 검색 깊이',
            tavilySearchDepthDesc: '"advanced"는 더 많은 크레딧을 사용합니다.',
            tavilySearchDepthBasic: '기본',
            tavilySearchDepthAdvanced: '고급(2 크레딧)',
            duckduckgoMaxResultsName: 'DuckDuckGo 최대 결과 수',
            duckduckgoMaxResultsDesc: '파싱할 최대 결과 수입니다.',
            duckduckgoFetchTimeoutName: 'DuckDuckGo 콘텐츠 가져오기 시간 제한(초)',
            duckduckgoFetchTimeoutDesc: '결과 URL당 최대 대기 시간입니다.',
            maxResearchTokensName: '연구 콘텐츠 최대 토큰 수',
            maxResearchTokensDesc: '요약 프롬프트에 사용할 웹 결과 기반 토큰의 대략적인 상한입니다.'
        },
        duplicateScope: {
            modeName: '중복 검사 범위 모드',
            modeDesc: '중복 대응 항목을 찾을 범위를 정의합니다.',
            optionVault: '전체 Vault(기본값 - 개념 노트를 다른 모든 노트와 비교)',
            optionInclude: '특정 폴더만 포함(개념 노트를 지정한 폴더의 노트와 비교)',
            optionExclude: '특정 폴더 제외(개념 노트를 지정한 폴더 밖의 노트와 비교)',
            optionConceptFolderOnly: '개념 폴더만(개념 노트끼리 비교)',
            includeFoldersName: '포함할 폴더',
            excludeFoldersName: '제외할 폴더',
            pathsDesc: '{mode}할 폴더의 상대 경로를 한 줄에 하나씩 입력하세요. 모드가 "전체 Vault" 또는 "개념 폴더만"이 아닌 경우 필수입니다. 경로는 대소문자를 구분하며 구분자로 "/"를 사용합니다.',
            pathsModeInclude: '포함',
            pathsModeExclude: '제외',
            pathsPlaceholder: '예: Notes/ProjectA\nSource Material',
            invalidPathNotice: `잘못된 경로: "{path}". 경로 구분자로 "\\"가 아니라 "/"를 사용하세요.`,
            invalidCharacterNotice: '경로 "{path}"에 잘못된 문자 "{char}"가 있습니다. 금지 문자: 공백, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: '"포함" 또는 "제외" 모드가 선택된 경우 폴더 경로를 비워 둘 수 없습니다.',
            invalidPathsNotSaved: '잘못된 경로가 감지되었습니다. 이 필드의 설정은 저장되지 않았습니다.'
        }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        stableApi: {
            enableName: 'Stabiele API-aanroepen inschakelen (herhalingslogica)',
            enableDesc: 'Aan: mislukte LLM-API-aanroepen automatisch opnieuw proberen. Uit: falen bij de eerste fout.',
            retryIntervalName: 'Herhaalinterval (seconden)',
            retryIntervalDesc: 'Wachttijd tussen herhalingen.',
            maxRetriesName: 'Maximaal aantal herhalingen',
            maxRetriesDesc: 'Maximaal aantal herhaalpogingen.',
            debugModeName: 'API-foutdebugmodus',
            debugModeDesc: 'Aan: schakelt gedetailleerde foutlogging in (DeepSeek-stijl) voor alle providers om API-problemen te helpen diagnosticeren. Uit: gebruikt standaard beknopte foutmeldingen.',
            diagnosticCallModeName: 'Diagnostische oproepmodus',
            diagnosticCallModeDesc: 'Selecteer het runtime-oproeppad dat ontwikkelaarsdiagnostiek voor deze provider gebruikt.',
            diagnosticTimeoutName: 'Diagnostische time-out (seconden)',
            diagnosticTimeoutDesc: 'Time-out voor elke uitvoering van ontwikkelaarsdiagnostiek (15-3600 seconden).',
            stabilityRunsName: 'Uitvoeringen van stabiliteitstest',
            stabilityRunsDesc: 'Hoeveel herhalingen moeten worden uitgevoerd in "Stabiliteitstest uitvoeren" (1-10).',
            longRequestName: 'Ontwikkelaarsdiagnostiek voor provider (lange aanvraag)',
            longRequestDesc: 'Voer één lange-aanvraagdiagnostiek uit met de geselecteerde oproepmodus en sla een volledig rapport op in de hoofdmap van de vault.'
        },
        webResearch: {
            searchProviderName: 'Zoekprovider',
            searchProviderDesc: 'Engine voor "Onderzoeken en samenvatten".',
            tavilyOption: 'Tavily (API-sleutel vereist)',
            duckduckgoOption: 'DuckDuckGo (experimenteel)',
            tavilyApiKeyName: 'Tavily API-sleutel',
            tavilyApiKeyDesc: 'Vereist voor Tavily. Verkrijgbaar via tavily.com.',
            tavilyApiKeyPlaceholder: 'Voer Tavily API-sleutel in (tvly-...)',
            tavilyMaxResultsName: 'Maximaal aantal Tavily-resultaten',
            tavilyMaxResultsDesc: 'Maximaal aantal resultaten (1-20).',
            tavilySearchDepthName: 'Tavily-zoekdiepte',
            tavilySearchDepthDesc: '"advanced" gebruikt meer credits.',
            tavilySearchDepthBasic: 'Basis',
            tavilySearchDepthAdvanced: 'Geavanceerd (2 credits)',
            duckduckgoMaxResultsName: 'Maximaal aantal DuckDuckGo-resultaten',
            duckduckgoMaxResultsDesc: 'Maximaal aantal te parseren resultaten.',
            duckduckgoFetchTimeoutName: 'Time-out voor DuckDuckGo-inhoudsophaling (seconden)',
            duckduckgoFetchTimeoutDesc: 'Maximale wachttijd per resultaat-URL.',
            maxResearchTokensName: 'Maximaal aantal onderzoekstokens',
            maxResearchTokensDesc: 'Benaderende bovengrens van tokens uit webresultaten voor de samenvattingsprompt.'
        },
        duplicateScope: {
            modeName: 'Bereikmodus voor duplicaatcontrole',
            modeDesc: 'Definieer het bereik voor het vinden van dubbele tegenhangers.',
            optionVault: 'Volledige vault (standaard - vergelijkt conceptnotities met alle andere notities)',
            optionInclude: 'Alleen specifieke mappen opnemen (vergelijkt conceptnotities met notities in opgegeven mappen)',
            optionExclude: 'Specifieke mappen uitsluiten (vergelijkt conceptnotities met notities buiten opgegeven mappen)',
            optionConceptFolderOnly: 'Alleen conceptmap (vergelijkt conceptnotities onderling)',
            includeFoldersName: 'Mappen opnemen',
            excludeFoldersName: 'Mappen uitsluiten',
            pathsDesc: 'Voer relatieve paden in (één per regel) voor mappen die moeten worden {mode}. Vereist als de modus niet "Volledige vault" of "Alleen conceptmap" is. Paden zijn hoofdlettergevoelig en gebruiken "/" als scheidingsteken.',
            pathsModeInclude: 'opgenomen',
            pathsModeExclude: 'uitgesloten',
            pathsPlaceholder: 'bijv. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Ongeldig pad: "{path}". Gebruik "/" als padscheidingsteken, niet "\\".`,
            invalidCharacterNotice: 'Ongeldig teken "{char}" in pad: "{path}". Verboden tekens: spatie, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Mappaden mogen niet leeg zijn wanneer de modus "Opnemen" of "Uitsluiten" is geselecteerd.',
            invalidPathsNotSaved: 'Ongeldig(e) pad(en) gedetecteerd. Instellingen voor dit veld zijn niet opgeslagen.'
        }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        stableApi: {
            enableName: 'Włącz stabilne wywołania API (logika ponowień)',
            enableDesc: 'Wł.: automatycznie ponawia nieudane wywołania API LLM. Wył.: kończy się błędem przy pierwszym błędzie.',
            retryIntervalName: 'Odstęp ponawiania (sekundy)',
            retryIntervalDesc: 'Czas oczekiwania między ponowieniami.',
            maxRetriesName: 'Maksymalna liczba ponowień',
            maxRetriesDesc: 'Maksymalna liczba prób ponowienia.',
            debugModeName: 'Tryb debugowania błędów API',
            debugModeDesc: 'Wł.: włącza szczegółowe logowanie błędów (w stylu DeepSeek) dla wszystkich dostawców, aby pomóc diagnozować problemy API. Wył.: używa standardowego, zwięzłego raportowania błędów.',
            diagnosticCallModeName: 'Tryb wywołania diagnostycznego',
            diagnosticCallModeDesc: 'Wybierz ścieżkę wywołania w czasie działania używaną przez diagnostykę deweloperską dla tego dostawcy.',
            diagnosticTimeoutName: 'Limit czasu diagnostyki (sekundy)',
            diagnosticTimeoutDesc: 'Limit czasu dla każdego uruchomienia diagnostyki deweloperskiej (15-3600 sekund).',
            stabilityRunsName: 'Liczba uruchomień testu stabilności',
            stabilityRunsDesc: 'Ile powtórzeń wykonać w „Uruchom test stabilności” (1-10).',
            longRequestName: 'Diagnostyka dostawcy dla dewelopera (długie żądanie)',
            longRequestDesc: 'Uruchom jedno długie żądanie diagnostyczne z wybranym trybem wywołania i zapisz pełny raport w katalogu głównym vaultu.'
        },
        webResearch: {
            searchProviderName: 'Dostawca wyszukiwania',
            searchProviderDesc: 'Silnik używany w „Zbadaj i podsumuj”.',
            tavilyOption: 'Tavily (wymaga klucza API)',
            duckduckgoOption: 'DuckDuckGo (eksperymentalne)',
            tavilyApiKeyName: 'Klucz API Tavily',
            tavilyApiKeyDesc: 'Wymagany dla Tavily. Uzyskaj go z tavily.com.',
            tavilyApiKeyPlaceholder: 'Wprowadź klucz API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Maksymalna liczba wyników Tavily',
            tavilyMaxResultsDesc: 'Maksymalna liczba wyników (1-20).',
            tavilySearchDepthName: 'Głębokość wyszukiwania Tavily',
            tavilySearchDepthDesc: '„advanced” zużywa więcej kredytów.',
            tavilySearchDepthBasic: 'Podstawowa',
            tavilySearchDepthAdvanced: 'Zaawansowana (2 kredyty)',
            duckduckgoMaxResultsName: 'Maksymalna liczba wyników DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Maksymalna liczba wyników do przetworzenia.',
            duckduckgoFetchTimeoutName: 'Limit czasu pobierania treści DuckDuckGo (sekundy)',
            duckduckgoFetchTimeoutDesc: 'Maksymalny czas oczekiwania dla każdego adresu URL wyniku.',
            maxResearchTokensName: 'Maksymalna liczba tokenów treści badawczych',
            maxResearchTokensDesc: 'Przybliżony maksymalny limit tokenów z wyników sieciowych dla promptu podsumowania.'
        },
        duplicateScope: {
            modeName: 'Tryb zakresu sprawdzania duplikatów',
            modeDesc: 'Zdefiniuj zakres wyszukiwania duplikatów odpowiedników.',
            optionVault: 'Cały vault (domyślnie - porównuje notatki pojęciowe ze wszystkimi innymi notatkami)',
            optionInclude: 'Uwzględnij tylko określone foldery (porównuje notatki pojęciowe z notatkami w wskazanych folderach)',
            optionExclude: 'Wyklucz określone foldery (porównuje notatki pojęciowe z notatkami poza wskazanymi folderami)',
            optionConceptFolderOnly: 'Tylko folder pojęć (porównuje notatki pojęciowe między sobą)',
            includeFoldersName: 'Uwzględniane foldery',
            excludeFoldersName: 'Wykluczane foldery',
            pathsDesc: 'Wprowadź ścieżki względne (po jednej w wierszu) dla folderów, które mają zostać {mode}. Wymagane, jeśli tryb nie jest ustawiony na „Cały vault” ani „Tylko folder pojęć”. Ścieżki rozróżniają wielkość liter i używają „/” jako separatora.',
            pathsModeInclude: 'uwzględnione',
            pathsModeExclude: 'wykluczone',
            pathsPlaceholder: 'np. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Nieprawidłowa ścieżka: "{path}". Użyj "/" jako separatora ścieżki, a nie "\\".`,
            invalidCharacterNotice: 'Nieprawidłowy znak "{char}" w ścieżce: "{path}". Zabronione znaki: spacja, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Ścieżki folderów nie mogą być puste, gdy wybrano tryb „Uwzględnij” lub „Wyklucz”.',
            invalidPathsNotSaved: 'Wykryto nieprawidłowe ścieżki. Ustawienia tego pola nie zostały zapisane.'
        }
    }
});

extendLocale(STRINGS_PT, {
    settings: {
        stableApi: {
            enableName: 'Ativar chamadas de API estáveis (lógica de repetição)',
            enableDesc: 'Ligado: repete automaticamente chamadas falhadas à API do LLM. Desligado: falha ao primeiro erro.',
            retryIntervalName: 'Intervalo de repetição (segundos)',
            retryIntervalDesc: 'Tempo de espera entre repetições.',
            maxRetriesName: 'Número máximo de repetições',
            maxRetriesDesc: 'Número máximo de tentativas de repetição.',
            debugModeName: 'Modo de depuração de erros da API',
            debugModeDesc: 'Ligado: ativa registo detalhado de erros (estilo DeepSeek) para todos os fornecedores, ajudando a diagnosticar problemas de API. Desligado: usa relatórios de erro padrão e concisos.',
            diagnosticCallModeName: 'Modo de chamada de diagnóstico',
            diagnosticCallModeDesc: 'Selecione o caminho de chamada em tempo de execução usado pelos diagnósticos de programador para este fornecedor.',
            diagnosticTimeoutName: 'Tempo limite de diagnóstico (segundos)',
            diagnosticTimeoutDesc: 'Tempo limite para cada execução de diagnóstico de programador (15-3600 segundos).',
            stabilityRunsName: 'Execuções do teste de estabilidade',
            stabilityRunsDesc: 'Quantas repetições executar em "Executar teste de estabilidade" (1-10).',
            longRequestName: 'Diagnóstico do fornecedor para programadores (pedido longo)',
            longRequestDesc: 'Execute um diagnóstico de pedido longo com o modo de chamada selecionado e guarde um relatório completo na raiz do vault.'
        },
        webResearch: {
            searchProviderName: 'Fornecedor de pesquisa',
            searchProviderDesc: 'Motor usado em "Pesquisar e resumir".',
            tavilyOption: 'Tavily (requer chave API)',
            duckduckgoOption: 'DuckDuckGo (modo experimental)',
            tavilyApiKeyName: 'Chave API Tavily',
            tavilyApiKeyDesc: 'Obrigatória para o Tavily. Obtenha-a em tavily.com.',
            tavilyApiKeyPlaceholder: 'Introduza a chave API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Máximo de resultados Tavily',
            tavilyMaxResultsDesc: 'Máximo de resultados (1-20).',
            tavilySearchDepthName: 'Profundidade de pesquisa Tavily',
            tavilySearchDepthDesc: '"advanced" usa mais créditos.',
            tavilySearchDepthBasic: 'Básica',
            tavilySearchDepthAdvanced: 'Avançada (2 créditos)',
            duckduckgoMaxResultsName: 'Máximo de resultados DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Máximo de resultados a processar.',
            duckduckgoFetchTimeoutName: 'Tempo limite de recolha de conteúdo DuckDuckGo (segundos)',
            duckduckgoFetchTimeoutDesc: 'Tempo máximo de espera por URL de resultado.',
            maxResearchTokensName: 'Máximo de tokens de conteúdo de pesquisa',
            maxResearchTokensDesc: 'Máximo aproximado de tokens de resultados web para o prompt de resumo.'
        },
        duplicateScope: {
            modeName: 'Modo de âmbito da verificação de duplicados',
            modeDesc: 'Defina o âmbito para encontrar correspondências duplicadas.',
            optionVault: 'Vault inteiro (predefinição - compara notas de conceito com todas as outras notas)',
            optionInclude: 'Incluir apenas pastas específicas (compara notas de conceito com notas nas pastas indicadas)',
            optionExclude: 'Excluir pastas específicas (compara notas de conceito com notas fora das pastas indicadas)',
            optionConceptFolderOnly: 'Apenas pasta de conceitos (compara notas de conceito entre si)',
            includeFoldersName: 'Incluir pastas',
            excludeFoldersName: 'Excluir pastas',
            pathsDesc: 'Introduza caminhos relativos (um por linha) para as pastas a {mode}. Obrigatório se o modo não for "Vault inteiro" nem "Apenas pasta de conceitos". Os caminhos distinguem maiúsculas de minúsculas e usam "/" como separador.',
            pathsModeInclude: 'incluir',
            pathsModeExclude: 'excluir',
            pathsPlaceholder: 'Ex.: Notes/ProjectA\nSource Material',
            invalidPathNotice: `Caminho inválido: "{path}". Use "/" como separador de caminho, não "\\".`,
            invalidCharacterNotice: 'Carácter inválido "{char}" no caminho: "{path}". Caracteres proibidos: espaço, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Os caminhos das pastas não podem ficar vazios quando o modo "Incluir" ou "Excluir" está selecionado.',
            invalidPathsNotSaved: 'Foram detetados caminhos inválidos. As definições deste campo não foram guardadas.'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    settings: {
        stableApi: {
            enableName: 'Ativar chamadas de API estáveis (lógica de repetição)',
            enableDesc: 'Ativado: repete automaticamente chamadas com falha da API do LLM. Desativado: falha no primeiro erro.',
            retryIntervalName: 'Intervalo de repetição (segundos)',
            retryIntervalDesc: 'Tempo de espera entre as repetições.',
            maxRetriesName: 'Número máximo de repetições',
            maxRetriesDesc: 'Número máximo de tentativas de repetição.',
            debugModeName: 'Modo de depuração de erros da API',
            debugModeDesc: 'Ativado: habilita registro detalhado de erros (estilo DeepSeek) para todos os provedores, ajudando a diagnosticar problemas de API. Desativado: usa relatórios de erro padrão e concisos.',
            diagnosticCallModeName: 'Modo de chamada de diagnóstico',
            diagnosticCallModeDesc: 'Selecione o caminho de chamada em tempo de execução usado pelos diagnósticos de desenvolvedor para este provedor.',
            diagnosticTimeoutName: 'Tempo limite de diagnóstico (segundos)',
            diagnosticTimeoutDesc: 'Tempo limite para cada execução de diagnóstico de desenvolvedor (15-3600 segundos).',
            stabilityRunsName: 'Execuções do teste de estabilidade',
            stabilityRunsDesc: 'Quantas repetições executar em "Executar teste de estabilidade" (1-10).',
            longRequestName: 'Diagnóstico do provedor para desenvolvedores (requisição longa)',
            longRequestDesc: 'Execute um diagnóstico de requisição longa com o modo de chamada selecionado e salve um relatório completo na raiz do vault.'
        },
        webResearch: {
            searchProviderName: 'Provedor de busca',
            searchProviderDesc: 'Mecanismo usado em "Pesquisar e resumir".',
            tavilyOption: 'Tavily (requer chave de API)',
            duckduckgoOption: 'DuckDuckGo (modo experimental)',
            tavilyApiKeyName: 'Chave de API Tavily',
            tavilyApiKeyDesc: 'Obrigatória para o Tavily. Obtenha em tavily.com.',
            tavilyApiKeyPlaceholder: 'Digite a chave de API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Máximo de resultados Tavily',
            tavilyMaxResultsDesc: 'Máximo de resultados (1-20).',
            tavilySearchDepthName: 'Profundidade de busca Tavily',
            tavilySearchDepthDesc: '"advanced" usa mais créditos.',
            tavilySearchDepthBasic: 'Básica',
            tavilySearchDepthAdvanced: 'Avançada (2 créditos)',
            duckduckgoMaxResultsName: 'Máximo de resultados DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Máximo de resultados a analisar.',
            duckduckgoFetchTimeoutName: 'Tempo limite de obtenção de conteúdo DuckDuckGo (segundos)',
            duckduckgoFetchTimeoutDesc: 'Tempo máximo de espera por URL de resultado.',
            maxResearchTokensName: 'Máximo de tokens de conteúdo de pesquisa',
            maxResearchTokensDesc: 'Máximo aproximado de tokens de resultados web para o prompt de resumo.'
        },
        duplicateScope: {
            modeName: 'Modo do escopo de verificação de duplicados',
            modeDesc: 'Defina o escopo para encontrar correspondentes duplicados.',
            optionVault: 'Vault inteiro (padrão - compara notas de conceito com todas as outras notas)',
            optionInclude: 'Incluir apenas pastas específicas (compara notas de conceito com notas nas pastas especificadas)',
            optionExclude: 'Excluir pastas específicas (compara notas de conceito com notas fora das pastas especificadas)',
            optionConceptFolderOnly: 'Somente pasta de conceitos (compara notas de conceito entre si)',
            includeFoldersName: 'Incluir pastas',
            excludeFoldersName: 'Excluir pastas',
            pathsDesc: 'Digite caminhos relativos (um por linha) para as pastas a serem {mode}. Obrigatório se o modo não for "Vault inteiro" nem "Somente pasta de conceitos". Os caminhos diferenciam maiúsculas de minúsculas e usam "/" como separador.',
            pathsModeInclude: 'incluídas',
            pathsModeExclude: 'excluídas',
            pathsPlaceholder: 'Ex.: Notes/ProjectA\nSource Material',
            invalidPathNotice: `Caminho inválido: "{path}". Use "/" como separador de caminho, não "\\".`,
            invalidCharacterNotice: 'Caractere inválido "{char}" no caminho: "{path}". Caracteres proibidos: espaço, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Os caminhos das pastas não podem ficar vazios quando o modo "Incluir" ou "Excluir" estiver selecionado.',
            invalidPathsNotSaved: 'Foram detectados caminhos inválidos. As configurações deste campo não foram salvas.'
        }
    }
});

extendLocale(STRINGS_RU, {
    settings: {
        stableApi: {
            enableName: 'Включить стабильные вызовы API (логика повторов)',
            enableDesc: 'Вкл: автоматически повторять неудачные вызовы LLM API. Выкл: завершаться при первой ошибке.',
            retryIntervalName: 'Интервал повтора (секунды)',
            retryIntervalDesc: 'Время ожидания между повторами.',
            maxRetriesName: 'Максимум повторов',
            maxRetriesDesc: 'Максимальное число попыток повтора.',
            debugModeName: 'Режим отладки ошибок API',
            debugModeDesc: 'Вкл: включает подробное журналирование ошибок (в стиле DeepSeek) для всех провайдеров, чтобы помочь диагностировать проблемы API. Выкл: использует стандартные краткие сообщения об ошибках.',
            diagnosticCallModeName: 'Режим диагностического вызова',
            diagnosticCallModeDesc: 'Выберите путь вызова во время выполнения, используемый диагностикой разработчика для этого провайдера.',
            diagnosticTimeoutName: 'Тайм-аут диагностики (секунды)',
            diagnosticTimeoutDesc: 'Тайм-аут для каждого запуска диагностики разработчика (15-3600 секунд).',
            stabilityRunsName: 'Прогоны теста стабильности',
            stabilityRunsDesc: 'Сколько повторных запусков выполнять в «Запустить тест стабильности» (1-10).',
            longRequestName: 'Диагностика провайдера для разработчика (длинный запрос)',
            longRequestDesc: 'Выполните одну диагностику длинного запроса с выбранным режимом вызова и сохраните полный отчет в корне vault.'
        },
        webResearch: {
            searchProviderName: 'Провайдер поиска',
            searchProviderDesc: 'Движок для «Исследовать и суммировать».',
            tavilyOption: 'Tavily (требуется API-ключ)',
            duckduckgoOption: 'DuckDuckGo (экспериментально)',
            tavilyApiKeyName: 'API-ключ Tavily',
            tavilyApiKeyDesc: 'Обязателен для Tavily. Получите на tavily.com.',
            tavilyApiKeyPlaceholder: 'Введите API-ключ Tavily (tvly-...)',
            tavilyMaxResultsName: 'Максимум результатов Tavily',
            tavilyMaxResultsDesc: 'Максимум результатов (1-20).',
            tavilySearchDepthName: 'Глубина поиска Tavily',
            tavilySearchDepthDesc: '«advanced» использует больше кредитов.',
            tavilySearchDepthBasic: 'Базовая',
            tavilySearchDepthAdvanced: 'Продвинутая (2 кредита)',
            duckduckgoMaxResultsName: 'Максимум результатов DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Максимальное число результатов для разбора.',
            duckduckgoFetchTimeoutName: 'Тайм-аут загрузки содержимого DuckDuckGo (секунды)',
            duckduckgoFetchTimeoutDesc: 'Максимальное время ожидания для каждого URL результата.',
            maxResearchTokensName: 'Максимум токенов исследовательского контента',
            maxResearchTokensDesc: 'Примерный максимальный объём токенов из веб-результатов для промпта суммаризации.'
        },
        duplicateScope: {
            modeName: 'Режим области проверки дубликатов',
            modeDesc: 'Определяет область поиска дублирующих соответствий.',
            optionVault: 'Весь vault (по умолчанию — сравнивает заметки-концепты со всеми остальными заметками)',
            optionInclude: 'Включать только определенные папки (сравнивает заметки-концепты с заметками в указанных папках)',
            optionExclude: 'Исключать определенные папки (сравнивает заметки-концепты с заметками вне указанных папок)',
            optionConceptFolderOnly: 'Только папка концептов (сравнивает заметки-концепты между собой)',
            includeFoldersName: 'Включаемые папки',
            excludeFoldersName: 'Исключаемые папки',
            pathsDesc: 'Введите относительные пути (по одному в строке) для папок, которые нужно {mode}. Обязательно, если режим не «Весь vault» и не «Только папка концептов». Пути чувствительны к регистру и используют "/" как разделитель.',
            pathsModeInclude: 'включить',
            pathsModeExclude: 'исключить',
            pathsPlaceholder: 'напр., Notes/ProjectA\nSource Material',
            invalidPathNotice: `Недопустимый путь: "{path}". Используйте "/" как разделитель пути, а не "\\".`,
            invalidCharacterNotice: 'Недопустимый символ "{char}" в пути: "{path}". Запрещённые символы: пробел, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Пути к папкам не могут быть пустыми, когда выбран режим «Включить» или «Исключить».',
            invalidPathsNotSaved: 'Обнаружены недопустимые пути. Настройки для этого поля не сохранены.'
        }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        stableApi: {
            enableName: 'เปิดใช้การเรียก API แบบเสถียร (ตรรกะการลองใหม่)',
            enableDesc: 'เปิด: ลองเรียก LLM API ที่ล้มเหลวใหม่โดยอัตโนมัติ ปิด: ให้ล้มเหลวทันทีเมื่อเกิดข้อผิดพลาดครั้งแรก',
            retryIntervalName: 'ช่วงเวลาการลองใหม่ (วินาที)',
            retryIntervalDesc: 'ระยะเวลารอระหว่างการลองใหม่',
            maxRetriesName: 'จำนวนครั้งสูงสุดในการลองใหม่',
            maxRetriesDesc: 'จำนวนครั้งสูงสุดของการพยายามลองใหม่',
            debugModeName: 'โหมดดีบักข้อผิดพลาด API',
            debugModeDesc: 'เปิด: เปิดใช้การบันทึกข้อผิดพลาดแบบละเอียด (สไตล์ DeepSeek) สำหรับผู้ให้บริการทั้งหมดเพื่อช่วยวินิจฉัยปัญหา API ปิด: ใช้การรายงานข้อผิดพลาดแบบมาตรฐานที่กระชับ',
            diagnosticCallModeName: 'โหมดการเรียกวินิจฉัย',
            diagnosticCallModeDesc: 'เลือกเส้นทางการเรียกขณะรันที่การวินิจฉัยสำหรับนักพัฒนาใช้กับผู้ให้บริการนี้',
            diagnosticTimeoutName: 'หมดเวลาการวินิจฉัย (วินาที)',
            diagnosticTimeoutDesc: 'เวลาหมดเขตสำหรับการวินิจฉัยแต่ละครั้งของนักพัฒนา (15-3600 วินาที)',
            stabilityRunsName: 'จำนวนครั้งของการทดสอบเสถียรภาพ',
            stabilityRunsDesc: 'จำนวนรอบที่จะทำซ้ำใน "รันทดสอบเสถียรภาพ" (1-10)',
            longRequestName: 'การวินิจฉัยผู้ให้บริการสำหรับนักพัฒนา (คำขอแบบยาว)',
            longRequestDesc: 'รันการวินิจฉัยคำขอแบบยาวหนึ่งครั้งด้วยโหมดการเรียกที่เลือก และบันทึกรายงานฉบับเต็มไว้ที่รากของ vault'
        },
        webResearch: {
            searchProviderName: 'ผู้ให้บริการค้นหา',
            searchProviderDesc: 'เอนจินที่ใช้สำหรับ "วิจัยและสรุป"',
            tavilyOption: 'Tavily (ต้องใช้คีย์ API)',
            duckduckgoOption: 'DuckDuckGo (ทดลอง)',
            tavilyApiKeyName: 'คีย์ API ของ Tavily',
            tavilyApiKeyDesc: 'จำเป็นสำหรับ Tavily รับได้จาก tavily.com',
            tavilyApiKeyPlaceholder: 'ป้อนคีย์ API ของ Tavily (tvly-...)',
            tavilyMaxResultsName: 'จำนวนผลลัพธ์สูงสุดของ Tavily',
            tavilyMaxResultsDesc: 'จำนวนผลลัพธ์สูงสุด (1-20)',
            tavilySearchDepthName: 'ระดับความลึกการค้นหา Tavily',
            tavilySearchDepthDesc: '"advanced" ใช้เครดิตมากกว่า',
            tavilySearchDepthBasic: 'พื้นฐาน',
            tavilySearchDepthAdvanced: 'ขั้นสูง (2 เครดิต)',
            duckduckgoMaxResultsName: 'จำนวนผลลัพธ์สูงสุดของ DuckDuckGo',
            duckduckgoMaxResultsDesc: 'จำนวนผลลัพธ์สูงสุดที่จะ解析',
            duckduckgoFetchTimeoutName: 'หมดเวลาการดึงเนื้อหา DuckDuckGo (วินาที)',
            duckduckgoFetchTimeoutDesc: 'เวลารอสูงสุดต่อ URL ของผลลัพธ์',
            maxResearchTokensName: 'จำนวนโทเค็นสูงสุดของเนื้อหาวิจัย',
            maxResearchTokensDesc: 'จำนวนโทเค็นโดยประมาณสูงสุดจากผลลัพธ์เว็บสำหรับพรอมป์การสรุป'
        },
        duplicateScope: {
            modeName: 'โหมดขอบเขตการตรวจสอบรายการซ้ำ',
            modeDesc: 'กำหนดขอบเขตสำหรับค้นหารายการคู่ซ้ำ',
            optionVault: 'ทั้ง vault (ค่าเริ่มต้น - เปรียบเทียบโน้ตแนวคิดกับโน้ตอื่นทั้งหมด)',
            optionInclude: 'รวมเฉพาะโฟลเดอร์ที่ระบุ (เปรียบเทียบโน้ตแนวคิดกับโน้ตในโฟลเดอร์ที่ระบุ)',
            optionExclude: 'ยกเว้นโฟลเดอร์ที่ระบุ (เปรียบเทียบโน้ตแนวคิดกับโน้ตนอกโฟลเดอร์ที่ระบุ)',
            optionConceptFolderOnly: 'เฉพาะโฟลเดอร์แนวคิด (เปรียบเทียบโน้ตแนวคิดกันเอง)',
            includeFoldersName: 'รวมโฟลเดอร์',
            excludeFoldersName: 'ยกเว้นโฟลเดอร์',
            pathsDesc: 'ป้อนเส้นทางสัมพัทธ์ (หนึ่งรายการต่อบรรทัด) สำหรับโฟลเดอร์ที่จะ{mode} จำเป็นหากโหมดไม่ใช่ "ทั้ง vault" หรือ "เฉพาะโฟลเดอร์แนวคิด" เส้นทางแยกตัวพิมพ์เล็กพิมพ์ใหญ่และใช้ "/" เป็นตัวคั่น',
            pathsModeInclude: 'รวม',
            pathsModeExclude: 'ยกเว้น',
            pathsPlaceholder: 'เช่น Notes/ProjectA\nSource Material',
            invalidPathNotice: `เส้นทางไม่ถูกต้อง: "{path}" โปรดใช้ "/" เป็นตัวคั่นเส้นทาง ไม่ใช่ "\\"`,
            invalidCharacterNotice: 'อักขระไม่ถูกต้อง "{char}" ในเส้นทาง: "{path}" อักขระต้องห้าม: เว้นวรรค, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'เส้นทางโฟลเดอร์ต้องไม่เว้นว่างเมื่อเลือกโหมด "รวม" หรือ "ยกเว้น"',
            invalidPathsNotSaved: 'ตรวจพบเส้นทางไม่ถูกต้อง จึงไม่ได้บันทึกการตั้งค่าสำหรับฟิลด์นี้'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        stableApi: {
            enableName: 'Kararlı API çağrılarını etkinleştir (yeniden deneme mantığı)',
            enableDesc: 'Açık: başarısız LLM API çağrılarını otomatik olarak yeniden dener. Kapalı: ilk hatada başarısız olur.',
            retryIntervalName: 'Yeniden deneme aralığı (saniye)',
            retryIntervalDesc: 'Yeniden denemeler arasındaki bekleme süresi.',
            maxRetriesName: 'Maksimum yeniden deneme',
            maxRetriesDesc: 'Maksimum yeniden deneme sayısı.',
            debugModeName: 'API hata ayıklama modu',
            debugModeDesc: 'Açık: tüm sağlayıcılarda ayrıntılı hata günlüğünü (DeepSeek tarzı) etkinleştirerek API sorunlarını teşhis etmeye yardımcı olur. Kapalı: standart kısa hata raporlamasını kullanır.',
            diagnosticCallModeName: 'Tanılama çağrı modu',
            diagnosticCallModeDesc: 'Bu sağlayıcı için geliştirici tanılamalarının kullandığı çalışma zamanı çağrı yolunu seçin.',
            diagnosticTimeoutName: 'Tanılama zaman aşımı (saniye)',
            diagnosticTimeoutDesc: 'Her geliştirici tanılama çalıştırması için zaman aşımı (15-3600 saniye).',
            stabilityRunsName: 'Kararlılık testi çalıştırma sayısı',
            stabilityRunsDesc: '"Kararlılık testini çalıştır" içinde kaç tekrar yürütüleceği (1-10).',
            longRequestName: 'Geliştirici sağlayıcı tanılaması (uzun istek)',
            longRequestDesc: 'Seçili çağrı moduyla bir uzun istek tanılaması çalıştırın ve tam raporu vault köküne kaydedin.'
        },
        webResearch: {
            searchProviderName: 'Arama sağlayıcısı',
            searchProviderDesc: '"Araştır ve özetle" için kullanılan motor.',
            tavilyOption: 'Tavily (API anahtarı gerektirir)',
            duckduckgoOption: 'DuckDuckGo (deneysel)',
            tavilyApiKeyName: 'Tavily API anahtarı',
            tavilyApiKeyDesc: 'Tavily için gereklidir. tavily.com üzerinden alın.',
            tavilyApiKeyPlaceholder: 'Tavily API anahtarını girin (tvly-...)',
            tavilyMaxResultsName: 'Tavily maksimum sonuç sayısı',
            tavilyMaxResultsDesc: 'Maksimum sonuç sayısı (1-20).',
            tavilySearchDepthName: 'Tavily arama derinliği',
            tavilySearchDepthDesc: '"advanced" daha fazla kredi kullanır.',
            tavilySearchDepthBasic: 'Temel',
            tavilySearchDepthAdvanced: 'Gelişmiş (2 kredi)',
            duckduckgoMaxResultsName: 'DuckDuckGo maksimum sonuç sayısı',
            duckduckgoMaxResultsDesc: 'Ayrıştırılacak maksimum sonuç sayısı.',
            duckduckgoFetchTimeoutName: 'DuckDuckGo içerik getirme zaman aşımı (saniye)',
            duckduckgoFetchTimeoutDesc: 'Her sonuç URL’si için maksimum bekleme süresi.',
            maxResearchTokensName: 'Maksimum araştırma içeriği token sayısı',
            maxResearchTokensDesc: 'Özetleme istemi için web sonuçlarından alınacak yaklaşık maksimum token sayısı.'
        },
        duplicateScope: {
            modeName: 'Yinelenen denetim kapsam modu',
            modeDesc: 'Yinelenen karşılıkları bulmak için kapsamı tanımlayın.',
            optionVault: 'Tüm vault (varsayılan - kavram notlarını diğer tüm notlarla karşılaştırır)',
            optionInclude: 'Yalnızca belirli klasörleri dahil et (kavram notlarını belirtilen klasörlerdeki notlarla karşılaştırır)',
            optionExclude: 'Belirli klasörleri hariç tut (kavram notlarını belirtilen klasörlerin dışındaki notlarla karşılaştırır)',
            optionConceptFolderOnly: 'Yalnızca kavram klasörü (kavram notlarını kendi aralarında karşılaştırır)',
            includeFoldersName: 'Dahil edilecek klasörler',
            excludeFoldersName: 'Hariç tutulacak klasörler',
            pathsDesc: '{mode}ilecek klasörler için göreli yolları (satır başına bir tane) girin. Mod "Tüm vault" veya "Yalnızca kavram klasörü" değilse zorunludur. Yollar büyük/küçük harfe duyarlıdır ve ayırıcı olarak "/" kullanır.',
            pathsModeInclude: 'dahil et',
            pathsModeExclude: 'hariç tut',
            pathsPlaceholder: 'örn. Notes/ProjectA\nSource Material',
            invalidPathNotice: `Geçersiz yol: "{path}". Yol ayırıcı olarak "\\" değil "/" kullanın.`,
            invalidCharacterNotice: 'Yolda geçersiz karakter "{char}": "{path}". Yasaklı karakterler: boşluk, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: '"Dahil et" veya "Hariç tut" modu seçildiğinde klasör yolları boş olamaz.',
            invalidPathsNotSaved: 'Geçersiz yol(lar) algılandı. Bu alanın ayarları kaydedilmedi.'
        }
    }
});

extendLocale(STRINGS_UK, {
    settings: {
        stableApi: {
            enableName: 'Увімкнути стабільні виклики API (логіка повторів)',
            enableDesc: 'Увімкнено: автоматично повторює невдалі виклики LLM API. Вимкнено: завершує роботу після першої помилки.',
            retryIntervalName: 'Інтервал повтору (секунди)',
            retryIntervalDesc: 'Час очікування між повторними спробами.',
            maxRetriesName: 'Максимальна кількість повторів',
            maxRetriesDesc: 'Максимальна кількість спроб повтору.',
            debugModeName: 'Режим налагодження помилок API',
            debugModeDesc: 'Увімкнено: вмикає детальне журналювання помилок (у стилі DeepSeek) для всіх провайдерів, щоб допомогти діагностувати проблеми API. Вимкнено: використовує стандартні стислі повідомлення про помилки.',
            diagnosticCallModeName: 'Режим діагностичного виклику',
            diagnosticCallModeDesc: 'Виберіть шлях виклику під час виконання, який використовує діагностика розробника для цього провайдера.',
            diagnosticTimeoutName: 'Тайм-аут діагностики (секунди)',
            diagnosticTimeoutDesc: 'Тайм-аут для кожного запуску діагностики розробника (15-3600 секунд).',
            stabilityRunsName: 'Кількість запусків тесту стабільності',
            stabilityRunsDesc: 'Скільки повторів виконувати в «Запустити тест стабільності» (1-10).',
            longRequestName: 'Діагностика провайдера для розробника (довгий запит)',
            longRequestDesc: 'Запустіть одну діагностику довгого запиту з вибраним режимом виклику й збережіть повний звіт у корені vault.'
        },
        webResearch: {
            searchProviderName: 'Провайдер пошуку',
            searchProviderDesc: 'Рушій для «Дослідити та підсумувати».',
            tavilyOption: 'Tavily (потрібен API-ключ)',
            duckduckgoOption: 'DuckDuckGo (експериментально)',
            tavilyApiKeyName: 'API-ключ Tavily',
            tavilyApiKeyDesc: 'Обов’язковий для Tavily. Отримайте на tavily.com.',
            tavilyApiKeyPlaceholder: 'Введіть API-ключ Tavily (tvly-...)',
            tavilyMaxResultsName: 'Максимум результатів Tavily',
            tavilyMaxResultsDesc: 'Максимальна кількість результатів (1-20).',
            tavilySearchDepthName: 'Глибина пошуку Tavily',
            tavilySearchDepthDesc: '«advanced» використовує більше кредитів.',
            tavilySearchDepthBasic: 'Базова',
            tavilySearchDepthAdvanced: 'Розширена (2 кредити)',
            duckduckgoMaxResultsName: 'Максимум результатів DuckDuckGo',
            duckduckgoMaxResultsDesc: 'Максимальна кількість результатів для розбору.',
            duckduckgoFetchTimeoutName: 'Тайм-аут отримання вмісту DuckDuckGo (секунди)',
            duckduckgoFetchTimeoutDesc: 'Максимальний час очікування для кожного URL результату.',
            maxResearchTokensName: 'Максимум токенів дослідницького вмісту',
            maxResearchTokensDesc: 'Приблизна максимальна кількість токенів із вебрезультатів для підсумкового промпту.'
        },
        duplicateScope: {
            modeName: 'Режим області перевірки дублікатів',
            modeDesc: 'Визначає область для пошуку дублікатних відповідників.',
            optionVault: 'Увесь vault (типово — порівнює нотатки-концепти з усіма іншими нотатками)',
            optionInclude: 'Включати лише певні папки (порівнює нотатки-концепти з нотатками у вказаних папках)',
            optionExclude: 'Виключати певні папки (порівнює нотатки-концепти з нотатками поза вказаними папками)',
            optionConceptFolderOnly: 'Лише папка концептів (порівнює нотатки-концепти між собою)',
            includeFoldersName: 'Папки для включення',
            excludeFoldersName: 'Папки для виключення',
            pathsDesc: 'Введіть відносні шляхи (по одному в рядку) для папок, які треба {mode}. Обов’язково, якщо режим не «Увесь vault» і не «Лише папка концептів». Шляхи чутливі до регістру й використовують "/" як роздільник.',
            pathsModeInclude: 'включити',
            pathsModeExclude: 'виключити',
            pathsPlaceholder: 'напр., Notes/ProjectA\nSource Material',
            invalidPathNotice: `Недійсний шлях: "{path}". Використовуйте "/" як роздільник шляху, а не "\\".`,
            invalidCharacterNotice: 'Недійсний символ "{char}" у шляху: "{path}". Заборонені символи: пробіл, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Шляхи до папок не можуть бути порожніми, коли вибрано режим «Включити» або «Виключити».',
            invalidPathsNotSaved: 'Виявлено недійсний шлях(и). Налаштування для цього поля не збережено.'
        }
    }
});

extendLocale(STRINGS_VI, {
    settings: {
        stableApi: {
            enableName: 'Bật lệnh gọi API ổn định (logic thử lại)',
            enableDesc: 'Bật: tự động thử lại các lệnh gọi API LLM bị lỗi. Tắt: thất bại ngay ở lỗi đầu tiên.',
            retryIntervalName: 'Khoảng thời gian thử lại (giây)',
            retryIntervalDesc: 'Thời gian chờ giữa các lần thử lại.',
            maxRetriesName: 'Số lần thử lại tối đa',
            maxRetriesDesc: 'Số lần thử lại tối đa.',
            debugModeName: 'Chế độ gỡ lỗi API',
            debugModeDesc: 'Bật: cho phép ghi log lỗi chi tiết (kiểu DeepSeek) cho mọi nhà cung cấp để hỗ trợ chẩn đoán sự cố API. Tắt: dùng báo cáo lỗi chuẩn, ngắn gọn.',
            diagnosticCallModeName: 'Chế độ gọi chẩn đoán',
            diagnosticCallModeDesc: 'Chọn đường dẫn gọi runtime mà chẩn đoán dành cho nhà phát triển sử dụng cho nhà cung cấp này.',
            diagnosticTimeoutName: 'Thời gian chờ chẩn đoán (giây)',
            diagnosticTimeoutDesc: 'Thời gian chờ cho mỗi lần chạy chẩn đoán dành cho nhà phát triển (15-3600 giây).',
            stabilityRunsName: 'Số lần chạy kiểm tra độ ổn định',
            stabilityRunsDesc: 'Số lần lặp sẽ thực hiện trong "Chạy kiểm tra độ ổn định" (1-10).',
            longRequestName: 'Chẩn đoán nhà cung cấp cho nhà phát triển (yêu cầu dài)',
            longRequestDesc: 'Chạy một chẩn đoán yêu cầu dài với chế độ gọi đã chọn và lưu báo cáo đầy đủ vào thư mục gốc của vault.'
        },
        webResearch: {
            searchProviderName: 'Nhà cung cấp tìm kiếm',
            searchProviderDesc: 'Công cụ dùng cho "Nghiên cứu và tóm tắt".',
            tavilyOption: 'Tavily (yêu cầu khóa API)',
            duckduckgoOption: 'DuckDuckGo (thử nghiệm)',
            tavilyApiKeyName: 'Khóa API Tavily',
            tavilyApiKeyDesc: 'Bắt buộc với Tavily. Lấy tại tavily.com.',
            tavilyApiKeyPlaceholder: 'Nhập khóa API Tavily (tvly-...)',
            tavilyMaxResultsName: 'Số kết quả Tavily tối đa',
            tavilyMaxResultsDesc: 'Số kết quả tối đa (1-20).',
            tavilySearchDepthName: 'Độ sâu tìm kiếm Tavily',
            tavilySearchDepthDesc: '"advanced" dùng nhiều tín dụng hơn.',
            tavilySearchDepthBasic: 'Cơ bản',
            tavilySearchDepthAdvanced: 'Nâng cao (2 tín dụng)',
            duckduckgoMaxResultsName: 'Số kết quả DuckDuckGo tối đa',
            duckduckgoMaxResultsDesc: 'Số kết quả tối đa cần phân tích.',
            duckduckgoFetchTimeoutName: 'Thời gian chờ lấy nội dung DuckDuckGo (giây)',
            duckduckgoFetchTimeoutDesc: 'Thời gian chờ tối đa cho mỗi URL kết quả.',
            maxResearchTokensName: 'Số token nội dung nghiên cứu tối đa',
            maxResearchTokensDesc: 'Giới hạn token xấp xỉ lấy từ kết quả web cho prompt tóm tắt.'
        },
        duplicateScope: {
            modeName: 'Chế độ phạm vi kiểm tra trùng lặp',
            modeDesc: 'Xác định phạm vi để tìm các đối tượng trùng lặp tương ứng.',
            optionVault: 'Toàn bộ vault (mặc định - so sánh ghi chú khái niệm với tất cả ghi chú khác)',
            optionInclude: 'Chỉ bao gồm các thư mục cụ thể (so sánh ghi chú khái niệm với các ghi chú trong thư mục đã chỉ định)',
            optionExclude: 'Loại trừ các thư mục cụ thể (so sánh ghi chú khái niệm với các ghi chú ngoài những thư mục đã chỉ định)',
            optionConceptFolderOnly: 'Chỉ thư mục khái niệm (so sánh các ghi chú khái niệm với nhau)',
            includeFoldersName: 'Bao gồm thư mục',
            excludeFoldersName: 'Loại trừ thư mục',
            pathsDesc: 'Nhập các đường dẫn tương đối (mỗi dòng một mục) cho các thư mục cần {mode}. Bắt buộc nếu chế độ không phải là "Toàn bộ vault" hoặc "Chỉ thư mục khái niệm". Đường dẫn phân biệt chữ hoa chữ thường và dùng "/" làm dấu phân cách.',
            pathsModeInclude: 'bao gồm',
            pathsModeExclude: 'loại trừ',
            pathsPlaceholder: 'ví dụ: Notes/ProjectA\nSource Material',
            invalidPathNotice: `Đường dẫn không hợp lệ: "{path}". Hãy dùng "/" làm dấu phân cách đường dẫn, không phải "\\".`,
            invalidCharacterNotice: 'Ký tự không hợp lệ "{char}" trong đường dẫn: "{path}". Ký tự cấm: khoảng trắng, \\, <, >, :, |, ?, #, ^, [, ]',
            emptyPathsNotice: 'Đường dẫn thư mục không được để trống khi chọn chế độ "Bao gồm" hoặc "Loại trừ".',
            invalidPathsNotSaved: 'Phát hiện đường dẫn không hợp lệ. Cài đặt cho trường này chưa được lưu.'
        }
    }
});

extendLocale(STRINGS_AR, {
    settings: {
        generalOutput: {
            processedSavePathName: 'تخصيص مسار حفظ الملف المعالَج',
            processedSavePathDesc: 'تشغيل: احفظ في المسار المحدد. إيقاف: احفظ في المجلد الأصلي.',
            processedFolderPathName: 'مسار مجلد الملف المعالَج',
            processedFolderPathDesc: 'مسار نسبي داخل المستودع.',
            processedFolderPathPlaceholder: 'مثال: Processed/Notes',
            moveOriginalName: 'نقل الملف الأصلي بعد المعالجة',
            moveOriginalDesc: 'تشغيل: انقل الأصل إلى مجلد المعالجة. إيقاف: أنشئ نسخة باسم "_processed.md".',
            customAddLinksFilenameName: 'استخدام اسم ملف إخراج مخصص لـ "Add links"',
            customAddLinksFilenameDesc: 'تشغيل: استخدم لاحقة/استبدالًا مخصصًا. إيقاف: استخدم "_processed.md".',
            addLinksSuffixName: 'سلسلة لاحقة/استبدال مخصصة',
            addLinksSuffixDesc: 'اتركه فارغًا للكتابة فوق الأصل. مثال: "_linked".',
            addLinksSuffixPlaceholder: 'اتركه فارغًا للكتابة فوق الأصل',
            removeCodeFencesName: 'إزالة حواجز الشيفرة عند "Add links"',
            removeCodeFencesDesc: 'تشغيل: أزل جميع حواجز ```markdown و``` من المخرجات النهائية لـ "Process File" و"Process Folder". إيقاف: احتفظ بحواجز الشيفرة.',
            conceptNotePathName: 'تخصيص مسار ملاحظات المفاهيم',
            conceptNotePathDesc: 'تشغيل: أنشئ ملاحظات مفاهيم جديدة في المسار المحدد. إيقاف: لا تُنشأ تلقائيًا.',
            conceptNoteFolderName: 'مسار مجلد ملاحظات المفاهيم',
            conceptNoteFolderDesc: 'مسار نسبي داخل المستودع.',
            conceptNoteFolderPlaceholder: 'مثال: Concepts',
            generateConceptLogName: 'إنشاء ملف سجل المفاهيم',
            generateConceptLogDesc: 'تشغيل: سجّل ملاحظات المفاهيم المنشأة حديثًا.',
            customLogPathName: 'تخصيص مسار حفظ ملف السجل',
            customLogPathDescWithConceptFolder: 'تشغيل: احفظ السجل في المسار المحدد. إيقاف: احفظه في مجلد ملاحظات المفاهيم ("{folder}").',
            customLogPathDescVault: 'تشغيل: احفظ السجل في المسار المحدد. إيقاف: احفظه في جذر المستودع.',
            conceptLogFolderName: 'مسار مجلد سجل المفاهيم',
            conceptLogFolderDesc: 'مسار نسبي. مطلوب عند تفعيل المسار المخصص.',
            conceptLogFolderPlaceholder: 'مثال: Logs/ConceptLogs',
            customLogFileNameToggleName: 'تخصيص اسم ملف السجل',
            customLogFileNameToggleDesc: 'تشغيل: استخدم الاسم المحدد. إيقاف: استخدم "{defaultName}".',
            conceptLogFileNameName: 'اسم ملف سجل المفاهيم',
            conceptLogFileNameDesc: 'اسم ملف السجل. مطلوب عند تفعيل الاسم المخصص.'
        }
    }
});

extendLocale(STRINGS_DE, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Speicherpfad für verarbeitete Datei anpassen',
            processedSavePathDesc: 'Ein: Unter dem angegebenen Pfad speichern. Aus: Im ursprünglichen Ordner speichern.',
            processedFolderPathName: 'Ordnerpfad für verarbeitete Datei',
            processedFolderPathDesc: 'Relativer Pfad innerhalb des Vaults.',
            processedFolderPathPlaceholder: 'z. B. Processed/Notes',
            moveOriginalName: 'Originaldatei nach der Verarbeitung verschieben',
            moveOriginalDesc: 'Ein: Original in den Verarbeitungsordner verschieben. Aus: Kopie mit dem Namen "_processed.md" erstellen.',
            customAddLinksFilenameName: 'Benutzerdefinierten Ausgabedateinamen für "Add links" verwenden',
            customAddLinksFilenameDesc: 'Ein: Benutzerdefiniertes Suffix/Ersetzung verwenden. Aus: "_processed.md" verwenden.',
            addLinksSuffixName: 'Benutzerdefinierte Suffix-/Ersetzungszeichenfolge',
            addLinksSuffixDesc: 'Leer lassen, um das Original zu überschreiben. Bsp.: "_linked".',
            addLinksSuffixPlaceholder: 'Leer lassen, um zu überschreiben',
            removeCodeFencesName: 'Codeblöcke bei "Add links" entfernen',
            removeCodeFencesDesc: 'Ein: Alle ```markdown- und ```-Blöcke aus der Endausgabe von "Process File" und "Process Folder" entfernen. Aus: Codeblöcke beibehalten.',
            conceptNotePathName: 'Pfad für Konzeptnotizen anpassen',
            conceptNotePathDesc: 'Ein: Neue Konzeptnotizen im angegebenen Pfad erstellen. Aus: Nicht automatisch erstellen.',
            conceptNoteFolderName: 'Ordnerpfad für Konzeptnotizen',
            conceptNoteFolderDesc: 'Relativer Pfad innerhalb des Vaults.',
            conceptNoteFolderPlaceholder: 'z. B. Concepts',
            generateConceptLogName: 'Konzeptprotokolldatei erzeugen',
            generateConceptLogDesc: 'Ein: Neu erstellte Konzeptnotizen protokollieren.',
            customLogPathName: 'Speicherpfad für Protokolldatei anpassen',
            customLogPathDescWithConceptFolder: 'Ein: Protokoll unter dem angegebenen Pfad speichern. Aus: Im Konzeptnotizen-Ordner ("{folder}") speichern.',
            customLogPathDescVault: 'Ein: Protokoll unter dem angegebenen Pfad speichern. Aus: Im Vault-Stammverzeichnis speichern.',
            conceptLogFolderName: 'Ordnerpfad für Konzeptprotokoll',
            conceptLogFolderDesc: 'Relativer Pfad. Erforderlich, wenn ein benutzerdefinierter Pfad aktiviert ist.',
            conceptLogFolderPlaceholder: 'z. B. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Dateiname des Protokolls anpassen',
            customLogFileNameToggleDesc: 'Ein: Angegebenen Namen verwenden. Aus: "{defaultName}" verwenden.',
            conceptLogFileNameName: 'Dateiname des Konzeptprotokolls',
            conceptLogFileNameDesc: 'Name der Protokolldatei. Erforderlich, wenn ein benutzerdefinierter Name aktiviert ist.'
        }
    }
});

extendLocale(STRINGS_ES, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Personalizar la ruta de guardado del archivo procesado',
            processedSavePathDesc: 'Activado: guardar en la ruta especificada. Desactivado: guardar en la carpeta original.',
            processedFolderPathName: 'Ruta de la carpeta del archivo procesado',
            processedFolderPathDesc: 'Ruta relativa dentro del vault.',
            processedFolderPathPlaceholder: 'p. ej., Processed/Notes',
            moveOriginalName: 'Mover el archivo original después del procesamiento',
            moveOriginalDesc: 'Activado: mover el original a la carpeta de procesados. Desactivado: crear una copia llamada "_processed.md".',
            customAddLinksFilenameName: 'Usar un nombre de archivo de salida personalizado para "Add links"',
            customAddLinksFilenameDesc: 'Activado: usar un sufijo/reemplazo personalizado. Desactivado: usar "_processed.md".',
            addLinksSuffixName: 'Cadena personalizada de sufijo/reemplazo',
            addLinksSuffixDesc: 'Déjalo vacío para sobrescribir el original. Ej.: "_linked".',
            addLinksSuffixPlaceholder: 'Déjalo vacío para sobrescribir',
            removeCodeFencesName: 'Eliminar fences de código en "Add links"',
            removeCodeFencesDesc: 'Activado: elimina todos los fences ```markdown y ``` de la salida final de "Process File" y "Process Folder". Desactivado: conserva los fences de código.',
            conceptNotePathName: 'Personalizar la ruta de las notas de concepto',
            conceptNotePathDesc: 'Activado: crear nuevas notas de concepto en la ruta especificada. Desactivado: no crearlas automáticamente.',
            conceptNoteFolderName: 'Ruta de la carpeta de notas de concepto',
            conceptNoteFolderDesc: 'Ruta relativa dentro del vault.',
            conceptNoteFolderPlaceholder: 'p. ej., Concepts',
            generateConceptLogName: 'Generar archivo de registro de conceptos',
            generateConceptLogDesc: 'Activado: registrar las notas de concepto recién creadas.',
            customLogPathName: 'Personalizar la ruta de guardado del archivo de registro',
            customLogPathDescWithConceptFolder: 'Activado: guardar el registro en la ruta especificada. Desactivado: guardarlo en la carpeta de notas de concepto ("{folder}").',
            customLogPathDescVault: 'Activado: guardar el registro en la ruta especificada. Desactivado: guardarlo en la raíz del vault.',
            conceptLogFolderName: 'Ruta de la carpeta del registro de conceptos',
            conceptLogFolderDesc: 'Ruta relativa. Obligatoria si está activada la ruta personalizada.',
            conceptLogFolderPlaceholder: 'p. ej., Logs/ConceptLogs',
            customLogFileNameToggleName: 'Personalizar el nombre del archivo de registro',
            customLogFileNameToggleDesc: 'Activado: usar el nombre especificado. Desactivado: usar "{defaultName}".',
            conceptLogFileNameName: 'Nombre del archivo de registro de conceptos',
            conceptLogFileNameDesc: 'Nombre del archivo de registro. Obligatorio si está activado el nombre personalizado.'
        }
    }
});

extendLocale(STRINGS_FA, {
    settings: {
        generalOutput: {
            processedSavePathName: 'سفارشی‌سازی مسیر ذخیرهٔ فایل پردازش‌شده',
            processedSavePathDesc: 'روشن: در مسیر مشخص‌شده ذخیره شود. خاموش: در پوشهٔ اصلی ذخیره شود.',
            processedFolderPathName: 'مسیر پوشهٔ فایل پردازش‌شده',
            processedFolderPathDesc: 'مسیر نسبی درون vault.',
            processedFolderPathPlaceholder: 'مثلاً: Processed/Notes',
            moveOriginalName: 'انتقال فایل اصلی پس از پردازش',
            moveOriginalDesc: 'روشن: فایل اصلی را به پوشهٔ فایل‌های پردازش‌شده منتقل می‌کند. خاموش: یک نسخه با نام "_processed.md" می‌سازد.',
            customAddLinksFilenameName: 'استفاده از نام فایل خروجی سفارشی برای "Add links"',
            customAddLinksFilenameDesc: 'روشن: از پسوند/جایگزینی سفارشی استفاده می‌کند. خاموش: از "_processed.md" استفاده می‌کند.',
            addLinksSuffixName: 'رشتهٔ پسوند/جایگزینی سفارشی',
            addLinksSuffixDesc: 'برای بازنویسی فایل اصلی خالی بگذارید. مثال: "_linked".',
            addLinksSuffixPlaceholder: 'برای بازنویسی خالی بگذارید',
            removeCodeFencesName: 'حذف حصارهای کد در "Add links"',
            removeCodeFencesDesc: 'روشن: همهٔ حصارهای ```markdown و ``` را از خروجی نهایی "Process File" و "Process Folder" حذف می‌کند. خاموش: حصارهای کد را نگه می‌دارد.',
            conceptNotePathName: 'سفارشی‌سازی مسیر یادداشت‌های مفهومی',
            conceptNotePathDesc: 'روشن: یادداشت‌های مفهومی جدید را در مسیر مشخص‌شده می‌سازد. خاموش: به‌طور خودکار ایجاد نمی‌کند.',
            conceptNoteFolderName: 'مسیر پوشهٔ یادداشت‌های مفهومی',
            conceptNoteFolderDesc: 'مسیر نسبی درون vault.',
            conceptNoteFolderPlaceholder: 'مثلاً: Concepts',
            generateConceptLogName: 'ایجاد فایل گزارش مفاهیم',
            generateConceptLogDesc: 'روشن: یادداشت‌های مفهومی تازه‌ساخته را ثبت می‌کند.',
            customLogPathName: 'سفارشی‌سازی مسیر ذخیرهٔ فایل گزارش',
            customLogPathDescWithConceptFolder: 'روشن: گزارش را در مسیر مشخص‌شده ذخیره می‌کند. خاموش: آن را در پوشهٔ یادداشت‌های مفهومی ("{folder}") ذخیره می‌کند.',
            customLogPathDescVault: 'روشن: گزارش را در مسیر مشخص‌شده ذخیره می‌کند. خاموش: آن را در ریشهٔ vault ذخیره می‌کند.',
            conceptLogFolderName: 'مسیر پوشهٔ گزارش مفاهیم',
            conceptLogFolderDesc: 'مسیر نسبی. در صورت فعال بودن مسیر سفارشی الزامی است.',
            conceptLogFolderPlaceholder: 'مثلاً: Logs/ConceptLogs',
            customLogFileNameToggleName: 'سفارشی‌سازی نام فایل گزارش',
            customLogFileNameToggleDesc: 'روشن: از نام تعیین‌شده استفاده می‌کند. خاموش: از "{defaultName}" استفاده می‌کند.',
            conceptLogFileNameName: 'نام فایل گزارش مفاهیم',
            conceptLogFileNameDesc: 'نام فایل گزارش. در صورت فعال بودن نام سفارشی الزامی است.'
        }
    }
});

extendLocale(STRINGS_FR, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Personnaliser le chemin d’enregistrement du fichier traité',
            processedSavePathDesc: 'Activé : enregistrer à l’emplacement indiqué. Désactivé : enregistrer dans le dossier d’origine.',
            processedFolderPathName: 'Chemin du dossier du fichier traité',
            processedFolderPathDesc: 'Chemin relatif dans le coffre.',
            processedFolderPathPlaceholder: 'p. ex. Processed/Notes',
            moveOriginalName: 'Déplacer le fichier d’origine après traitement',
            moveOriginalDesc: 'Activé : déplacer l’original dans le dossier des fichiers traités. Désactivé : créer une copie nommée "_processed.md".',
            customAddLinksFilenameName: 'Utiliser un nom de fichier de sortie personnalisé pour "Add links"',
            customAddLinksFilenameDesc: 'Activé : utiliser un suffixe/remplacement personnalisé. Désactivé : utiliser "_processed.md".',
            addLinksSuffixName: 'Chaîne de suffixe/remplacement personnalisée',
            addLinksSuffixDesc: 'Laisser vide pour écraser l’original. Ex. : "_linked".',
            addLinksSuffixPlaceholder: 'Laisser vide pour écraser',
            removeCodeFencesName: 'Retirer les blocs de code dans "Add links"',
            removeCodeFencesDesc: 'Activé : retire tous les blocs ```markdown et ``` de la sortie finale de "Process File" et "Process Folder". Désactivé : conserve les blocs de code.',
            conceptNotePathName: 'Personnaliser le chemin des notes de concept',
            conceptNotePathDesc: 'Activé : créer les nouvelles notes de concept dans le chemin indiqué. Désactivé : ne pas les créer automatiquement.',
            conceptNoteFolderName: 'Chemin du dossier des notes de concept',
            conceptNoteFolderDesc: 'Chemin relatif dans le coffre.',
            conceptNoteFolderPlaceholder: 'p. ex. Concepts',
            generateConceptLogName: 'Générer le fichier journal des concepts',
            generateConceptLogDesc: 'Activé : journaliser les notes de concept nouvellement créées.',
            customLogPathName: 'Personnaliser le chemin d’enregistrement du fichier journal',
            customLogPathDescWithConceptFolder: 'Activé : enregistrer le journal dans le chemin indiqué. Désactivé : l’enregistrer dans le dossier des notes de concept ("{folder}").',
            customLogPathDescVault: 'Activé : enregistrer le journal dans le chemin indiqué. Désactivé : l’enregistrer à la racine du coffre.',
            conceptLogFolderName: 'Chemin du dossier du journal des concepts',
            conceptLogFolderDesc: 'Chemin relatif. Requis si un chemin personnalisé est activé.',
            conceptLogFolderPlaceholder: 'p. ex. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Personnaliser le nom du fichier journal',
            customLogFileNameToggleDesc: 'Activé : utiliser le nom indiqué. Désactivé : utiliser "{defaultName}".',
            conceptLogFileNameName: 'Nom du fichier journal des concepts',
            conceptLogFileNameDesc: 'Nom du fichier journal. Requis si le nom personnalisé est activé.'
        }
    }
});

extendLocale(STRINGS_ID, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Sesuaikan jalur simpan file yang diproses',
            processedSavePathDesc: 'Aktif: simpan ke jalur yang ditentukan. Nonaktif: simpan di folder asli.',
            processedFolderPathName: 'Jalur folder file yang diproses',
            processedFolderPathDesc: 'Jalur relatif di dalam vault.',
            processedFolderPathPlaceholder: 'mis. Processed/Notes',
            moveOriginalName: 'Pindahkan file asli setelah diproses',
            moveOriginalDesc: 'Aktif: pindahkan file asli ke folder hasil proses. Nonaktif: buat salinan bernama "_processed.md".',
            customAddLinksFilenameName: 'Gunakan nama file keluaran kustom untuk "Add links"',
            customAddLinksFilenameDesc: 'Aktif: gunakan sufiks/pengganti kustom. Nonaktif: gunakan "_processed.md".',
            addLinksSuffixName: 'String sufiks/pengganti kustom',
            addLinksSuffixDesc: 'Kosongkan untuk menimpa file asli. Contoh: "_linked".',
            addLinksSuffixPlaceholder: 'Kosongkan untuk menimpa',
            removeCodeFencesName: 'Hapus pagar kode pada "Add links"',
            removeCodeFencesDesc: 'Aktif: hapus semua pagar ```markdown dan ``` dari keluaran akhir "Process File" dan "Process Folder". Nonaktif: pertahankan pagar kode.',
            conceptNotePathName: 'Sesuaikan jalur catatan konsep',
            conceptNotePathDesc: 'Aktif: buat catatan konsep baru di jalur yang ditentukan. Nonaktif: jangan buat otomatis.',
            conceptNoteFolderName: 'Jalur folder catatan konsep',
            conceptNoteFolderDesc: 'Jalur relatif di dalam vault.',
            conceptNoteFolderPlaceholder: 'mis. Concepts',
            generateConceptLogName: 'Buat file log konsep',
            generateConceptLogDesc: 'Aktif: catat catatan konsep yang baru dibuat.',
            customLogPathName: 'Sesuaikan jalur simpan file log',
            customLogPathDescWithConceptFolder: 'Aktif: simpan log ke jalur yang ditentukan. Nonaktif: simpan di Folder Catatan Konsep ("{folder}").',
            customLogPathDescVault: 'Aktif: simpan log ke jalur yang ditentukan. Nonaktif: simpan di akar vault.',
            conceptLogFolderName: 'Jalur folder log konsep',
            conceptLogFolderDesc: 'Jalur relatif. Wajib jika jalur kustom diaktifkan.',
            conceptLogFolderPlaceholder: 'mis. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Sesuaikan nama file log',
            customLogFileNameToggleDesc: 'Aktif: gunakan nama yang ditentukan. Nonaktif: gunakan "{defaultName}".',
            conceptLogFileNameName: 'Nama file log konsep',
            conceptLogFileNameDesc: 'Nama file log. Wajib jika nama kustom diaktifkan.'
        }
    }
});

extendLocale(STRINGS_IT, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Personalizza il percorso di salvataggio del file elaborato',
            processedSavePathDesc: 'Attivo: salva nel percorso specificato. Disattivo: salva nella cartella originale.',
            processedFolderPathName: 'Percorso cartella del file elaborato',
            processedFolderPathDesc: 'Percorso relativo all’interno del vault.',
            processedFolderPathPlaceholder: 'es. Processed/Notes',
            moveOriginalName: 'Sposta il file originale dopo l’elaborazione',
            moveOriginalDesc: 'Attivo: sposta l’originale nella cartella dei file elaborati. Disattivo: crea una copia chiamata "_processed.md".',
            customAddLinksFilenameName: 'Usa un nome file di output personalizzato per "Add links"',
            customAddLinksFilenameDesc: 'Attivo: usa un suffisso/sostituzione personalizzata. Disattivo: usa "_processed.md".',
            addLinksSuffixName: 'Stringa di suffisso/sostituzione personalizzata',
            addLinksSuffixDesc: 'Lascia vuoto per sovrascrivere l’originale. Es.: "_linked".',
            addLinksSuffixPlaceholder: 'Lascia vuoto per sovrascrivere',
            removeCodeFencesName: 'Rimuovi i blocchi di codice in "Add links"',
            removeCodeFencesDesc: 'Attivo: rimuove tutti i blocchi ```markdown e ``` dall’output finale di "Process File" e "Process Folder". Disattivo: mantiene i blocchi di codice.',
            conceptNotePathName: 'Personalizza il percorso delle note concetto',
            conceptNotePathDesc: 'Attivo: crea nuove note concetto nel percorso specificato. Disattivo: non crearle automaticamente.',
            conceptNoteFolderName: 'Percorso cartella note concetto',
            conceptNoteFolderDesc: 'Percorso relativo all’interno del vault.',
            conceptNoteFolderPlaceholder: 'es. Concepts',
            generateConceptLogName: 'Genera file di log dei concetti',
            generateConceptLogDesc: 'Attivo: registra le note concetto appena create.',
            customLogPathName: 'Personalizza il percorso di salvataggio del file di log',
            customLogPathDescWithConceptFolder: 'Attivo: salva il log nel percorso specificato. Disattivo: salvalo nella cartella delle note concetto ("{folder}").',
            customLogPathDescVault: 'Attivo: salva il log nel percorso specificato. Disattivo: salvalo nella radice del vault.',
            conceptLogFolderName: 'Percorso cartella log dei concetti',
            conceptLogFolderDesc: 'Percorso relativo. Obbligatorio se il percorso personalizzato è attivo.',
            conceptLogFolderPlaceholder: 'es. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Personalizza il nome del file di log',
            customLogFileNameToggleDesc: 'Attivo: usa il nome specificato. Disattivo: usa "{defaultName}".',
            conceptLogFileNameName: 'Nome file del log dei concetti',
            conceptLogFileNameDesc: 'Nome del file di log. Obbligatorio se il nome personalizzato è attivo.'
        }
    }
});

extendLocale(STRINGS_JA, {
    settings: {
        generalOutput: {
            processedSavePathName: '処理済みファイルの保存先をカスタマイズ',
            processedSavePathDesc: 'オン: 指定したパスに保存します。オフ: 元のフォルダーに保存します。',
            processedFolderPathName: '処理済みファイルのフォルダーパス',
            processedFolderPathDesc: 'Vault 内の相対パスです。',
            processedFolderPathPlaceholder: '例: Processed/Notes',
            moveOriginalName: '処理後に元ファイルを移動',
            moveOriginalDesc: 'オン: 元ファイルを処理済みフォルダーに移動します。オフ: "_processed.md" という名前のコピーを作成します。',
            customAddLinksFilenameName: '"Add links" にカスタム出力ファイル名を使う',
            customAddLinksFilenameDesc: 'オン: カスタムの接尾辞/置換を使います。オフ: "_processed.md" を使います。',
            addLinksSuffixName: 'カスタム接尾辞/置換文字列',
            addLinksSuffixDesc: '空欄にすると元ファイルを上書きします。例: "_linked"。',
            addLinksSuffixPlaceholder: '上書きする場合は空欄のままにする',
            removeCodeFencesName: '"Add links" でコードフェンスを削除',
            removeCodeFencesDesc: 'オン: "Process File" と "Process Folder" の最終出力からすべての ```markdown と ``` フェンスを削除します。オフ: コードフェンスを保持します。',
            conceptNotePathName: '概念ノートのパスをカスタマイズ',
            conceptNotePathDesc: 'オン: 指定したパスに新しい概念ノートを作成します。オフ: 自動では作成しません。',
            conceptNoteFolderName: '概念ノートのフォルダーパス',
            conceptNoteFolderDesc: 'Vault 内の相対パスです。',
            conceptNoteFolderPlaceholder: '例: Concepts',
            generateConceptLogName: '概念ログファイルを生成',
            generateConceptLogDesc: 'オン: 新しく作成された概念ノートを記録します。',
            customLogPathName: 'ログファイルの保存先をカスタマイズ',
            customLogPathDescWithConceptFolder: 'オン: 指定したパスにログを保存します。オフ: 概念ノートフォルダー ("{folder}") に保存します。',
            customLogPathDescVault: 'オン: 指定したパスにログを保存します。オフ: Vault ルートに保存します。',
            conceptLogFolderName: '概念ログフォルダーパス',
            conceptLogFolderDesc: '相対パスです。カスタムパスを有効にした場合は必須です。',
            conceptLogFolderPlaceholder: '例: Logs/ConceptLogs',
            customLogFileNameToggleName: 'ログファイル名をカスタマイズ',
            customLogFileNameToggleDesc: 'オン: 指定した名前を使います。オフ: "{defaultName}" を使います。',
            conceptLogFileNameName: '概念ログファイル名',
            conceptLogFileNameDesc: 'ログファイル名です。カスタム名を有効にした場合は必須です。'
        }
    }
});

extendLocale(STRINGS_KO, {
    settings: {
        generalOutput: {
            processedSavePathName: '처리된 파일 저장 경로 사용자 지정',
            processedSavePathDesc: '켜기: 지정한 경로에 저장합니다. 끄기: 원본 폴더에 저장합니다.',
            processedFolderPathName: '처리된 파일 폴더 경로',
            processedFolderPathDesc: 'Vault 내부의 상대 경로입니다.',
            processedFolderPathPlaceholder: '예: Processed/Notes',
            moveOriginalName: '처리 후 원본 파일 이동',
            moveOriginalDesc: '켜기: 원본을 처리된 파일 폴더로 이동합니다. 끄기: "_processed.md"라는 복사본을 만듭니다.',
            customAddLinksFilenameName: '"Add links"에 사용자 지정 출력 파일명 사용',
            customAddLinksFilenameDesc: '켜기: 사용자 지정 접미사/대체 문자열을 사용합니다. 끄기: "_processed.md"를 사용합니다.',
            addLinksSuffixName: '사용자 지정 접미사/대체 문자열',
            addLinksSuffixDesc: '원본을 덮어쓰려면 비워 두세요. 예: "_linked".',
            addLinksSuffixPlaceholder: '덮어쓰려면 비워 두세요',
            removeCodeFencesName: '"Add links"에서 코드 펜스 제거',
            removeCodeFencesDesc: '켜기: "Process File"과 "Process Folder"의 최종 출력에서 모든 ```markdown 및 ``` 펜스를 제거합니다. 끄기: 코드 펜스를 유지합니다.',
            conceptNotePathName: '개념 노트 경로 사용자 지정',
            conceptNotePathDesc: '켜기: 지정한 경로에 새 개념 노트를 만듭니다. 끄기: 자동으로 만들지 않습니다.',
            conceptNoteFolderName: '개념 노트 폴더 경로',
            conceptNoteFolderDesc: 'Vault 내부의 상대 경로입니다.',
            conceptNoteFolderPlaceholder: '예: Concepts',
            generateConceptLogName: '개념 로그 파일 생성',
            generateConceptLogDesc: '켜기: 새로 만든 개념 노트를 기록합니다.',
            customLogPathName: '로그 파일 저장 경로 사용자 지정',
            customLogPathDescWithConceptFolder: '켜기: 지정한 경로에 로그를 저장합니다. 끄기: 개념 노트 폴더("{folder}")에 저장합니다.',
            customLogPathDescVault: '켜기: 지정한 경로에 로그를 저장합니다. 끄기: Vault 루트에 저장합니다.',
            conceptLogFolderName: '개념 로그 폴더 경로',
            conceptLogFolderDesc: '상대 경로입니다. 사용자 지정 경로를 활성화하면 필수입니다.',
            conceptLogFolderPlaceholder: '예: Logs/ConceptLogs',
            customLogFileNameToggleName: '로그 파일 이름 사용자 지정',
            customLogFileNameToggleDesc: '켜기: 지정한 이름을 사용합니다. 끄기: "{defaultName}"을 사용합니다.',
            conceptLogFileNameName: '개념 로그 파일 이름',
            conceptLogFileNameDesc: '로그 파일 이름입니다. 사용자 지정 이름이 활성화된 경우 필수입니다.'
        }
    }
});

extendLocale(STRINGS_NL, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Opslagpad voor verwerkt bestand aanpassen',
            processedSavePathDesc: 'Aan: opslaan op het opgegeven pad. Uit: opslaan in de oorspronkelijke map.',
            processedFolderPathName: 'Map-pad voor verwerkt bestand',
            processedFolderPathDesc: 'Relatief pad binnen de vault.',
            processedFolderPathPlaceholder: 'bijv. Processed/Notes',
            moveOriginalName: 'Oorspronkelijk bestand verplaatsen na verwerking',
            moveOriginalDesc: 'Aan: verplaats het origineel naar de map met verwerkte bestanden. Uit: maak een kopie met de naam "_processed.md".',
            customAddLinksFilenameName: 'Aangepaste uitvoerbestandsnaam gebruiken voor "Add links"',
            customAddLinksFilenameDesc: 'Aan: gebruik een aangepast achtervoegsel/vervanging. Uit: gebruik "_processed.md".',
            addLinksSuffixName: 'Aangepaste achtervoegsel-/vervangingsreeks',
            addLinksSuffixDesc: 'Leeg laten om het origineel te overschrijven. Voorbeeld: "_linked".',
            addLinksSuffixPlaceholder: 'Leeg laten om te overschrijven',
            removeCodeFencesName: 'Code fences verwijderen bij "Add links"',
            removeCodeFencesDesc: 'Aan: verwijdert alle ```markdown- en ```-fences uit de einduitvoer van "Process File" en "Process Folder". Uit: behoudt de code fences.',
            conceptNotePathName: 'Pad voor conceptnotities aanpassen',
            conceptNotePathDesc: 'Aan: maak nieuwe conceptnotities aan op het opgegeven pad. Uit: niet automatisch aanmaken.',
            conceptNoteFolderName: 'Map-pad voor conceptnotities',
            conceptNoteFolderDesc: 'Relatief pad binnen de vault.',
            conceptNoteFolderPlaceholder: 'bijv. Concepts',
            generateConceptLogName: 'Conceptlogbestand genereren',
            generateConceptLogDesc: 'Aan: log nieuw gemaakte conceptnotities.',
            customLogPathName: 'Opslagpad voor logbestand aanpassen',
            customLogPathDescWithConceptFolder: 'Aan: sla het log op in het opgegeven pad. Uit: sla het op in de map Conceptnotities ("{folder}").',
            customLogPathDescVault: 'Aan: sla het log op in het opgegeven pad. Uit: sla het op in de hoofdmap van de vault.',
            conceptLogFolderName: 'Map-pad voor conceptlog',
            conceptLogFolderDesc: 'Relatief pad. Vereist als een aangepast pad is ingeschakeld.',
            conceptLogFolderPlaceholder: 'bijv. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Naam van logbestand aanpassen',
            customLogFileNameToggleDesc: 'Aan: gebruik de opgegeven naam. Uit: gebruik "{defaultName}".',
            conceptLogFileNameName: 'Bestandsnaam van conceptlog',
            conceptLogFileNameDesc: 'Naam van het logbestand. Vereist als een aangepaste naam is ingeschakeld.'
        }
    }
});

extendLocale(STRINGS_PL, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Dostosuj ścieżkę zapisu przetworzonego pliku',
            processedSavePathDesc: 'Wł.: zapisz w podanej ścieżce. Wył.: zapisz w oryginalnym folderze.',
            processedFolderPathName: 'Ścieżka folderu przetworzonego pliku',
            processedFolderPathDesc: 'Ścieżka względna w obrębie vaultu.',
            processedFolderPathPlaceholder: 'np. Processed/Notes',
            moveOriginalName: 'Przenieś oryginalny plik po przetworzeniu',
            moveOriginalDesc: 'Wł.: przenieś oryginał do folderu plików przetworzonych. Wył.: utwórz kopię o nazwie "_processed.md".',
            customAddLinksFilenameName: 'Użyj niestandardowej nazwy pliku wyjściowego dla "Add links"',
            customAddLinksFilenameDesc: 'Wł.: użyj niestandardowego sufiksu/zamiany. Wył.: użyj "_processed.md".',
            addLinksSuffixName: 'Niestandardowy ciąg sufiksu/zamiany',
            addLinksSuffixDesc: 'Pozostaw puste, aby nadpisać oryginał. Np.: "_linked".',
            addLinksSuffixPlaceholder: 'Pozostaw puste, aby nadpisać',
            removeCodeFencesName: 'Usuń bloki kodu przy "Add links"',
            removeCodeFencesDesc: 'Wł.: usuwa wszystkie bloki ```markdown i ``` z końcowego wyniku "Process File" i "Process Folder". Wył.: zachowuje bloki kodu.',
            conceptNotePathName: 'Dostosuj ścieżkę notatek pojęciowych',
            conceptNotePathDesc: 'Wł.: twórz nowe notatki pojęciowe w podanej ścieżce. Wył.: nie twórz ich automatycznie.',
            conceptNoteFolderName: 'Ścieżka folderu notatek pojęciowych',
            conceptNoteFolderDesc: 'Ścieżka względna w obrębie vaultu.',
            conceptNoteFolderPlaceholder: 'np. Concepts',
            generateConceptLogName: 'Generuj plik dziennika pojęć',
            generateConceptLogDesc: 'Wł.: zapisuj w dzienniku nowo utworzone notatki pojęciowe.',
            customLogPathName: 'Dostosuj ścieżkę zapisu pliku dziennika',
            customLogPathDescWithConceptFolder: 'Wł.: zapisuj dziennik w podanej ścieżce. Wył.: zapisuj go w folderze notatek pojęciowych ("{folder}").',
            customLogPathDescVault: 'Wł.: zapisuj dziennik w podanej ścieżce. Wył.: zapisuj go w katalogu głównym vaultu.',
            conceptLogFolderName: 'Ścieżka folderu dziennika pojęć',
            conceptLogFolderDesc: 'Ścieżka względna. Wymagana, jeśli włączono ścieżkę niestandardową.',
            conceptLogFolderPlaceholder: 'np. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Dostosuj nazwę pliku dziennika',
            customLogFileNameToggleDesc: 'Wł.: użyj podanej nazwy. Wył.: użyj "{defaultName}".',
            conceptLogFileNameName: 'Nazwa pliku dziennika pojęć',
            conceptLogFileNameDesc: 'Nazwa pliku dziennika. Wymagana, jeśli włączono nazwę niestandardową.'
        }
    }
});

extendLocale(STRINGS_PT, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Personalizar o caminho de gravação do ficheiro processado',
            processedSavePathDesc: 'Ligado: guardar no caminho especificado. Desligado: guardar na pasta original.',
            processedFolderPathName: 'Caminho da pasta do ficheiro processado',
            processedFolderPathDesc: 'Caminho relativo dentro do vault.',
            processedFolderPathPlaceholder: 'Ex.: Processed/Notes',
            moveOriginalName: 'Mover o ficheiro original após o processamento',
            moveOriginalDesc: 'Ligado: mover o original para a pasta de processados. Desligado: criar uma cópia com o nome "_processed.md".',
            customAddLinksFilenameName: 'Usar um nome de ficheiro de saída personalizado para "Add links"',
            customAddLinksFilenameDesc: 'Ligado: usar um sufixo/substituição personalizado. Desligado: usar "_processed.md".',
            addLinksSuffixName: 'Cadeia personalizada de sufixo/substituição',
            addLinksSuffixDesc: 'Deixe vazio para sobrescrever o original. Ex.: "_linked".',
            addLinksSuffixPlaceholder: 'Deixe vazio para sobrescrever',
            removeCodeFencesName: 'Remover cercas de código em "Add links"',
            removeCodeFencesDesc: 'Ligado: remove todas as cercas ```markdown e ``` da saída final de "Process File" e "Process Folder". Desligado: mantém as cercas de código.',
            conceptNotePathName: 'Personalizar o caminho das notas de conceito',
            conceptNotePathDesc: 'Ligado: criar novas notas de conceito no caminho especificado. Desligado: não criar automaticamente.',
            conceptNoteFolderName: 'Caminho da pasta de notas de conceito',
            conceptNoteFolderDesc: 'Caminho relativo dentro do vault.',
            conceptNoteFolderPlaceholder: 'Ex.: Concepts',
            generateConceptLogName: 'Gerar ficheiro de registo de conceitos',
            generateConceptLogDesc: 'Ligado: registar as notas de conceito recém-criadas.',
            customLogPathName: 'Personalizar o caminho de gravação do ficheiro de registo',
            customLogPathDescWithConceptFolder: 'Ligado: guardar o registo no caminho especificado. Desligado: guardá-lo na Pasta de Notas de Conceito ("{folder}").',
            customLogPathDescVault: 'Ligado: guardar o registo no caminho especificado. Desligado: guardá-lo na raiz do vault.',
            conceptLogFolderName: 'Caminho da pasta do registo de conceitos',
            conceptLogFolderDesc: 'Caminho relativo. Obrigatório se o caminho personalizado estiver ativado.',
            conceptLogFolderPlaceholder: 'Ex.: Logs/ConceptLogs',
            customLogFileNameToggleName: 'Personalizar o nome do ficheiro de registo',
            customLogFileNameToggleDesc: 'Ligado: usar o nome especificado. Desligado: usar "{defaultName}".',
            conceptLogFileNameName: 'Nome do ficheiro de registo de conceitos',
            conceptLogFileNameDesc: 'Nome do ficheiro de registo. Obrigatório se o nome personalizado estiver ativado.'
        }
    }
});

extendLocale(STRINGS_PT_BR, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Personalizar o caminho de salvamento do arquivo processado',
            processedSavePathDesc: 'Ativado: salvar no caminho especificado. Desativado: salvar na pasta original.',
            processedFolderPathName: 'Caminho da pasta do arquivo processado',
            processedFolderPathDesc: 'Caminho relativo dentro do vault.',
            processedFolderPathPlaceholder: 'Ex.: Processed/Notes',
            moveOriginalName: 'Mover o arquivo original após o processamento',
            moveOriginalDesc: 'Ativado: mover o original para a pasta de processados. Desativado: criar uma cópia chamada "_processed.md".',
            customAddLinksFilenameName: 'Usar um nome de arquivo de saída personalizado para "Add links"',
            customAddLinksFilenameDesc: 'Ativado: usar um sufixo/substituição personalizado. Desativado: usar "_processed.md".',
            addLinksSuffixName: 'Cadeia personalizada de sufixo/substituição',
            addLinksSuffixDesc: 'Deixe em branco para sobrescrever o original. Ex.: "_linked".',
            addLinksSuffixPlaceholder: 'Deixe em branco para sobrescrever',
            removeCodeFencesName: 'Remover fences de código em "Add links"',
            removeCodeFencesDesc: 'Ativado: remove todos os fences ```markdown e ``` da saída final de "Process File" e "Process Folder". Desativado: mantém os fences de código.',
            conceptNotePathName: 'Personalizar o caminho das notas de conceito',
            conceptNotePathDesc: 'Ativado: criar novas notas de conceito no caminho especificado. Desativado: não criar automaticamente.',
            conceptNoteFolderName: 'Caminho da pasta de notas de conceito',
            conceptNoteFolderDesc: 'Caminho relativo dentro do vault.',
            conceptNoteFolderPlaceholder: 'Ex.: Concepts',
            generateConceptLogName: 'Gerar arquivo de log de conceitos',
            generateConceptLogDesc: 'Ativado: registrar as notas de conceito recém-criadas.',
            customLogPathName: 'Personalizar o caminho de salvamento do arquivo de log',
            customLogPathDescWithConceptFolder: 'Ativado: salvar o log no caminho especificado. Desativado: salvá-lo na pasta de notas de conceito ("{folder}").',
            customLogPathDescVault: 'Ativado: salvar o log no caminho especificado. Desativado: salvá-lo na raiz do vault.',
            conceptLogFolderName: 'Caminho da pasta do log de conceitos',
            conceptLogFolderDesc: 'Caminho relativo. Obrigatório se o caminho personalizado estiver ativado.',
            conceptLogFolderPlaceholder: 'Ex.: Logs/ConceptLogs',
            customLogFileNameToggleName: 'Personalizar o nome do arquivo de log',
            customLogFileNameToggleDesc: 'Ativado: usar o nome especificado. Desativado: usar "{defaultName}".',
            conceptLogFileNameName: 'Nome do arquivo de log de conceitos',
            conceptLogFileNameDesc: 'Nome do arquivo de log. Obrigatório se o nome personalizado estiver ativado.'
        }
    }
});

extendLocale(STRINGS_RU, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Настроить путь сохранения обработанного файла',
            processedSavePathDesc: 'Вкл: сохранять по указанному пути. Выкл: сохранять в исходной папке.',
            processedFolderPathName: 'Путь к папке обработанного файла',
            processedFolderPathDesc: 'Относительный путь внутри vault.',
            processedFolderPathPlaceholder: 'напр., Processed/Notes',
            moveOriginalName: 'Перемещать исходный файл после обработки',
            moveOriginalDesc: 'Вкл: перемещать оригинал в папку обработанных файлов. Выкл: создавать копию с именем "_processed.md".',
            customAddLinksFilenameName: 'Использовать пользовательское имя выходного файла для "Add links"',
            customAddLinksFilenameDesc: 'Вкл: использовать пользовательский суффикс/замену. Выкл: использовать "_processed.md".',
            addLinksSuffixName: 'Пользовательская строка суффикса/замены',
            addLinksSuffixDesc: 'Оставьте пустым, чтобы перезаписать оригинал. Пример: "_linked".',
            addLinksSuffixPlaceholder: 'Оставьте пустым для перезаписи',
            removeCodeFencesName: 'Удалять кодовые ограждения при "Add links"',
            removeCodeFencesDesc: 'Вкл: удалять все ограждения ```markdown и ``` из итогового вывода "Process File" и "Process Folder". Выкл: сохранять кодовые ограждения.',
            conceptNotePathName: 'Настроить путь заметок-концептов',
            conceptNotePathDesc: 'Вкл: создавать новые заметки-концепты по указанному пути. Выкл: не создавать автоматически.',
            conceptNoteFolderName: 'Путь к папке заметок-концептов',
            conceptNoteFolderDesc: 'Относительный путь внутри vault.',
            conceptNoteFolderPlaceholder: 'напр., Concepts',
            generateConceptLogName: 'Создавать файл журнала концептов',
            generateConceptLogDesc: 'Вкл: записывать в журнал новые заметки-концепты.',
            customLogPathName: 'Настроить путь сохранения файла журнала',
            customLogPathDescWithConceptFolder: 'Вкл: сохранять журнал по указанному пути. Выкл: сохранять его в папке заметок-концептов ("{folder}").',
            customLogPathDescVault: 'Вкл: сохранять журнал по указанному пути. Выкл: сохранять его в корне vault.',
            conceptLogFolderName: 'Путь к папке журнала концептов',
            conceptLogFolderDesc: 'Относительный путь. Требуется, если включён пользовательский путь.',
            conceptLogFolderPlaceholder: 'напр., Logs/ConceptLogs',
            customLogFileNameToggleName: 'Настроить имя файла журнала',
            customLogFileNameToggleDesc: 'Вкл: использовать указанное имя. Выкл: использовать "{defaultName}".',
            conceptLogFileNameName: 'Имя файла журнала концептов',
            conceptLogFileNameDesc: 'Имя файла журнала. Требуется, если включено пользовательское имя.'
        }
    }
});

extendLocale(STRINGS_TH, {
    settings: {
        generalOutput: {
            processedSavePathName: 'กำหนดเส้นทางบันทึกไฟล์ที่ประมวลผลแล้วเอง',
            processedSavePathDesc: 'เปิด: บันทึกไปยังเส้นทางที่ระบุ ปิด: บันทึกไว้ในโฟลเดอร์เดิม',
            processedFolderPathName: 'เส้นทางโฟลเดอร์ของไฟล์ที่ประมวลผลแล้ว',
            processedFolderPathDesc: 'เส้นทางสัมพัทธ์ภายใน vault',
            processedFolderPathPlaceholder: 'เช่น Processed/Notes',
            moveOriginalName: 'ย้ายไฟล์ต้นฉบับหลังประมวลผล',
            moveOriginalDesc: 'เปิด: ย้ายไฟล์ต้นฉบับไปยังโฟลเดอร์ไฟล์ที่ประมวลผลแล้ว ปิด: สร้างสำเนาชื่อ "_processed.md"',
            customAddLinksFilenameName: 'ใช้ชื่อไฟล์เอาต์พุตแบบกำหนดเองสำหรับ "Add links"',
            customAddLinksFilenameDesc: 'เปิด: ใช้ส่วนต่อท้าย/การแทนที่แบบกำหนดเอง ปิด: ใช้ "_processed.md"',
            addLinksSuffixName: 'สตริงส่วนต่อท้าย/การแทนที่แบบกำหนดเอง',
            addLinksSuffixDesc: 'เว้นว่างไว้เพื่อเขียนทับต้นฉบับ ตัวอย่าง: "_linked"',
            addLinksSuffixPlaceholder: 'เว้นว่างไว้เพื่อเขียนทับ',
            removeCodeFencesName: 'ลบ code fences ใน "Add links"',
            removeCodeFencesDesc: 'เปิด: ลบ fences ```markdown และ ``` ทั้งหมดจากเอาต์พุตสุดท้ายของ "Process File" และ "Process Folder" ปิด: คง code fences ไว้',
            conceptNotePathName: 'กำหนดเส้นทางบันทึกโน้ตแนวคิดเอง',
            conceptNotePathDesc: 'เปิด: สร้างโน้ตแนวคิดใหม่ในเส้นทางที่ระบุ ปิด: ไม่สร้างโดยอัตโนมัติ',
            conceptNoteFolderName: 'เส้นทางโฟลเดอร์โน้ตแนวคิด',
            conceptNoteFolderDesc: 'เส้นทางสัมพัทธ์ภายใน vault',
            conceptNoteFolderPlaceholder: 'เช่น Concepts',
            generateConceptLogName: 'สร้างไฟล์บันทึกแนวคิด',
            generateConceptLogDesc: 'เปิด: บันทึกโน้ตแนวคิดที่เพิ่งสร้างใหม่',
            customLogPathName: 'กำหนดเส้นทางบันทึกไฟล์ log เอง',
            customLogPathDescWithConceptFolder: 'เปิด: บันทึก log ไปยังเส้นทางที่ระบุ ปิด: บันทึกไว้ในโฟลเดอร์โน้ตแนวคิด ("{folder}")',
            customLogPathDescVault: 'เปิด: บันทึก log ไปยังเส้นทางที่ระบุ ปิด: บันทึกไว้ที่รากของ vault',
            conceptLogFolderName: 'เส้นทางโฟลเดอร์บันทึกแนวคิด',
            conceptLogFolderDesc: 'เส้นทางสัมพัทธ์ จำเป็นเมื่อเปิดใช้เส้นทางแบบกำหนดเอง',
            conceptLogFolderPlaceholder: 'เช่น Logs/ConceptLogs',
            customLogFileNameToggleName: 'กำหนดชื่อไฟล์ log เอง',
            customLogFileNameToggleDesc: 'เปิด: ใช้ชื่อที่ระบุ ปิด: ใช้ "{defaultName}"',
            conceptLogFileNameName: 'ชื่อไฟล์บันทึกแนวคิด',
            conceptLogFileNameDesc: 'ชื่อไฟล์ log จำเป็นเมื่อเปิดใช้ชื่อแบบกำหนดเอง'
        }
    }
});

extendLocale(STRINGS_TR, {
    settings: {
        generalOutput: {
            processedSavePathName: 'İşlenen dosya kayıt yolunu özelleştir',
            processedSavePathDesc: 'Açık: belirtilen yola kaydet. Kapalı: özgün klasöre kaydet.',
            processedFolderPathName: 'İşlenen dosya klasör yolu',
            processedFolderPathDesc: 'Vault içindeki göreli yol.',
            processedFolderPathPlaceholder: 'örn. Processed/Notes',
            moveOriginalName: 'İşlemden sonra özgün dosyayı taşı',
            moveOriginalDesc: 'Açık: özgün dosyayı işlenenler klasörüne taşı. Kapalı: "_processed.md" adlı bir kopya oluştur.',
            customAddLinksFilenameName: '"Add links" için özel çıktı dosya adı kullan',
            customAddLinksFilenameDesc: 'Açık: özel sonek/değiştirme kullan. Kapalı: "_processed.md" kullan.',
            addLinksSuffixName: 'Özel sonek/değiştirme dizgesi',
            addLinksSuffixDesc: 'Özgünü ezmek için boş bırakın. Örn.: "_linked".',
            addLinksSuffixPlaceholder: 'Ezmek için boş bırakın',
            removeCodeFencesName: '"Add links" sırasında kod çitlerini kaldır',
            removeCodeFencesDesc: 'Açık: "Process File" ve "Process Folder" son çıktısından tüm ```markdown ve ``` çitlerini kaldırır. Kapalı: kod çitlerini korur.',
            conceptNotePathName: 'Kavram notu yolunu özelleştir',
            conceptNotePathDesc: 'Açık: yeni kavram notlarını belirtilen yolda oluşturur. Kapalı: otomatik olarak oluşturmaz.',
            conceptNoteFolderName: 'Kavram notu klasör yolu',
            conceptNoteFolderDesc: 'Vault içindeki göreli yol.',
            conceptNoteFolderPlaceholder: 'örn. Concepts',
            generateConceptLogName: 'Kavram günlük dosyası oluştur',
            generateConceptLogDesc: 'Açık: yeni oluşturulan kavram notlarını günlüğe kaydeder.',
            customLogPathName: 'Günlük dosyası kayıt yolunu özelleştir',
            customLogPathDescWithConceptFolder: 'Açık: günlüğü belirtilen yola kaydet. Kapalı: Kavram Notu Klasörü\'ne ("{folder}") kaydet.',
            customLogPathDescVault: 'Açık: günlüğü belirtilen yola kaydet. Kapalı: vault köküne kaydet.',
            conceptLogFolderName: 'Kavram günlük klasör yolu',
            conceptLogFolderDesc: 'Göreli yol. Özel yol etkinse gereklidir.',
            conceptLogFolderPlaceholder: 'örn. Logs/ConceptLogs',
            customLogFileNameToggleName: 'Günlük dosya adını özelleştir',
            customLogFileNameToggleDesc: 'Açık: belirtilen adı kullan. Kapalı: "{defaultName}" kullan.',
            conceptLogFileNameName: 'Kavram günlük dosya adı',
            conceptLogFileNameDesc: 'Günlük dosyasının adı. Özel ad etkinse gereklidir.'
        }
    }
});

extendLocale(STRINGS_UK, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Налаштувати шлях збереження обробленого файла',
            processedSavePathDesc: 'Увімкнено: зберігати у вказаний шлях. Вимкнено: зберігати в початкову папку.',
            processedFolderPathName: 'Шлях до папки обробленого файла',
            processedFolderPathDesc: 'Відносний шлях усередині vault.',
            processedFolderPathPlaceholder: 'напр., Processed/Notes',
            moveOriginalName: 'Переміщувати оригінальний файл після обробки',
            moveOriginalDesc: 'Увімкнено: перемістити оригінал до папки оброблених файлів. Вимкнено: створити копію з назвою "_processed.md".',
            customAddLinksFilenameName: 'Використовувати власну назву вихідного файла для "Add links"',
            customAddLinksFilenameDesc: 'Увімкнено: використовувати власний суфікс/заміну. Вимкнено: використовувати "_processed.md".',
            addLinksSuffixName: 'Користувацький рядок суфікса/заміни',
            addLinksSuffixDesc: 'Залиште порожнім, щоб перезаписати оригінал. Напр.: "_linked".',
            addLinksSuffixPlaceholder: 'Залиште порожнім для перезапису',
            removeCodeFencesName: 'Видаляти кодові огорожі в "Add links"',
            removeCodeFencesDesc: 'Увімкнено: видаляє всі огорожі ```markdown і ``` з фінального виводу "Process File" та "Process Folder". Вимкнено: зберігає кодові огорожі.',
            conceptNotePathName: 'Налаштувати шлях нотаток-концептів',
            conceptNotePathDesc: 'Увімкнено: створювати нові нотатки-концепти у вказаному шляху. Вимкнено: не створювати автоматично.',
            conceptNoteFolderName: 'Шлях до папки нотаток-концептів',
            conceptNoteFolderDesc: 'Відносний шлях усередині vault.',
            conceptNoteFolderPlaceholder: 'напр., Concepts',
            generateConceptLogName: 'Створювати файл журналу концептів',
            generateConceptLogDesc: 'Увімкнено: журналювати щойно створені нотатки-концепти.',
            customLogPathName: 'Налаштувати шлях збереження файла журналу',
            customLogPathDescWithConceptFolder: 'Увімкнено: зберігати журнал у вказаний шлях. Вимкнено: зберігати його в папці нотаток-концептів ("{folder}").',
            customLogPathDescVault: 'Увімкнено: зберігати журнал у вказаний шлях. Вимкнено: зберігати його в корені vault.',
            conceptLogFolderName: 'Шлях до папки журналу концептів',
            conceptLogFolderDesc: 'Відносний шлях. Обов’язково, якщо ввімкнено власний шлях.',
            conceptLogFolderPlaceholder: 'напр., Logs/ConceptLogs',
            customLogFileNameToggleName: 'Налаштувати назву файла журналу',
            customLogFileNameToggleDesc: 'Увімкнено: використовувати вказану назву. Вимкнено: використовувати "{defaultName}".',
            conceptLogFileNameName: 'Назва файла журналу концептів',
            conceptLogFileNameDesc: 'Назва файла журналу. Обов’язково, якщо ввімкнено власну назву.'
        }
    }
});

extendLocale(STRINGS_VI, {
    settings: {
        generalOutput: {
            processedSavePathName: 'Tùy chỉnh đường dẫn lưu tệp đã xử lý',
            processedSavePathDesc: 'Bật: lưu vào đường dẫn đã chỉ định. Tắt: lưu trong thư mục gốc.',
            processedFolderPathName: 'Đường dẫn thư mục của tệp đã xử lý',
            processedFolderPathDesc: 'Đường dẫn tương đối trong vault.',
            processedFolderPathPlaceholder: 'ví dụ: Processed/Notes',
            moveOriginalName: 'Di chuyển tệp gốc sau khi xử lý',
            moveOriginalDesc: 'Bật: di chuyển tệp gốc vào thư mục tệp đã xử lý. Tắt: tạo một bản sao có tên "_processed.md".',
            customAddLinksFilenameName: 'Dùng tên tệp đầu ra tùy chỉnh cho "Add links"',
            customAddLinksFilenameDesc: 'Bật: dùng hậu tố/thay thế tùy chỉnh. Tắt: dùng "_processed.md".',
            addLinksSuffixName: 'Chuỗi hậu tố/thay thế tùy chỉnh',
            addLinksSuffixDesc: 'Để trống để ghi đè tệp gốc. Ví dụ: "_linked".',
            addLinksSuffixPlaceholder: 'Để trống để ghi đè',
            removeCodeFencesName: 'Xóa code fences khi "Add links"',
            removeCodeFencesDesc: 'Bật: xóa tất cả fences ```markdown và ``` khỏi đầu ra cuối cùng của "Process File" và "Process Folder". Tắt: giữ nguyên code fences.',
            conceptNotePathName: 'Tùy chỉnh đường dẫn ghi chú khái niệm',
            conceptNotePathDesc: 'Bật: tạo ghi chú khái niệm mới tại đường dẫn đã chỉ định. Tắt: không tạo tự động.',
            conceptNoteFolderName: 'Đường dẫn thư mục ghi chú khái niệm',
            conceptNoteFolderDesc: 'Đường dẫn tương đối trong vault.',
            conceptNoteFolderPlaceholder: 'ví dụ: Concepts',
            generateConceptLogName: 'Tạo tệp nhật ký khái niệm',
            generateConceptLogDesc: 'Bật: ghi lại các ghi chú khái niệm mới được tạo.',
            customLogPathName: 'Tùy chỉnh đường dẫn lưu tệp nhật ký',
            customLogPathDescWithConceptFolder: 'Bật: lưu nhật ký vào đường dẫn đã chỉ định. Tắt: lưu trong thư mục Ghi chú Khái niệm ("{folder}").',
            customLogPathDescVault: 'Bật: lưu nhật ký vào đường dẫn đã chỉ định. Tắt: lưu tại thư mục gốc của vault.',
            conceptLogFolderName: 'Đường dẫn thư mục nhật ký khái niệm',
            conceptLogFolderDesc: 'Đường dẫn tương đối. Bắt buộc nếu bật đường dẫn tùy chỉnh.',
            conceptLogFolderPlaceholder: 'ví dụ: Logs/ConceptLogs',
            customLogFileNameToggleName: 'Tùy chỉnh tên tệp nhật ký',
            customLogFileNameToggleDesc: 'Bật: dùng tên đã chỉ định. Tắt: dùng "{defaultName}".',
            conceptLogFileNameName: 'Tên tệp nhật ký khái niệm',
            conceptLogFileNameDesc: 'Tên của tệp nhật ký. Bắt buộc nếu bật tên tùy chỉnh.'
        }
    }
});

extendLocale(STRINGS_ES, {
    errorModal: {
        titles: {
            generic: 'Error general'
        }
    }
});

extendLocale(STRINGS_AR, {
    sidebar: {
        status: {
            workflowStart: 'سير العمل: {name}',
            workflowComplete: 'اكتمل سير العمل "{name}"',
            workflowFailed: 'فشل سير العمل',
            workflowFailedLog: 'فشل سير العمل: {message}',
            workflowFinishedWithErrors: 'انتهى سير العمل "{name}" مع {count} خطأ/أخطاء',
            stepLabel: '[{current}/{total}] الخطوة: {label}',
            stepLog: 'الخطوة {current}/{total}: {label}',
            processingActive: 'جارٍ المعالجة... (النشط: {count})',
            timeRemaining: 'الوقت المتبقي المقدر: {time}',
            timeRemainingCalculating: 'الوقت المتبقي المقدر: جارٍ الحساب...',
            stopped: 'متوقف'
        },
        builtInActionsPrefix: 'إجراءات {category} المضمنة.',
        workflowFallbackWarning: 'يحتوي DSL الخاص بسير العمل على {count} مشكلة/مشكلات. يستخدم الشريط الجانبي الوضع الاحتياطي الافتراضي.'
    },
    errorModal: {
        titles: {
            processing: 'خطأ معالجة Notemd',
            batchProcessing: 'خطأ المعالجة الدُفعية في Notemd',
            llmConnectionTest: 'خطأ اختبار اتصال LLM',
            contentGeneration: 'خطأ إنشاء المحتوى',
            batchGeneration: 'خطأ التوليد الدُفعي في Notemd',
            duplicateCheckRemove: 'خطأ فحص/إزالة التكرارات',
            batchMermaidFix: 'خطأ إصلاح Mermaid الدُفعي في Notemd',
            translation: 'خطأ الترجمة',
            conceptExtraction: 'خطأ استخراج المفاهيم',
            batchConceptExtraction: 'خطأ استخراج المفاهيم الدُفعي',
            generic: 'خطأ',
            extraction: 'خطأ الاستخراج'
        }
    }
});

extendLocale(STRINGS_DE, {
    sidebar: {
        status: {
            workflowStart: 'Ablauf: {name}',
            workflowComplete: 'Ablauf "{name}" abgeschlossen',
            workflowFailed: 'Ablauf fehlgeschlagen',
            workflowFailedLog: 'Ablauf fehlgeschlagen: {message}',
            workflowFinishedWithErrors: 'Ablauf "{name}" mit {count} Fehler(n) abgeschlossen',
            stepLabel: '[{current}/{total}] Schritt: {label}',
            stepLog: 'Schritt {current}/{total}: {label}',
            processingActive: 'Verarbeitung... (Aktiv: {count})',
            timeRemaining: 'Geschätzte Restzeit: {time}',
            timeRemainingCalculating: 'Geschätzte Restzeit: wird berechnet...',
            stopped: 'Gestoppt'
        },
        builtInActionsPrefix: 'Integrierte {category}-Aktionen.',
        workflowFallbackWarning: 'Das Workflow-DSL hat {count} Problem(e). Die Seitenleiste verwendet den Standard-Fallback.'
    },
    errorModal: {
        titles: {
            processing: 'Notemd-Verarbeitungsfehler',
            batchProcessing: 'Notemd-Stapelverarbeitungsfehler',
            llmConnectionTest: 'Fehler beim LLM-Verbindungstest',
            contentGeneration: 'Fehler bei der Inhaltserstellung',
            batchGeneration: 'Notemd-Stapelgenerierungsfehler',
            duplicateCheckRemove: 'Fehler bei Duplikatprüfung/-entfernung',
            batchMermaidFix: 'Notemd-Fehler bei Stapel-Mermaid-Reparatur',
            translation: 'Übersetzungsfehler',
            conceptExtraction: 'Fehler bei Konzeptextraktion',
            batchConceptExtraction: 'Fehler bei Stapel-Konzeptextraktion',
            generic: 'Fehler',
            extraction: 'Extraktionsfehler'
        }
    }
});

extendLocale(STRINGS_ES, {
    sidebar: {
        status: {
            workflowStart: 'Flujo: {name}',
            workflowComplete: 'Flujo "{name}" completado',
            workflowFailed: 'El flujo falló',
            workflowFailedLog: 'El flujo falló: {message}',
            workflowFinishedWithErrors: 'El flujo "{name}" terminó con {count} error(es)',
            stepLabel: '[{current}/{total}] Paso: {label}',
            stepLog: 'Paso {current}/{total}: {label}',
            processingActive: 'Procesando... (Activos: {count})',
            timeRemaining: 'Tiempo restante estimado: {time}',
            timeRemainingCalculating: 'Tiempo restante estimado: calculando...',
            stopped: 'Detenido'
        },
        builtInActionsPrefix: 'Acciones integradas de {category}.',
        workflowFallbackWarning: 'El DSL del flujo tiene {count} problema(s). La barra lateral usa el fallback predeterminado.'
    },
    errorModal: {
        titles: {
            processing: 'Error de procesamiento de Notemd',
            batchProcessing: 'Error de procesamiento por lotes de Notemd',
            llmConnectionTest: 'Error de prueba de conexión LLM',
            contentGeneration: 'Error de generación de contenido',
            batchGeneration: 'Error de generación por lotes de Notemd',
            duplicateCheckRemove: 'Error de comprobación/eliminación de duplicados',
            batchMermaidFix: 'Error de corrección Mermaid por lotes de Notemd',
            translation: 'Error de traducción',
            conceptExtraction: 'Error de extracción de conceptos',
            batchConceptExtraction: 'Error de extracción de conceptos por lotes',
            generic: 'Error',
            extraction: 'Error de extracción'
        }
    }
});

extendLocale(STRINGS_FA, {
    sidebar: {
        status: {
            workflowStart: 'گردش‌کار: {name}',
            workflowComplete: 'گردش‌کار "{name}" کامل شد',
            workflowFailed: 'گردش‌کار ناموفق بود',
            workflowFailedLog: 'گردش‌کار ناموفق بود: {message}',
            workflowFinishedWithErrors: 'گردش‌کار "{name}" با {count} خطا تمام شد',
            stepLabel: '[{current}/{total}] گام: {label}',
            stepLog: 'گام {current}/{total}: {label}',
            processingActive: 'در حال پردازش... (فعال: {count})',
            timeRemaining: 'زمان باقی‌مانده تخمینی: {time}',
            timeRemainingCalculating: 'زمان باقی‌مانده تخمینی: در حال محاسبه...',
            stopped: 'متوقف'
        },
        builtInActionsPrefix: 'اقدام‌های داخلی {category}.',
        workflowFallbackWarning: 'DSL گردش‌کار {count} مشکل دارد. نوار کناری از حالت جایگزین پیش‌فرض استفاده می‌کند.'
    },
    errorModal: {
        titles: {
            processing: 'خطای پردازش Notemd',
            batchProcessing: 'خطای پردازش دسته‌ای Notemd',
            llmConnectionTest: 'خطای آزمون اتصال LLM',
            contentGeneration: 'خطای تولید محتوا',
            batchGeneration: 'خطای تولید دسته‌ای Notemd',
            duplicateCheckRemove: 'خطای بررسی/حذف موارد تکراری',
            batchMermaidFix: 'خطای اصلاح دسته‌ای Mermaid در Notemd',
            translation: 'خطای ترجمه',
            conceptExtraction: 'خطای استخراج مفاهیم',
            batchConceptExtraction: 'خطای استخراج دسته‌ای مفاهیم',
            generic: 'خطا',
            extraction: 'خطای استخراج'
        }
    }
});

extendLocale(STRINGS_FR, {
    sidebar: {
        status: {
            workflowStart: 'Workflow : {name}',
            workflowComplete: 'Workflow "{name}" terminé',
            workflowFailed: 'Échec du workflow',
            workflowFailedLog: 'Échec du workflow : {message}',
            workflowFinishedWithErrors: 'Workflow "{name}" terminé avec {count} erreur(s)',
            stepLabel: '[{current}/{total}] Étape : {label}',
            stepLog: 'Étape {current}/{total} : {label}',
            processingActive: 'Traitement... (Actifs : {count})',
            timeRemaining: 'Temps restant estimé : {time}',
            timeRemainingCalculating: 'Temps restant estimé : calcul en cours...',
            stopped: 'Arrêté'
        },
        builtInActionsPrefix: 'Actions intégrées de {category}.',
        workflowFallbackWarning: 'Le DSL du workflow contient {count} problème(s). La barre latérale utilise le repli par défaut.'
    },
    errorModal: {
        titles: {
            processing: 'Erreur de traitement Notemd',
            batchProcessing: 'Erreur de traitement par lot Notemd',
            llmConnectionTest: 'Erreur de test de connexion LLM',
            contentGeneration: 'Erreur de génération de contenu',
            batchGeneration: 'Erreur de génération par lot Notemd',
            duplicateCheckRemove: 'Erreur de vérification/suppression des doublons',
            batchMermaidFix: 'Erreur de correction Mermaid par lot Notemd',
            translation: 'Erreur de traduction',
            conceptExtraction: 'Erreur d’extraction des concepts',
            batchConceptExtraction: 'Erreur d’extraction des concepts par lot',
            generic: 'Erreur',
            extraction: 'Erreur d’extraction'
        }
    }
});

extendLocale(STRINGS_ID, {
    sidebar: {
        status: {
            workflowStart: 'Alur kerja: {name}',
            workflowComplete: 'Alur kerja "{name}" selesai',
            workflowFailed: 'Alur kerja gagal',
            workflowFailedLog: 'Alur kerja gagal: {message}',
            workflowFinishedWithErrors: 'Alur kerja "{name}" selesai dengan {count} kesalahan',
            stepLabel: '[{current}/{total}] Langkah: {label}',
            stepLog: 'Langkah {current}/{total}: {label}',
            processingActive: 'Memproses... (Aktif: {count})',
            timeRemaining: 'Perkiraan sisa waktu: {time}',
            timeRemainingCalculating: 'Perkiraan sisa waktu: menghitung...',
            stopped: 'Dihentikan'
        },
        builtInActionsPrefix: 'Aksi bawaan {category}.',
        workflowFallbackWarning: 'DSL alur kerja memiliki {count} masalah. Bilah sisi menggunakan fallback bawaan.'
    },
    errorModal: {
        titles: {
            processing: 'Kesalahan Pemrosesan Notemd',
            batchProcessing: 'Kesalahan Pemrosesan Batch Notemd',
            llmConnectionTest: 'Kesalahan Uji Koneksi LLM',
            contentGeneration: 'Kesalahan Pembuatan Konten',
            batchGeneration: 'Kesalahan Pembuatan Batch Notemd',
            duplicateCheckRemove: 'Kesalahan Periksa/Hapus Duplikat',
            batchMermaidFix: 'Kesalahan Perbaikan Mermaid Batch Notemd',
            translation: 'Kesalahan Terjemahan',
            conceptExtraction: 'Kesalahan Ekstraksi Konsep',
            batchConceptExtraction: 'Kesalahan Ekstraksi Konsep Batch',
            generic: 'Kesalahan',
            extraction: 'Kesalahan Ekstraksi'
        }
    }
});

extendLocale(STRINGS_IT, {
    sidebar: {
        status: {
            workflowStart: 'Flusso: {name}',
            workflowComplete: 'Flusso "{name}" completato',
            workflowFailed: 'Flusso non riuscito',
            workflowFailedLog: 'Flusso non riuscito: {message}',
            workflowFinishedWithErrors: 'Flusso "{name}" completato con {count} errori',
            stepLabel: '[{current}/{total}] Passo: {label}',
            stepLog: 'Passo {current}/{total}: {label}',
            processingActive: 'Elaborazione... (Attivi: {count})',
            timeRemaining: 'Tempo rimanente stimato: {time}',
            timeRemainingCalculating: 'Tempo rimanente stimato: calcolo in corso...',
            stopped: 'Interrotto'
        },
        builtInActionsPrefix: 'Azioni integrate di {category}.',
        workflowFallbackWarning: 'Il DSL del workflow ha {count} problema/i. La barra laterale usa il fallback predefinito.'
    },
    errorModal: {
        titles: {
            processing: 'Errore di elaborazione Notemd',
            batchProcessing: 'Errore di elaborazione batch Notemd',
            llmConnectionTest: 'Errore test connessione LLM',
            contentGeneration: 'Errore di generazione contenuto',
            batchGeneration: 'Errore di generazione batch Notemd',
            duplicateCheckRemove: 'Errore controllo/rimozione duplicati',
            batchMermaidFix: 'Errore di correzione Mermaid batch Notemd',
            translation: 'Errore di traduzione',
            conceptExtraction: 'Errore di estrazione concetti',
            batchConceptExtraction: 'Errore di estrazione concetti batch',
            generic: 'Errore',
            extraction: 'Errore di estrazione'
        }
    }
});

extendLocale(STRINGS_JA, {
    sidebar: {
        status: {
            workflowStart: 'ワークフロー: {name}',
            workflowComplete: 'ワークフロー「{name}」が完了しました',
            workflowFailed: 'ワークフローに失敗しました',
            workflowFailedLog: 'ワークフローに失敗しました: {message}',
            workflowFinishedWithErrors: 'ワークフロー「{name}」は {count} 件のエラーで終了しました',
            stepLabel: '[{current}/{total}] 手順: {label}',
            stepLog: '手順 {current}/{total}: {label}',
            processingActive: '処理中...（実行中: {count}）',
            timeRemaining: '推定残り時間: {time}',
            timeRemainingCalculating: '推定残り時間: 計算中...',
            stopped: '停止済み'
        },
        builtInActionsPrefix: '組み込みの {category} アクション。',
        workflowFallbackWarning: 'ワークフロー DSL に {count} 件の問題があります。サイドバーは既定のフォールバックを使用しています。'
    },
    errorModal: {
        titles: {
            processing: 'Notemd 処理エラー',
            batchProcessing: 'Notemd 一括処理エラー',
            llmConnectionTest: 'LLM 接続テストエラー',
            contentGeneration: 'コンテンツ生成エラー',
            batchGeneration: 'Notemd 一括生成エラー',
            duplicateCheckRemove: '重複確認/削除エラー',
            batchMermaidFix: 'Notemd 一括 Mermaid 修正エラー',
            translation: '翻訳エラー',
            conceptExtraction: '概念抽出エラー',
            batchConceptExtraction: '一括概念抽出エラー',
            generic: 'エラー',
            extraction: '抽出エラー'
        }
    }
});

extendLocale(STRINGS_KO, {
    sidebar: {
        status: {
            workflowStart: '워크플로: {name}',
            workflowComplete: '워크플로 "{name}" 완료',
            workflowFailed: '워크플로 실패',
            workflowFailedLog: '워크플로 실패: {message}',
            workflowFinishedWithErrors: '워크플로 "{name}"이(가) {count}개의 오류와 함께 완료되었습니다',
            stepLabel: '[{current}/{total}] 단계: {label}',
            stepLog: '단계 {current}/{total}: {label}',
            processingActive: '처리 중... (활성: {count})',
            timeRemaining: '예상 남은 시간: {time}',
            timeRemainingCalculating: '예상 남은 시간: 계산 중...',
            stopped: '중지됨'
        },
        builtInActionsPrefix: '기본 제공 {category} 작업입니다.',
        workflowFallbackWarning: '워크플로 DSL에 {count}개의 문제가 있습니다. 사이드바는 기본 fallback을 사용합니다.'
    },
    errorModal: {
        titles: {
            processing: 'Notemd 처리 오류',
            batchProcessing: 'Notemd 일괄 처리 오류',
            llmConnectionTest: 'LLM 연결 테스트 오류',
            contentGeneration: '콘텐츠 생성 오류',
            batchGeneration: 'Notemd 일괄 생성 오류',
            duplicateCheckRemove: '중복 확인/제거 오류',
            batchMermaidFix: 'Notemd 일괄 Mermaid 수정 오류',
            translation: '번역 오류',
            conceptExtraction: '개념 추출 오류',
            batchConceptExtraction: '일괄 개념 추출 오류',
            generic: '오류',
            extraction: '추출 오류'
        }
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
        workflowBuilder: {
            heading: 'Кнопки workflow в один клик',
            errorStrategyName: 'Стратегия ошибок рабочего процесса',
            errorStrategyDesc: 'Остановиться сразу при первом неудачном шаге или продолжить и завершить оставшиеся шаги.',
            errorStrategyStop: 'Остановиться при первой ошибке',
            errorStrategyContinue: 'Продолжать при ошибке',
            visualBuilderName: 'Визуальный конструктор рабочих процессов',
            visualBuilderDesc: 'Создавайте пользовательские кнопки workflow из встроенных действий без написания DSL.',
            advancedDslName: 'Расширенный редактор DSL',
            advancedDslDesc: 'Необязательно: редактируйте напрямую в формате Button Name::action-a>action-b. Визуальный редактор и DSL остаются синхронизированными.',
            dslValidationName: 'Проверка DSL workflow',
            dslValidationDesc: 'Обнаружено {count} проблем(ы). Недопустимые строки игнорируются при отрисовке боковой панели.',
            availableActionIdsName: 'Доступные идентификаторы действий workflow',
            builderDslWarning: 'Обнаружено {count} проблем(ы) в DSL. Визуальный редактор загрузил безопасное резервное состояние workflow.',
            builderCardTitle: 'Рабочий процесс {index}',
            deleteButton: 'Удалить',
            workflowRemovedNotice: 'Рабочий процесс удален.',
            buttonNameLabel: 'Имя кнопки',
            buttonNamePlaceholder: 'Рабочий процесс {index}',
            actionSequenceTitle: 'Последовательность действий',
            removeAction: 'Удалить',
            addAction: 'Добавить действие',
            addWorkflow: 'Добавить рабочий процесс',
            workflowAddedNotice: 'Рабочий процесс добавлен.',
            resetDefault: 'Сбросить по умолчанию',
            resetDefaultNotice: 'Восстановлены рабочие процессы по умолчанию в один клик.'
        },
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
        workflowBuilder: {
            heading: 'ปุ่มเวิร์กโฟลว์แบบคลิกเดียว',
            errorStrategyName: 'กลยุทธ์ข้อผิดพลาดของเวิร์กโฟลว์',
            errorStrategyDesc: 'หยุดทันทีเมื่อขั้นตอนแรกล้มเหลว หรือทำต่อและทำขั้นตอนที่เหลือให้เสร็จ',
            errorStrategyStop: 'หยุดเมื่อเกิดข้อผิดพลาดแรก',
            errorStrategyContinue: 'ทำต่อเมื่อเกิดข้อผิดพลาด',
            visualBuilderName: 'ตัวสร้างเวิร์กโฟลว์แบบภาพ',
            visualBuilderDesc: 'สร้างปุ่มเวิร์กโฟลว์แบบกำหนดเองจากแอ็กชันในตัวได้โดยไม่ต้องเขียน DSL',
            advancedDslName: 'ตัวแก้ไข DSL ขั้นสูง',
            advancedDslDesc: 'ไม่บังคับ: แก้ไขโดยตรงด้วยรูปแบบ Button Name::action-a>action-b โดยตัวแก้ไขแบบภาพและ DSL จะซิงก์กันอยู่เสมอ',
            dslValidationName: 'การตรวจสอบ DSL ของเวิร์กโฟลว์',
            dslValidationDesc: 'พบปัญหา {count} รายการ ระบบจะละเว้นบรรทัดที่ไม่ถูกต้องเมื่อแสดงผลในแถบด้านข้าง',
            availableActionIdsName: 'รหัสแอ็กชันเวิร์กโฟลว์ที่ใช้ได้',
            builderDslWarning: 'ตรวจพบปัญหา DSL {count} รายการ ตัวแก้ไขแบบภาพจึงโหลดสถานะเวิร์กโฟลว์สำรองที่ปลอดภัย',
            builderCardTitle: 'เวิร์กโฟลว์ {index}',
            deleteButton: 'ลบ',
            workflowRemovedNotice: 'ลบเวิร์กโฟลว์แล้ว',
            buttonNameLabel: 'ชื่อปุ่ม',
            buttonNamePlaceholder: 'เวิร์กโฟลว์ {index}',
            actionSequenceTitle: 'ลำดับแอ็กชัน',
            removeAction: 'นำออก',
            addAction: 'เพิ่มแอ็กชัน',
            addWorkflow: 'เพิ่มเวิร์กโฟลว์',
            workflowAddedNotice: 'เพิ่มเวิร์กโฟลว์แล้ว',
            resetDefault: 'รีเซ็ตเป็นค่าเริ่มต้น',
            resetDefaultNotice: 'กู้คืนเวิร์กโฟลว์แบบคลิกเดียวเริ่มต้นแล้ว'
        },
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
        workflowBuilder: {
            heading: 'Tek tıklamalı iş akışı düğmeleri',
            errorStrategyName: 'İş akışı hata stratejisi',
            errorStrategyDesc: 'İlk başarısız adımda hemen durun veya devam edip kalan adımları tamamlayın.',
            errorStrategyStop: 'İlk hatada dur',
            errorStrategyContinue: 'Hata durumunda devam et',
            visualBuilderName: 'Görsel iş akışı oluşturucu',
            visualBuilderDesc: 'DSL yazmadan yerleşik eylemlerden özel iş akışı düğmeleri oluşturun.',
            advancedDslName: 'Gelişmiş DSL düzenleyici',
            advancedDslDesc: 'İsteğe bağlı: Button Name::action-a>action-b biçiminde doğrudan düzenleyin. Görsel düzenleyici ile DSL senkronize kalır.',
            dslValidationName: 'İş akışı DSL doğrulaması',
            dslValidationDesc: '{count} sorun bulundu. Geçersiz satırlar kenar çubuğu oluşturulurken yok sayılır.',
            availableActionIdsName: 'Kullanılabilir iş akışı eylem kimlikleri',
            builderDslWarning: '{count} DSL sorunu algılandı. Görsel düzenleyici güvenli yedek iş akışı durumunu yükledi.',
            builderCardTitle: 'İş akışı {index}',
            deleteButton: 'Sil',
            workflowRemovedNotice: 'İş akışı kaldırıldı.',
            buttonNameLabel: 'Düğme adı',
            buttonNamePlaceholder: 'İş akışı {index}',
            actionSequenceTitle: 'Eylem sırası',
            removeAction: 'Kaldır',
            addAction: 'Eylem ekle',
            addWorkflow: 'İş akışı ekle',
            workflowAddedNotice: 'İş akışı eklendi.',
            resetDefault: 'Varsayılana sıfırla',
            resetDefaultNotice: 'Varsayılan tek tıklamalı iş akışları geri yüklendi.'
        },
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
        workflowBuilder: {
            heading: 'Кнопки workflow в один клік',
            errorStrategyName: 'Стратегія помилок робочого процесу',
            errorStrategyDesc: 'Негайно зупинятися на першому невдалому кроці або продовжувати й завершувати решту кроків.',
            errorStrategyStop: 'Зупинятися на першій помилці',
            errorStrategyContinue: 'Продовжувати при помилці',
            visualBuilderName: 'Візуальний конструктор робочого процесу',
            visualBuilderDesc: 'Створюйте власні кнопки workflow зі вбудованих дій без написання DSL.',
            advancedDslName: 'Розширений редактор DSL',
            advancedDslDesc: 'Необовʼязково: редагуйте напряму у форматі Button Name::action-a>action-b. Візуальний редактор і DSL залишаються синхронізованими.',
            dslValidationName: 'Перевірка DSL workflow',
            dslValidationDesc: 'Знайдено {count} проблем(и). Некоректні рядки ігноруються під час відображення бічної панелі.',
            availableActionIdsName: 'Доступні ідентифікатори дій workflow',
            builderDslWarning: 'Виявлено {count} проблем(и) DSL. Візуальний редактор завантажив безпечний резервний стан workflow.',
            builderCardTitle: 'Робочий процес {index}',
            deleteButton: 'Видалити',
            workflowRemovedNotice: 'Робочий процес видалено.',
            buttonNameLabel: 'Назва кнопки',
            buttonNamePlaceholder: 'Робочий процес {index}',
            actionSequenceTitle: 'Послідовність дій',
            removeAction: 'Видалити',
            addAction: 'Додати дію',
            addWorkflow: 'Додати робочий процес',
            workflowAddedNotice: 'Робочий процес додано.',
            resetDefault: 'Скинути до типових',
            resetDefaultNotice: 'Типові робочі процеси в один клік відновлено.'
        },
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
        workflowBuilder: {
            heading: 'Nút quy trình một chạm',
            errorStrategyName: 'Chiến lược lỗi của quy trình',
            errorStrategyDesc: 'Dừng ngay ở bước đầu tiên thất bại, hoặc tiếp tục và hoàn tất các bước còn lại.',
            errorStrategyStop: 'Dừng ở lỗi đầu tiên',
            errorStrategyContinue: 'Tiếp tục khi có lỗi',
            visualBuilderName: 'Trình tạo quy trình trực quan',
            visualBuilderDesc: 'Tạo nút quy trình tùy chỉnh từ các hành động tích hợp mà không cần viết DSL.',
            advancedDslName: 'Trình chỉnh sửa DSL nâng cao',
            advancedDslDesc: 'Tùy chọn: chỉnh sửa trực tiếp bằng định dạng Button Name::action-a>action-b. Trình chỉnh sửa trực quan và DSL luôn được đồng bộ.',
            dslValidationName: 'Xác thực DSL của quy trình',
            dslValidationDesc: 'Đã tìm thấy {count} vấn đề. Các dòng không hợp lệ sẽ bị bỏ qua khi hiển thị thanh bên.',
            availableActionIdsName: 'ID hành động quy trình khả dụng',
            builderDslWarning: 'Phát hiện {count} vấn đề DSL. Trình chỉnh sửa trực quan đã tải trạng thái quy trình dự phòng an toàn.',
            builderCardTitle: 'Quy trình {index}',
            deleteButton: 'Xóa',
            workflowRemovedNotice: 'Đã xóa quy trình.',
            buttonNameLabel: 'Tên nút',
            buttonNamePlaceholder: 'Quy trình {index}',
            actionSequenceTitle: 'Chuỗi hành động',
            removeAction: 'Xóa',
            addAction: 'Thêm hành động',
            addWorkflow: 'Thêm quy trình',
            workflowAddedNotice: 'Đã thêm quy trình.',
            resetDefault: 'Đặt lại mặc định',
            resetDefaultNotice: 'Đã khôi phục các quy trình một chạm mặc định.'
        },
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
    },
    errorModal: {
        titles: {
            generic: 'Error general'
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
