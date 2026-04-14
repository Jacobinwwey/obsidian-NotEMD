import { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const PREVIEW_MODAL_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        previewModal: {
            title: 'معاينة {target}',
            copySource: 'نسخ المصدر',
            saveSource: 'حفظ ملف المصدر',
            savingSource: 'جارٍ الحفظ…',
            exportSvg: 'تصدير SVG',
            exportingSvg: 'جارٍ التصدير…',
            copySuccessNotice: 'تم نسخ مصدر المخطط إلى الحافظة!',
            copyFailedNotice: 'فشل نسخ مصدر المخطط. راجع وحدة التحكم.',
            saveSourceSuccessNotice: 'تم حفظ مصدر المخطط في {path}',
            saveSourceFailedNotice: 'فشل حفظ مصدر المخطط: {message}',
            exportSuccessNotice: 'تم تصدير معاينة المخطط إلى {path}',
            exportFailedNotice: 'فشل تصدير معاينة المخطط: {message}',
            sourceFile: 'الملف المحفوظ: {path}'
        }
    },
    de: {
        previewModal: {
            title: '{target}-Vorschau',
            copySource: 'Quelle kopieren',
            saveSource: 'Quelldatei speichern',
            savingSource: 'Speichere…',
            exportSvg: 'SVG exportieren',
            exportingSvg: 'Exportiere…',
            copySuccessNotice: 'Diagrammquelle in die Zwischenablage kopiert!',
            copyFailedNotice: 'Diagrammquelle konnte nicht kopiert werden. Siehe Konsole.',
            saveSourceSuccessNotice: 'Diagrammquelle nach {path} gespeichert',
            saveSourceFailedNotice: 'Diagrammquelle konnte nicht gespeichert werden: {message}',
            exportSuccessNotice: 'Diagrammvorschau nach {path} exportiert',
            exportFailedNotice: 'Diagrammvorschau konnte nicht exportiert werden: {message}',
            sourceFile: 'Gespeicherte Datei: {path}'
        }
    },
    es: {
        previewModal: {
            title: 'Vista previa de {target}',
            copySource: 'Copiar fuente',
            saveSource: 'Guardar archivo fuente',
            savingSource: 'Guardando…',
            exportSvg: 'Exportar SVG',
            exportingSvg: 'Exportando…',
            copySuccessNotice: '¡Código fuente del diagrama copiado al portapapeles!',
            copyFailedNotice: 'No se pudo copiar el código fuente del diagrama. Revisa la consola.',
            saveSourceSuccessNotice: 'Código fuente del diagrama guardado en {path}',
            saveSourceFailedNotice: 'No se pudo guardar el código fuente del diagrama: {message}',
            exportSuccessNotice: 'Vista previa del diagrama exportada a {path}',
            exportFailedNotice: 'No se pudo exportar la vista previa del diagrama: {message}',
            sourceFile: 'Archivo guardado: {path}'
        }
    },
    fa: {
        previewModal: {
            title: 'پیش‌نمایش {target}',
            copySource: 'کپی منبع',
            saveSource: 'ذخیره فایل منبع',
            savingSource: 'در حال ذخیره…',
            exportSvg: 'خروجی SVG',
            exportingSvg: 'در حال خروجی گرفتن…',
            copySuccessNotice: 'منبع نمودار در کلیپ‌بورد کپی شد!',
            copyFailedNotice: 'کپی منبع نمودار ناموفق بود. کنسول را بررسی کنید.',
            saveSourceSuccessNotice: 'منبع نمودار در {path} ذخیره شد',
            saveSourceFailedNotice: 'ذخیره منبع نمودار ناموفق بود: {message}',
            exportSuccessNotice: 'پیش‌نمایش نمودار به {path} صادر شد',
            exportFailedNotice: 'صدور پیش‌نمایش نمودار ناموفق بود: {message}',
            sourceFile: 'فایل ذخیره‌شده: {path}'
        }
    },
    fr: {
        previewModal: {
            title: 'Aperçu {target}',
            copySource: 'Copier la source',
            saveSource: 'Enregistrer le fichier source',
            savingSource: 'Enregistrement…',
            exportSvg: 'Exporter en SVG',
            exportingSvg: 'Export en cours…',
            copySuccessNotice: 'Source du diagramme copiée dans le presse-papiers !',
            copyFailedNotice: 'Impossible de copier la source du diagramme. Voir la console.',
            saveSourceSuccessNotice: 'Source du diagramme enregistrée dans {path}',
            saveSourceFailedNotice: 'Impossible d’enregistrer la source du diagramme : {message}',
            exportSuccessNotice: 'Aperçu du diagramme exporté vers {path}',
            exportFailedNotice: 'Impossible d’exporter l’aperçu du diagramme : {message}',
            sourceFile: 'Fichier enregistré : {path}'
        }
    },
    id: {
        previewModal: {
            title: 'Pratinjau {target}',
            copySource: 'Salin sumber',
            saveSource: 'Simpan file sumber',
            savingSource: 'Menyimpan…',
            exportSvg: 'Ekspor SVG',
            exportingSvg: 'Mengekspor…',
            copySuccessNotice: 'Sumber diagram disalin ke clipboard!',
            copyFailedNotice: 'Gagal menyalin sumber diagram. Lihat konsol.',
            saveSourceSuccessNotice: 'Sumber diagram disimpan ke {path}',
            saveSourceFailedNotice: 'Gagal menyimpan sumber diagram: {message}',
            exportSuccessNotice: 'Pratinjau diagram diekspor ke {path}',
            exportFailedNotice: 'Gagal mengekspor pratinjau diagram: {message}',
            sourceFile: 'File tersimpan: {path}'
        }
    },
    it: {
        previewModal: {
            title: 'Anteprima {target}',
            copySource: 'Copia sorgente',
            saveSource: 'Salva file sorgente',
            savingSource: 'Salvataggio…',
            exportSvg: 'Esporta SVG',
            exportingSvg: 'Esportazione…',
            copySuccessNotice: 'Sorgente del diagramma copiata negli appunti!',
            copyFailedNotice: 'Impossibile copiare la sorgente del diagramma. Vedi console.',
            saveSourceSuccessNotice: 'Sorgente del diagramma salvata in {path}',
            saveSourceFailedNotice: 'Impossibile salvare la sorgente del diagramma: {message}',
            exportSuccessNotice: 'Anteprima del diagramma esportata in {path}',
            exportFailedNotice: 'Impossibile esportare l’anteprima del diagramma: {message}',
            sourceFile: 'File salvato: {path}'
        }
    },
    ja: {
        previewModal: {
            title: '{target} プレビュー',
            copySource: 'ソースをコピー',
            saveSource: 'ソースファイルを保存',
            savingSource: '保存中…',
            exportSvg: 'SVG を書き出す',
            exportingSvg: '書き出し中…',
            copySuccessNotice: '図のソースをクリップボードにコピーしました。',
            copyFailedNotice: '図のソースをコピーできませんでした。コンソールを確認してください。',
            saveSourceSuccessNotice: '図のソースを {path} に保存しました',
            saveSourceFailedNotice: '図のソースを保存できませんでした: {message}',
            exportSuccessNotice: '図のプレビューを {path} に書き出しました',
            exportFailedNotice: '図のプレビューを書き出せませんでした: {message}',
            sourceFile: '保存先ファイル: {path}'
        }
    },
    ko: {
        previewModal: {
            title: '{target} 미리보기',
            copySource: '소스 복사',
            saveSource: '소스 파일 저장',
            savingSource: '저장 중…',
            exportSvg: 'SVG 내보내기',
            exportingSvg: '내보내는 중…',
            copySuccessNotice: '다이어그램 소스를 클립보드에 복사했습니다!',
            copyFailedNotice: '다이어그램 소스를 복사하지 못했습니다. 콘솔을 확인하세요.',
            saveSourceSuccessNotice: '다이어그램 소스를 {path}에 저장했습니다',
            saveSourceFailedNotice: '다이어그램 소스를 저장하지 못했습니다: {message}',
            exportSuccessNotice: '다이어그램 미리보기를 {path}로 내보냈습니다',
            exportFailedNotice: '다이어그램 미리보기를 내보내지 못했습니다: {message}',
            sourceFile: '저장된 파일: {path}'
        }
    },
    nl: {
        previewModal: {
            title: '{target}-voorbeeld',
            copySource: 'Bron kopieren',
            saveSource: 'Bronbestand opslaan',
            savingSource: 'Opslaan…',
            exportSvg: 'SVG exporteren',
            exportingSvg: 'Bezig met exporteren…',
            copySuccessNotice: 'Diagrambron gekopieerd naar klembord!',
            copyFailedNotice: 'Diagrambron kon niet worden gekopieerd. Zie console.',
            saveSourceSuccessNotice: 'Diagrambron opgeslagen naar {path}',
            saveSourceFailedNotice: 'Diagrambron kon niet worden opgeslagen: {message}',
            exportSuccessNotice: 'Diagramvoorbeeld geëxporteerd naar {path}',
            exportFailedNotice: 'Diagramvoorbeeld kon niet worden geëxporteerd: {message}',
            sourceFile: 'Opgeslagen bestand: {path}'
        }
    },
    pl: {
        previewModal: {
            title: 'Podgląd {target}',
            copySource: 'Kopiuj źródło',
            saveSource: 'Zapisz plik źródłowy',
            savingSource: 'Zapisywanie…',
            exportSvg: 'Eksportuj SVG',
            exportingSvg: 'Eksportowanie…',
            copySuccessNotice: 'Źródło diagramu skopiowano do schowka!',
            copyFailedNotice: 'Nie udało się skopiować źródła diagramu. Zobacz konsolę.',
            saveSourceSuccessNotice: 'Źródło diagramu zapisano do {path}',
            saveSourceFailedNotice: 'Nie udało się zapisać źródła diagramu: {message}',
            exportSuccessNotice: 'Podgląd diagramu wyeksportowano do {path}',
            exportFailedNotice: 'Nie udało się wyeksportować podglądu diagramu: {message}',
            sourceFile: 'Zapisany plik: {path}'
        }
    },
    pt: {
        previewModal: {
            title: 'Pré-visualização de {target}',
            copySource: 'Copiar origem',
            saveSource: 'Guardar ficheiro fonte',
            savingSource: 'A guardar…',
            exportSvg: 'Exportar SVG',
            exportingSvg: 'A exportar…',
            copySuccessNotice: 'Fonte do diagrama copiada para a área de transferência!',
            copyFailedNotice: 'Falha ao copiar a fonte do diagrama. Veja a consola.',
            saveSourceSuccessNotice: 'Fonte do diagrama guardada em {path}',
            saveSourceFailedNotice: 'Falha ao guardar a fonte do diagrama: {message}',
            exportSuccessNotice: 'Pré-visualização do diagrama exportada para {path}',
            exportFailedNotice: 'Falha ao exportar a pré-visualização do diagrama: {message}',
            sourceFile: 'Ficheiro guardado: {path}'
        }
    },
    'pt-BR': {
        previewModal: {
            title: 'Pré-visualização de {target}',
            copySource: 'Copiar fonte',
            saveSource: 'Salvar arquivo-fonte',
            savingSource: 'Salvando…',
            exportSvg: 'Exportar SVG',
            exportingSvg: 'Exportando…',
            copySuccessNotice: 'Fonte do diagrama copiada para a área de transferência!',
            copyFailedNotice: 'Falha ao copiar a fonte do diagrama. Veja o console.',
            saveSourceSuccessNotice: 'Fonte do diagrama salva em {path}',
            saveSourceFailedNotice: 'Falha ao salvar a fonte do diagrama: {message}',
            exportSuccessNotice: 'Pré-visualização do diagrama exportada para {path}',
            exportFailedNotice: 'Falha ao exportar a pré-visualização do diagrama: {message}',
            sourceFile: 'Arquivo salvo: {path}'
        }
    },
    ru: {
        previewModal: {
            title: 'Предпросмотр {target}',
            copySource: 'Копировать исходник',
            saveSource: 'Сохранить исходный файл',
            savingSource: 'Сохранение…',
            exportSvg: 'Экспортировать SVG',
            exportingSvg: 'Экспорт…',
            copySuccessNotice: 'Исходник диаграммы скопирован в буфер обмена!',
            copyFailedNotice: 'Не удалось скопировать исходник диаграммы. Смотрите консоль.',
            saveSourceSuccessNotice: 'Исходник диаграммы сохранён в {path}',
            saveSourceFailedNotice: 'Не удалось сохранить исходник диаграммы: {message}',
            exportSuccessNotice: 'Предпросмотр диаграммы экспортирован в {path}',
            exportFailedNotice: 'Не удалось экспортировать предпросмотр диаграммы: {message}',
            sourceFile: 'Сохранённый файл: {path}'
        }
    },
    th: {
        previewModal: {
            title: 'ตัวอย่าง {target}',
            copySource: 'คัดลอกซอร์ส',
            saveSource: 'บันทึกไฟล์ต้นฉบับ',
            savingSource: 'กำลังบันทึก…',
            exportSvg: 'ส่งออก SVG',
            exportingSvg: 'กำลังส่งออก…',
            copySuccessNotice: 'คัดลอกซอร์สไดอะแกรมไปยังคลิปบอร์ดแล้ว!',
            copyFailedNotice: 'คัดลอกซอร์สไดอะแกรมไม่สำเร็จ ดูคอนโซล',
            saveSourceSuccessNotice: 'บันทึกซอร์สไดอะแกรมไปยัง {path} แล้ว',
            saveSourceFailedNotice: 'บันทึกซอร์สไดอะแกรมไม่สำเร็จ: {message}',
            exportSuccessNotice: 'ส่งออกตัวอย่างไดอะแกรมไปยัง {path} แล้ว',
            exportFailedNotice: 'ส่งออกตัวอย่างไดอะแกรมไม่สำเร็จ: {message}',
            sourceFile: 'ไฟล์ที่บันทึก: {path}'
        }
    },
    tr: {
        previewModal: {
            title: '{target} önizlemesi',
            copySource: 'Kaynağı kopyala',
            saveSource: 'Kaynak dosyayı kaydet',
            savingSource: 'Kaydediliyor…',
            exportSvg: 'SVG dışa aktar',
            exportingSvg: 'Dışa aktarılıyor…',
            copySuccessNotice: 'Diyagram kaynağı panoya kopyalandı!',
            copyFailedNotice: 'Diyagram kaynağı kopyalanamadı. Konsola bakın.',
            saveSourceSuccessNotice: 'Diyagram kaynağı {path} konumuna kaydedildi',
            saveSourceFailedNotice: 'Diyagram kaynağı kaydedilemedi: {message}',
            exportSuccessNotice: 'Diyagram önizlemesi {path} konumuna aktarıldı',
            exportFailedNotice: 'Diyagram önizlemesi dışa aktarılamadı: {message}',
            sourceFile: 'Kaydedilen dosya: {path}'
        }
    },
    uk: {
        previewModal: {
            title: 'Попередній перегляд {target}',
            copySource: 'Копіювати джерело',
            saveSource: 'Зберегти файл джерела',
            savingSource: 'Збереження…',
            exportSvg: 'Експортувати SVG',
            exportingSvg: 'Експорт…',
            copySuccessNotice: 'Джерело діаграми скопійовано до буфера обміну!',
            copyFailedNotice: 'Не вдалося скопіювати джерело діаграми. Дивіться консоль.',
            saveSourceSuccessNotice: 'Джерело діаграми збережено до {path}',
            saveSourceFailedNotice: 'Не вдалося зберегти джерело діаграми: {message}',
            exportSuccessNotice: 'Попередній перегляд діаграми експортовано до {path}',
            exportFailedNotice: 'Не вдалося експортувати попередній перегляд діаграми: {message}',
            sourceFile: 'Збережений файл: {path}'
        }
    },
    vi: {
        previewModal: {
            title: 'Xem trước {target}',
            copySource: 'Sao chép nguồn',
            saveSource: 'Lưu tệp nguồn',
            savingSource: 'Đang lưu…',
            exportSvg: 'Xuất SVG',
            exportingSvg: 'Đang xuất…',
            copySuccessNotice: 'Đã sao chép mã nguồn sơ đồ vào bộ nhớ tạm!',
            copyFailedNotice: 'Không thể sao chép mã nguồn sơ đồ. Xem bảng điều khiển.',
            saveSourceSuccessNotice: 'Đã lưu mã nguồn sơ đồ tới {path}',
            saveSourceFailedNotice: 'Không thể lưu mã nguồn sơ đồ: {message}',
            exportSuccessNotice: 'Đã xuất bản xem trước sơ đồ tới {path}',
            exportFailedNotice: 'Không thể xuất bản xem trước sơ đồ: {message}',
            sourceFile: 'Tệp đã lưu: {path}'
        }
    },
    zh: {
        previewModal: {
            title: '{target} 预览',
            copySource: '复制源码',
            saveSource: '保存源码文件',
            savingSource: '正在保存…',
            exportSvg: '导出 SVG',
            exportingSvg: '正在导出…',
            copySuccessNotice: '图形源码已复制到剪贴板！',
            copyFailedNotice: '复制图形源码失败，请查看控制台。',
            saveSourceSuccessNotice: '图形源码已保存到 {path}',
            saveSourceFailedNotice: '保存图形源码失败：{message}',
            exportSuccessNotice: '图形预览已导出到 {path}',
            exportFailedNotice: '导出图形预览失败：{message}',
            sourceFile: '已保存文件：{path}'
        }
    },
    'zh-CN': {
        previewModal: {
            title: '{target} 预览',
            copySource: '复制源码',
            saveSource: '保存源码文件',
            savingSource: '正在保存…',
            exportSvg: '导出 SVG',
            exportingSvg: '正在导出…',
            copySuccessNotice: '图形源码已复制到剪贴板！',
            copyFailedNotice: '复制图形源码失败，请查看控制台。',
            saveSourceSuccessNotice: '图形源码已保存到 {path}',
            saveSourceFailedNotice: '保存图形源码失败：{message}',
            exportSuccessNotice: '图形预览已导出到 {path}',
            exportFailedNotice: '导出图形预览失败：{message}',
            sourceFile: '已保存文件：{path}'
        }
    },
    'zh-TW': {
        previewModal: {
            title: '{target} 預覽',
            copySource: '複製原始碼',
            saveSource: '儲存原始碼檔案',
            savingSource: '正在儲存…',
            exportSvg: '匯出 SVG',
            exportingSvg: '正在匯出…',
            copySuccessNotice: '圖形原始碼已複製到剪貼簿！',
            copyFailedNotice: '複製圖形原始碼失敗，請查看主控台。',
            saveSourceSuccessNotice: '圖形原始碼已儲存到 {path}',
            saveSourceFailedNotice: '儲存圖形原始碼失敗：{message}',
            exportSuccessNotice: '圖形預覽已匯出到 {path}',
            exportFailedNotice: '匯出圖形預覽失敗：{message}',
            sourceFile: '已儲存檔案：{path}'
        }
    }
};
