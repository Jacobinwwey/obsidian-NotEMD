import { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const PREVIEW_MODAL_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        previewModal: {
            title: 'معاينة {target}',
            copySource: 'نسخ المصدر',
            exportSvg: 'تصدير SVG',
            exportingSvg: 'جارٍ التصدير…',
            copySuccessNotice: 'تم نسخ مصدر المخطط إلى الحافظة!',
            copyFailedNotice: 'فشل نسخ مصدر المخطط. راجع وحدة التحكم.',
            exportSuccessNotice: 'تم تصدير معاينة المخطط إلى {path}',
            exportFailedNotice: 'فشل تصدير معاينة المخطط: {message}',
            sourceFile: 'الملف المحفوظ: {path}'
        }
    },
    de: {
        previewModal: {
            title: '{target}-Vorschau',
            copySource: 'Quelle kopieren',
            exportSvg: 'SVG exportieren',
            exportingSvg: 'Exportiere…',
            copySuccessNotice: 'Diagrammquelle in die Zwischenablage kopiert!',
            copyFailedNotice: 'Diagrammquelle konnte nicht kopiert werden. Siehe Konsole.',
            exportSuccessNotice: 'Diagrammvorschau nach {path} exportiert',
            exportFailedNotice: 'Diagrammvorschau konnte nicht exportiert werden: {message}',
            sourceFile: 'Gespeicherte Datei: {path}'
        }
    },
    es: {
        previewModal: {
            title: 'Vista previa de {target}',
            copySource: 'Copiar fuente',
            exportSvg: 'Exportar SVG',
            exportingSvg: 'Exportando…',
            copySuccessNotice: '¡Código fuente del diagrama copiado al portapapeles!',
            copyFailedNotice: 'No se pudo copiar el código fuente del diagrama. Revisa la consola.',
            exportSuccessNotice: 'Vista previa del diagrama exportada a {path}',
            exportFailedNotice: 'No se pudo exportar la vista previa del diagrama: {message}',
            sourceFile: 'Archivo guardado: {path}'
        }
    },
    fa: {
        previewModal: {
            title: 'پیش‌نمایش {target}',
            copySource: 'کپی منبع',
            exportSvg: 'خروجی SVG',
            exportingSvg: 'در حال خروجی گرفتن…',
            copySuccessNotice: 'منبع نمودار در کلیپ‌بورد کپی شد!',
            copyFailedNotice: 'کپی منبع نمودار ناموفق بود. کنسول را بررسی کنید.',
            exportSuccessNotice: 'پیش‌نمایش نمودار به {path} صادر شد',
            exportFailedNotice: 'صدور پیش‌نمایش نمودار ناموفق بود: {message}',
            sourceFile: 'فایل ذخیره‌شده: {path}'
        }
    },
    fr: {
        previewModal: {
            title: 'Aperçu {target}',
            copySource: 'Copier la source',
            exportSvg: 'Exporter en SVG',
            exportingSvg: 'Export en cours…',
            copySuccessNotice: 'Source du diagramme copiée dans le presse-papiers !',
            copyFailedNotice: 'Impossible de copier la source du diagramme. Voir la console.',
            exportSuccessNotice: 'Aperçu du diagramme exporté vers {path}',
            exportFailedNotice: 'Impossible d’exporter l’aperçu du diagramme : {message}',
            sourceFile: 'Fichier enregistré : {path}'
        }
    },
    id: {
        previewModal: {
            title: 'Pratinjau {target}',
            copySource: 'Salin sumber',
            exportSvg: 'Ekspor SVG',
            exportingSvg: 'Mengekspor…',
            copySuccessNotice: 'Sumber diagram disalin ke clipboard!',
            copyFailedNotice: 'Gagal menyalin sumber diagram. Lihat konsol.',
            exportSuccessNotice: 'Pratinjau diagram diekspor ke {path}',
            exportFailedNotice: 'Gagal mengekspor pratinjau diagram: {message}',
            sourceFile: 'File tersimpan: {path}'
        }
    },
    it: {
        previewModal: {
            title: 'Anteprima {target}',
            copySource: 'Copia sorgente',
            exportSvg: 'Esporta SVG',
            exportingSvg: 'Esportazione…',
            copySuccessNotice: 'Sorgente del diagramma copiata negli appunti!',
            copyFailedNotice: 'Impossibile copiare la sorgente del diagramma. Vedi console.',
            exportSuccessNotice: 'Anteprima del diagramma esportata in {path}',
            exportFailedNotice: 'Impossibile esportare l’anteprima del diagramma: {message}',
            sourceFile: 'File salvato: {path}'
        }
    },
    ja: {
        previewModal: {
            title: '{target} プレビュー',
            copySource: 'ソースをコピー',
            exportSvg: 'SVG を書き出す',
            exportingSvg: '書き出し中…',
            copySuccessNotice: '図のソースをクリップボードにコピーしました。',
            copyFailedNotice: '図のソースをコピーできませんでした。コンソールを確認してください。',
            exportSuccessNotice: '図のプレビューを {path} に書き出しました',
            exportFailedNotice: '図のプレビューを書き出せませんでした: {message}',
            sourceFile: '保存先ファイル: {path}'
        }
    },
    ko: {
        previewModal: {
            title: '{target} 미리보기',
            copySource: '소스 복사',
            exportSvg: 'SVG 내보내기',
            exportingSvg: '내보내는 중…',
            copySuccessNotice: '다이어그램 소스를 클립보드에 복사했습니다!',
            copyFailedNotice: '다이어그램 소스를 복사하지 못했습니다. 콘솔을 확인하세요.',
            exportSuccessNotice: '다이어그램 미리보기를 {path}로 내보냈습니다',
            exportFailedNotice: '다이어그램 미리보기를 내보내지 못했습니다: {message}',
            sourceFile: '저장된 파일: {path}'
        }
    },
    nl: {
        previewModal: {
            title: '{target}-voorbeeld',
            copySource: 'Bron kopieren',
            exportSvg: 'SVG exporteren',
            exportingSvg: 'Bezig met exporteren…',
            copySuccessNotice: 'Diagrambron gekopieerd naar klembord!',
            copyFailedNotice: 'Diagrambron kon niet worden gekopieerd. Zie console.',
            exportSuccessNotice: 'Diagramvoorbeeld geëxporteerd naar {path}',
            exportFailedNotice: 'Diagramvoorbeeld kon niet worden geëxporteerd: {message}',
            sourceFile: 'Opgeslagen bestand: {path}'
        }
    },
    pl: {
        previewModal: {
            title: 'Podgląd {target}',
            copySource: 'Kopiuj źródło',
            exportSvg: 'Eksportuj SVG',
            exportingSvg: 'Eksportowanie…',
            copySuccessNotice: 'Źródło diagramu skopiowano do schowka!',
            copyFailedNotice: 'Nie udało się skopiować źródła diagramu. Zobacz konsolę.',
            exportSuccessNotice: 'Podgląd diagramu wyeksportowano do {path}',
            exportFailedNotice: 'Nie udało się wyeksportować podglądu diagramu: {message}',
            sourceFile: 'Zapisany plik: {path}'
        }
    },
    pt: {
        previewModal: {
            title: 'Pré-visualização de {target}',
            copySource: 'Copiar origem',
            exportSvg: 'Exportar SVG',
            exportingSvg: 'A exportar…',
            copySuccessNotice: 'Fonte do diagrama copiada para a área de transferência!',
            copyFailedNotice: 'Falha ao copiar a fonte do diagrama. Veja a consola.',
            exportSuccessNotice: 'Pré-visualização do diagrama exportada para {path}',
            exportFailedNotice: 'Falha ao exportar a pré-visualização do diagrama: {message}',
            sourceFile: 'Ficheiro guardado: {path}'
        }
    },
    'pt-BR': {
        previewModal: {
            title: 'Pré-visualização de {target}',
            copySource: 'Copiar fonte',
            exportSvg: 'Exportar SVG',
            exportingSvg: 'Exportando…',
            copySuccessNotice: 'Fonte do diagrama copiada para a área de transferência!',
            copyFailedNotice: 'Falha ao copiar a fonte do diagrama. Veja o console.',
            exportSuccessNotice: 'Pré-visualização do diagrama exportada para {path}',
            exportFailedNotice: 'Falha ao exportar a pré-visualização do diagrama: {message}',
            sourceFile: 'Arquivo salvo: {path}'
        }
    },
    ru: {
        previewModal: {
            title: 'Предпросмотр {target}',
            copySource: 'Копировать исходник',
            exportSvg: 'Экспортировать SVG',
            exportingSvg: 'Экспорт…',
            copySuccessNotice: 'Исходник диаграммы скопирован в буфер обмена!',
            copyFailedNotice: 'Не удалось скопировать исходник диаграммы. Смотрите консоль.',
            exportSuccessNotice: 'Предпросмотр диаграммы экспортирован в {path}',
            exportFailedNotice: 'Не удалось экспортировать предпросмотр диаграммы: {message}',
            sourceFile: 'Сохранённый файл: {path}'
        }
    },
    th: {
        previewModal: {
            title: 'ตัวอย่าง {target}',
            copySource: 'คัดลอกซอร์ส',
            exportSvg: 'ส่งออก SVG',
            exportingSvg: 'กำลังส่งออก…',
            copySuccessNotice: 'คัดลอกซอร์สไดอะแกรมไปยังคลิปบอร์ดแล้ว!',
            copyFailedNotice: 'คัดลอกซอร์สไดอะแกรมไม่สำเร็จ ดูคอนโซล',
            exportSuccessNotice: 'ส่งออกตัวอย่างไดอะแกรมไปยัง {path} แล้ว',
            exportFailedNotice: 'ส่งออกตัวอย่างไดอะแกรมไม่สำเร็จ: {message}',
            sourceFile: 'ไฟล์ที่บันทึก: {path}'
        }
    },
    tr: {
        previewModal: {
            title: '{target} önizlemesi',
            copySource: 'Kaynağı kopyala',
            exportSvg: 'SVG dışa aktar',
            exportingSvg: 'Dışa aktarılıyor…',
            copySuccessNotice: 'Diyagram kaynağı panoya kopyalandı!',
            copyFailedNotice: 'Diyagram kaynağı kopyalanamadı. Konsola bakın.',
            exportSuccessNotice: 'Diyagram önizlemesi {path} konumuna aktarıldı',
            exportFailedNotice: 'Diyagram önizlemesi dışa aktarılamadı: {message}',
            sourceFile: 'Kaydedilen dosya: {path}'
        }
    },
    uk: {
        previewModal: {
            title: 'Попередній перегляд {target}',
            copySource: 'Копіювати джерело',
            exportSvg: 'Експортувати SVG',
            exportingSvg: 'Експорт…',
            copySuccessNotice: 'Джерело діаграми скопійовано до буфера обміну!',
            copyFailedNotice: 'Не вдалося скопіювати джерело діаграми. Дивіться консоль.',
            exportSuccessNotice: 'Попередній перегляд діаграми експортовано до {path}',
            exportFailedNotice: 'Не вдалося експортувати попередній перегляд діаграми: {message}',
            sourceFile: 'Збережений файл: {path}'
        }
    },
    vi: {
        previewModal: {
            title: 'Xem trước {target}',
            copySource: 'Sao chép nguồn',
            exportSvg: 'Xuất SVG',
            exportingSvg: 'Đang xuất…',
            copySuccessNotice: 'Đã sao chép mã nguồn sơ đồ vào bộ nhớ tạm!',
            copyFailedNotice: 'Không thể sao chép mã nguồn sơ đồ. Xem bảng điều khiển.',
            exportSuccessNotice: 'Đã xuất bản xem trước sơ đồ tới {path}',
            exportFailedNotice: 'Không thể xuất bản xem trước sơ đồ: {message}',
            sourceFile: 'Tệp đã lưu: {path}'
        }
    },
    zh: {
        previewModal: {
            title: '{target} 预览',
            copySource: '复制源码',
            exportSvg: '导出 SVG',
            exportingSvg: '正在导出…',
            copySuccessNotice: '图形源码已复制到剪贴板！',
            copyFailedNotice: '复制图形源码失败，请查看控制台。',
            exportSuccessNotice: '图形预览已导出到 {path}',
            exportFailedNotice: '导出图形预览失败：{message}',
            sourceFile: '已保存文件：{path}'
        }
    },
    'zh-CN': {
        previewModal: {
            title: '{target} 预览',
            copySource: '复制源码',
            exportSvg: '导出 SVG',
            exportingSvg: '正在导出…',
            copySuccessNotice: '图形源码已复制到剪贴板！',
            copyFailedNotice: '复制图形源码失败，请查看控制台。',
            exportSuccessNotice: '图形预览已导出到 {path}',
            exportFailedNotice: '导出图形预览失败：{message}',
            sourceFile: '已保存文件：{path}'
        }
    },
    'zh-TW': {
        previewModal: {
            title: '{target} 預覽',
            copySource: '複製原始碼',
            exportSvg: '匯出 SVG',
            exportingSvg: '正在匯出…',
            copySuccessNotice: '圖形原始碼已複製到剪貼簿！',
            copyFailedNotice: '複製圖形原始碼失敗，請查看主控台。',
            exportSuccessNotice: '圖形預覽已匯出到 {path}',
            exportFailedNotice: '匯出圖形預覽失敗：{message}',
            sourceFile: '已儲存檔案：{path}'
        }
    }
};
