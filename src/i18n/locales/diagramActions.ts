import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const DIAGRAM_ACTION_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        commands: {
            generateExperimentalDiagram: 'إنشاء مخطط',
            previewExperimentalDiagram: 'معاينة مخطط'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'إنشاء مخطط',
                    tooltip: 'أنشئ واحفظ ناتج مخطط للملاحظة الحالية.'
                },
                previewExperimentalDiagram: {
                    label: 'معاينة مخطط',
                    tooltip: 'أنشئ معاينة لمخطط دون حفظ الناتج.'
                }
            }
        }
    },
    de: {
        commands: {
            generateExperimentalDiagram: 'Diagramm generieren',
            previewExperimentalDiagram: 'Diagrammvorschau'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Diagramm generieren',
                    tooltip: 'Erzeugt und speichert ein Diagramm-Artefakt für die aktuelle Notiz.'
                },
                previewExperimentalDiagram: {
                    label: 'Diagrammvorschau',
                    tooltip: 'Erzeugt eine Diagrammvorschau, ohne das Artefakt zu speichern.'
                }
            }
        }
    },
    es: {
        commands: {
            generateExperimentalDiagram: 'Generar diagrama',
            previewExperimentalDiagram: 'Vista previa de diagrama'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Generar diagrama',
                    tooltip: 'Genera y guarda un artefacto de diagrama para la nota actual.'
                },
                previewExperimentalDiagram: {
                    label: 'Vista previa de diagrama',
                    tooltip: 'Genera una vista previa de diagrama sin guardar el artefacto.'
                }
            }
        }
    },
    fa: {
        commands: {
            generateExperimentalDiagram: 'ایجاد نمودار',
            previewExperimentalDiagram: 'پیش نمایش نمودار'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'ایجاد نمودار',
                    tooltip: 'برای یادداشت فعلی یک خروجی نمودار تولید و ذخیره می‌کند.'
                },
                previewExperimentalDiagram: {
                    label: 'پیش نمایش نمودار',
                    tooltip: 'بدون ذخیره خروجی، پیش نمایش نمودار ایجاد می‌کند.'
                }
            }
        }
    },
    fr: {
        commands: {
            generateExperimentalDiagram: 'Generer un diagramme',
            previewExperimentalDiagram: 'Apercu du diagramme'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Generer un diagramme',
                    tooltip: 'Genere et enregistre un artefact de diagramme pour la note actuelle.'
                },
                previewExperimentalDiagram: {
                    label: 'Apercu du diagramme',
                    tooltip: 'Genere un apercu de diagramme sans enregistrer l artefact.'
                }
            }
        }
    },
    id: {
        commands: {
            generateExperimentalDiagram: 'Buat diagram',
            previewExperimentalDiagram: 'Pratinjau diagram'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Buat diagram',
                    tooltip: 'Buat dan simpan artefak diagram untuk catatan saat ini.'
                },
                previewExperimentalDiagram: {
                    label: 'Pratinjau diagram',
                    tooltip: 'Buat pratinjau diagram tanpa menyimpan artefaknya.'
                }
            }
        }
    },
    it: {
        commands: {
            generateExperimentalDiagram: 'Genera diagramma',
            previewExperimentalDiagram: 'Anteprima diagramma'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Genera diagramma',
                    tooltip: 'Genera e salva un artefatto di diagramma per la nota corrente.'
                },
                previewExperimentalDiagram: {
                    label: 'Anteprima diagramma',
                    tooltip: 'Genera un anteprima del diagramma senza salvare l artefatto.'
                }
            }
        }
    },
    ja: {
        commands: {
            generateExperimentalDiagram: '図を生成',
            previewExperimentalDiagram: '図をプレビュー'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: '図を生成',
                    tooltip: '現在のノートに対して図の生成物を作成して保存します。'
                },
                previewExperimentalDiagram: {
                    label: '図をプレビュー',
                    tooltip: '生成物を保存せずに図のプレビューを生成します。'
                }
            }
        }
    },
    ko: {
        commands: {
            generateExperimentalDiagram: '다이어그램 생성',
            previewExperimentalDiagram: '다이어그램 미리보기'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: '다이어그램 생성',
                    tooltip: '현재 노트에 대한 다이어그램 산출물을 생성하고 저장합니다.'
                },
                previewExperimentalDiagram: {
                    label: '다이어그램 미리보기',
                    tooltip: '산출물을 저장하지 않고 다이어그램 미리보기를 생성합니다.'
                }
            }
        }
    },
    nl: {
        commands: {
            generateExperimentalDiagram: 'Diagram genereren',
            previewExperimentalDiagram: 'Diagramvoorbeeld'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Diagram genereren',
                    tooltip: 'Genereer en sla een diagramartefact op voor de huidige notitie.'
                },
                previewExperimentalDiagram: {
                    label: 'Diagramvoorbeeld',
                    tooltip: 'Genereer een diagramweergave zonder het artefact op te slaan.'
                }
            }
        }
    },
    pl: {
        commands: {
            generateExperimentalDiagram: 'Generuj diagram',
            previewExperimentalDiagram: 'Podglad diagramu'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Generuj diagram',
                    tooltip: 'Generuje i zapisuje artefakt diagramu dla biezacej notatki.'
                },
                previewExperimentalDiagram: {
                    label: 'Podglad diagramu',
                    tooltip: 'Generuje podglad diagramu bez zapisywania artefaktu.'
                }
            }
        }
    },
    pt: {
        commands: {
            generateExperimentalDiagram: 'Gerar diagrama',
            previewExperimentalDiagram: 'Pre-visualizar diagrama'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Gerar diagrama',
                    tooltip: 'Gera e salva um artefato de diagrama para a nota atual.'
                },
                previewExperimentalDiagram: {
                    label: 'Pre-visualizar diagrama',
                    tooltip: 'Gera uma pre-visualizacao de diagrama sem salvar o artefato.'
                }
            }
        }
    },
    'pt-BR': {
        commands: {
            generateExperimentalDiagram: 'Gerar diagrama',
            previewExperimentalDiagram: 'Pre-visualizar diagrama'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Gerar diagrama',
                    tooltip: 'Gera e salva um artefato de diagrama para a nota atual.'
                },
                previewExperimentalDiagram: {
                    label: 'Pre-visualizar diagrama',
                    tooltip: 'Gera uma pre-visualizacao de diagrama sem salvar o artefato.'
                }
            }
        }
    },
    ru: {
        commands: {
            generateExperimentalDiagram: 'Создать диаграмму',
            previewExperimentalDiagram: 'Предпросмотр диаграммы'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Создать диаграмму',
                    tooltip: 'Создает и сохраняет артефакт диаграммы для текущей заметки.'
                },
                previewExperimentalDiagram: {
                    label: 'Предпросмотр диаграммы',
                    tooltip: 'Создает предпросмотр диаграммы без сохранения артефакта.'
                }
            }
        }
    },
    th: {
        commands: {
            generateExperimentalDiagram: 'สร้างไดอะแกรม',
            previewExperimentalDiagram: 'ดูตัวอย่างไดอะแกรม'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'สร้างไดอะแกรม',
                    tooltip: 'สร้างและบันทึกผลลัพธ์ไดอะแกรมสำหรับโน้ตปัจจุบัน'
                },
                previewExperimentalDiagram: {
                    label: 'ดูตัวอย่างไดอะแกรม',
                    tooltip: 'สร้างตัวอย่างไดอะแกรมโดยไม่บันทึกไฟล์ผลลัพธ์'
                }
            }
        }
    },
    tr: {
        commands: {
            generateExperimentalDiagram: 'Diyagram olustur',
            previewExperimentalDiagram: 'Diyagram onizle'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Diyagram olustur',
                    tooltip: 'Gecerli not icin bir diyagram ciktisi olusturur ve kaydeder.'
                },
                previewExperimentalDiagram: {
                    label: 'Diyagram onizle',
                    tooltip: 'Ciktiyi kaydetmeden bir diyagram onizlemesi olusturur.'
                }
            }
        }
    },
    uk: {
        commands: {
            generateExperimentalDiagram: 'Створити діаграму',
            previewExperimentalDiagram: 'Попередній перегляд діаграми'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Створити діаграму',
                    tooltip: 'Створює та зберігає артефакт діаграми для поточної нотатки.'
                },
                previewExperimentalDiagram: {
                    label: 'Попередній перегляд діаграми',
                    tooltip: 'Створює попередній перегляд діаграми без збереження артефакту.'
                }
            }
        }
    },
    vi: {
        commands: {
            generateExperimentalDiagram: 'Tao so do',
            previewExperimentalDiagram: 'Xem truoc so do'
        },
        sidebar: {
            actions: {
                generateExperimentalDiagram: {
                    label: 'Tao so do',
                    tooltip: 'Tao va luu san pham so do cho ghi chu hien tai.'
                },
                previewExperimentalDiagram: {
                    label: 'Xem truoc so do',
                    tooltip: 'Tao ban xem truoc so do ma khong luu san pham.'
                }
            }
        }
    }
};
