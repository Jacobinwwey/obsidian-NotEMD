import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type LocaleStrings = DeepPartial<NotemdEnglishStrings>;

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
