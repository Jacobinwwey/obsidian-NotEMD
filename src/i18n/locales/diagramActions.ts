import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const DIAGRAM_ACTION_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        commands: {
            generateExperimentalDiagram: 'إنشاء مخطط (تجريبي)',
            previewExperimentalDiagram: 'معاينة مخطط (تجريبي)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'إنشاء مخطط (تجريبي)',
                    tooltip: 'أنشئ واحفظ ناتج مخطط تجريبي للملاحظة الحالية.'
                },
                previewExperimentalDiagram: {
                    label: 'معاينة مخطط (تجريبي)',
                    tooltip: 'أنشئ معاينة لمخطط تجريبي دون حفظ الناتج.'
                }
            }
        }
    },
    de: {
        commands: {
            generateExperimentalDiagram: 'Diagramm generieren (experimentell)',
            previewExperimentalDiagram: 'Diagrammvorschau (experimentell)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Diagramm generieren (experimentell)',
                    tooltip: 'Erzeugt und speichert ein experimentelles Diagramm-Artefakt für die aktuelle Notiz.'
                },
                previewExperimentalDiagram: {
                    label: 'Diagrammvorschau (experimentell)',
                    tooltip: 'Erzeugt eine experimentelle Diagrammvorschau, ohne das Artefakt zu speichern.'
                }
            }
        }
    },
    es: {
        commands: {
            generateExperimentalDiagram: 'Generar diagrama (experimental)',
            previewExperimentalDiagram: 'Vista previa de diagrama (experimental)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Generar diagrama (experimental)',
                    tooltip: 'Genera y guarda un artefacto de diagrama experimental para la nota actual.'
                },
                previewExperimentalDiagram: {
                    label: 'Vista previa de diagrama (experimental)',
                    tooltip: 'Genera una vista previa de diagrama experimental sin guardar el artefacto.'
                }
            }
        }
    },
    fa: {
        commands: {
            generateExperimentalDiagram: 'ایجاد نمودار (آزمایشی)',
            previewExperimentalDiagram: 'پیش نمایش نمودار (آزمایشی)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'ایجاد نمودار (آزمایشی)',
                    tooltip: 'برای یادداشت فعلی یک خروجی نمودار آزمایشی تولید و ذخیره می‌کند.'
                },
                previewExperimentalDiagram: {
                    label: 'پیش نمایش نمودار (آزمایشی)',
                    tooltip: 'بدون ذخیره خروجی، پیش نمایش نمودار آزمایشی ایجاد می‌کند.'
                }
            }
        }
    },
    fr: {
        commands: {
            generateExperimentalDiagram: 'Generer un diagramme (experimental)',
            previewExperimentalDiagram: 'Apercu du diagramme (experimental)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Generer un diagramme (experimental)',
                    tooltip: 'Genere et enregistre un artefact de diagramme experimental pour la note actuelle.'
                },
                previewExperimentalDiagram: {
                    label: 'Apercu du diagramme (experimental)',
                    tooltip: 'Genere un apercu de diagramme experimental sans enregistrer l artefact.'
                }
            }
        }
    },
    id: {
        commands: {
            generateExperimentalDiagram: 'Buat diagram (eksperimental)',
            previewExperimentalDiagram: 'Pratinjau diagram (eksperimental)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Buat diagram (eksperimental)',
                    tooltip: 'Buat dan simpan artefak diagram eksperimental untuk catatan saat ini.'
                },
                previewExperimentalDiagram: {
                    label: 'Pratinjau diagram (eksperimental)',
                    tooltip: 'Buat pratinjau diagram eksperimental tanpa menyimpan artefaknya.'
                }
            }
        }
    },
    it: {
        commands: {
            generateExperimentalDiagram: 'Genera diagramma (sperimentale)',
            previewExperimentalDiagram: 'Anteprima diagramma (sperimentale)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Genera diagramma (sperimentale)',
                    tooltip: 'Genera e salva un artefatto di diagramma sperimentale per la nota corrente.'
                },
                previewExperimentalDiagram: {
                    label: 'Anteprima diagramma (sperimentale)',
                    tooltip: 'Genera un anteprima del diagramma sperimentale senza salvare l artefatto.'
                }
            }
        }
    },
    ja: {
        commands: {
            generateExperimentalDiagram: '図を生成（実験的）',
            previewExperimentalDiagram: '図をプレビュー（実験的）'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: '図を生成（実験的）',
                    tooltip: '現在のノートに対して実験的な図の生成物を作成して保存します。'
                },
                previewExperimentalDiagram: {
                    label: '図をプレビュー（実験的）',
                    tooltip: '生成物を保存せずに実験的な図のプレビューを生成します。'
                }
            }
        }
    },
    ko: {
        commands: {
            generateExperimentalDiagram: '다이어그램 생성(실험적)',
            previewExperimentalDiagram: '다이어그램 미리보기(실험적)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: '다이어그램 생성(실험적)',
                    tooltip: '현재 노트에 대한 실험적 다이어그램 산출물을 생성하고 저장합니다.'
                },
                previewExperimentalDiagram: {
                    label: '다이어그램 미리보기(실험적)',
                    tooltip: '산출물을 저장하지 않고 실험적 다이어그램 미리보기를 생성합니다.'
                }
            }
        }
    },
    nl: {
        commands: {
            generateExperimentalDiagram: 'Diagram genereren (experimenteel)',
            previewExperimentalDiagram: 'Diagramvoorbeeld (experimenteel)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Diagram genereren (experimenteel)',
                    tooltip: 'Genereer en sla een experimenteel diagramartefact op voor de huidige notitie.'
                },
                previewExperimentalDiagram: {
                    label: 'Diagramvoorbeeld (experimenteel)',
                    tooltip: 'Genereer een experimentele diagramweergave zonder het artefact op te slaan.'
                }
            }
        }
    },
    pl: {
        commands: {
            generateExperimentalDiagram: 'Generuj diagram (eksperymentalnie)',
            previewExperimentalDiagram: 'Podglad diagramu (eksperymentalnie)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Generuj diagram (eksperymentalnie)',
                    tooltip: 'Generuje i zapisuje eksperymentalny artefakt diagramu dla biezacej notatki.'
                },
                previewExperimentalDiagram: {
                    label: 'Podglad diagramu (eksperymentalnie)',
                    tooltip: 'Generuje podglad eksperymentalnego diagramu bez zapisywania artefaktu.'
                }
            }
        }
    },
    pt: {
        commands: {
            generateExperimentalDiagram: 'Gerar diagrama (experimental)',
            previewExperimentalDiagram: 'Pre-visualizar diagrama (experimental)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Gerar diagrama (experimental)',
                    tooltip: 'Gera e salva um artefato de diagrama experimental para a nota atual.'
                },
                previewExperimentalDiagram: {
                    label: 'Pre-visualizar diagrama (experimental)',
                    tooltip: 'Gera uma pre-visualizacao de diagrama experimental sem salvar o artefato.'
                }
            }
        }
    },
    'pt-BR': {
        commands: {
            generateExperimentalDiagram: 'Gerar diagrama (experimental)',
            previewExperimentalDiagram: 'Pre-visualizar diagrama (experimental)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Gerar diagrama (experimental)',
                    tooltip: 'Gera e salva um artefato de diagrama experimental para a nota atual.'
                },
                previewExperimentalDiagram: {
                    label: 'Pre-visualizar diagrama (experimental)',
                    tooltip: 'Gera uma pre-visualizacao de diagrama experimental sem salvar o artefato.'
                }
            }
        }
    },
    ru: {
        commands: {
            generateExperimentalDiagram: 'Создать диаграмму (экспериментально)',
            previewExperimentalDiagram: 'Предпросмотр диаграммы (экспериментально)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Создать диаграмму (экспериментально)',
                    tooltip: 'Создает и сохраняет экспериментальный артефакт диаграммы для текущей заметки.'
                },
                previewExperimentalDiagram: {
                    label: 'Предпросмотр диаграммы (экспериментально)',
                    tooltip: 'Создает предпросмотр экспериментальной диаграммы без сохранения артефакта.'
                }
            }
        }
    },
    th: {
        commands: {
            generateExperimentalDiagram: 'สร้างไดอะแกรม (ทดลอง)',
            previewExperimentalDiagram: 'ดูตัวอย่างไดอะแกรม (ทดลอง)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'สร้างไดอะแกรม (ทดลอง)',
                    tooltip: 'สร้างและบันทึกผลลัพธ์ไดอะแกรมแบบทดลองสำหรับโน้ตปัจจุบัน'
                },
                previewExperimentalDiagram: {
                    label: 'ดูตัวอย่างไดอะแกรม (ทดลอง)',
                    tooltip: 'สร้างตัวอย่างไดอะแกรมแบบทดลองโดยไม่บันทึกไฟล์ผลลัพธ์'
                }
            }
        }
    },
    tr: {
        commands: {
            generateExperimentalDiagram: 'Diyagram olustur (deneysel)',
            previewExperimentalDiagram: 'Diyagram onizle (deneysel)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Diyagram olustur (deneysel)',
                    tooltip: 'Gecerli not icin deneysel bir diyagram ciktisi olusturur ve kaydeder.'
                },
                previewExperimentalDiagram: {
                    label: 'Diyagram onizle (deneysel)',
                    tooltip: 'Ciktiyi kaydetmeden deneysel bir diyagram onizlemesi olusturur.'
                }
            }
        }
    },
    uk: {
        commands: {
            generateExperimentalDiagram: 'Створити діаграму (експериментально)',
            previewExperimentalDiagram: 'Попередній перегляд діаграми (експериментально)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Створити діаграму (експериментально)',
                    tooltip: 'Створює та зберігає експериментальний артефакт діаграми для поточної нотатки.'
                },
                previewExperimentalDiagram: {
                    label: 'Попередній перегляд діаграми (експериментально)',
                    tooltip: 'Створює попередній перегляд експериментальної діаграми без збереження артефакту.'
                }
            }
        }
    },
    vi: {
        commands: {
            generateExperimentalDiagram: 'Tao so do (thu nghiem)',
            previewExperimentalDiagram: 'Xem truoc so do (thu nghiem)'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Tao so do (thu nghiem)',
                    tooltip: 'Tao va luu san pham so do thu nghiem cho ghi chu hien tai.'
                },
                previewExperimentalDiagram: {
                    label: 'Xem truoc so do (thu nghiem)',
                    tooltip: 'Tao ban xem truoc so do thu nghiem ma khong luu san pham.'
                }
            }
        }
    }
};
