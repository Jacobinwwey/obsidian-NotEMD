import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const CLI_EXPORT_ACTION_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        commands: {
            exportCliCapabilityManifest: 'تصدير بيان قدرات CLI',
            exportCliInvocationContract: 'تصدير عقد استدعاء CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'تم تصدير بيان قدرات CLI إلى {path}',
            cliInvocationContractExported: 'تم تصدير عقد استدعاء CLI إلى {path}'
        }
    },
    de: {
        commands: {
            exportCliCapabilityManifest: 'CLI-Fahigkeitsmanifest exportieren',
            exportCliInvocationContract: 'CLI-Aufrufvertrag exportieren'
        },
        notices: {
            cliCapabilityManifestExported: 'CLI-Fahigkeitsmanifest wurde nach {path} exportiert',
            cliInvocationContractExported: 'CLI-Aufrufvertrag wurde nach {path} exportiert'
        }
    },
    es: {
        commands: {
            exportCliCapabilityManifest: 'Exportar manifiesto de capacidades de CLI',
            exportCliInvocationContract: 'Exportar contrato de invocacion de CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'El manifiesto de capacidades de CLI se exporto a {path}',
            cliInvocationContractExported: 'El contrato de invocacion de CLI se exporto a {path}'
        }
    },
    fa: {
        commands: {
            exportCliCapabilityManifest: 'خروجی گرفتن از فهرست قابلیت های CLI',
            exportCliInvocationContract: 'خروجی گرفتن از قرارداد فراخوانی CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'فهرست قابلیت های CLI در {path} ذخیره شد',
            cliInvocationContractExported: 'قرارداد فراخوانی CLI در {path} ذخیره شد'
        }
    },
    fr: {
        commands: {
            exportCliCapabilityManifest: 'Exporter le manifeste de capacites CLI',
            exportCliInvocationContract: 'Exporter le contrat d invocation CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Le manifeste de capacites CLI a ete exporte vers {path}',
            cliInvocationContractExported: 'Le contrat d invocation CLI a ete exporte vers {path}'
        }
    },
    id: {
        commands: {
            exportCliCapabilityManifest: 'Ekspor manifes kapabilitas CLI',
            exportCliInvocationContract: 'Ekspor kontrak invokasi CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Manifes kapabilitas CLI diekspor ke {path}',
            cliInvocationContractExported: 'Kontrak invokasi CLI diekspor ke {path}'
        }
    },
    it: {
        commands: {
            exportCliCapabilityManifest: 'Esporta manifesto capacita CLI',
            exportCliInvocationContract: 'Esporta contratto di invocazione CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Manifesto capacita CLI esportato in {path}',
            cliInvocationContractExported: 'Contratto di invocazione CLI esportato in {path}'
        }
    },
    ja: {
        commands: {
            exportCliCapabilityManifest: 'CLI 機能マニフェストをエクスポート',
            exportCliInvocationContract: 'CLI 呼び出し契約をエクスポート'
        },
        notices: {
            cliCapabilityManifestExported: 'CLI 機能マニフェストを {path} にエクスポートしました',
            cliInvocationContractExported: 'CLI 呼び出し契約を {path} にエクスポートしました'
        }
    },
    ko: {
        commands: {
            exportCliCapabilityManifest: 'CLI 기능 매니페스트 내보내기',
            exportCliInvocationContract: 'CLI 호출 계약 내보내기'
        },
        notices: {
            cliCapabilityManifestExported: 'CLI 기능 매니페스트를 {path} 로 내보냈습니다',
            cliInvocationContractExported: 'CLI 호출 계약을 {path} 로 내보냈습니다'
        }
    },
    nl: {
        commands: {
            exportCliCapabilityManifest: 'CLI-capaciteitenmanifest exporteren',
            exportCliInvocationContract: 'CLI-aanroepcontract exporteren'
        },
        notices: {
            cliCapabilityManifestExported: 'CLI-capaciteitenmanifest is geexporteerd naar {path}',
            cliInvocationContractExported: 'CLI-aanroepcontract is geexporteerd naar {path}'
        }
    },
    pl: {
        commands: {
            exportCliCapabilityManifest: 'Eksportuj manifest mozliwosci CLI',
            exportCliInvocationContract: 'Eksportuj kontrakt wywolania CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Manifest mozliwosci CLI wyeksportowano do {path}',
            cliInvocationContractExported: 'Kontrakt wywolania CLI wyeksportowano do {path}'
        }
    },
    pt: {
        commands: {
            exportCliCapabilityManifest: 'Exportar manifesto de capacidades da CLI',
            exportCliInvocationContract: 'Exportar contrato de invocacao da CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Manifesto de capacidades da CLI exportado para {path}',
            cliInvocationContractExported: 'Contrato de invocacao da CLI exportado para {path}'
        }
    },
    'pt-BR': {
        commands: {
            exportCliCapabilityManifest: 'Exportar manifesto de capacidades da CLI',
            exportCliInvocationContract: 'Exportar contrato de invocacao da CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Manifesto de capacidades da CLI exportado para {path}',
            cliInvocationContractExported: 'Contrato de invocacao da CLI exportado para {path}'
        }
    },
    ru: {
        commands: {
            exportCliCapabilityManifest: 'Экспортировать манифест возможностей CLI',
            exportCliInvocationContract: 'Экспортировать контракт вызова CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Манифест возможностей CLI экспортирован в {path}',
            cliInvocationContractExported: 'Контракт вызова CLI экспортирован в {path}'
        }
    },
    th: {
        commands: {
            exportCliCapabilityManifest: 'ส่งออกรายการความสามารถ CLI',
            exportCliInvocationContract: 'ส่งออกสัญญาการเรียกใช้ CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'ส่งออกรายการความสามารถ CLI ไปที่ {path}',
            cliInvocationContractExported: 'ส่งออกสัญญาการเรียกใช้ CLI ไปที่ {path}'
        }
    },
    tr: {
        commands: {
            exportCliCapabilityManifest: 'CLI yetenek manifestini disa aktar',
            exportCliInvocationContract: 'CLI cagri sozlesmesini disa aktar'
        },
        notices: {
            cliCapabilityManifestExported: 'CLI yetenek manifesti {path} konumuna disa aktarıldı',
            cliInvocationContractExported: 'CLI cagri sozlesmesi {path} konumuna disa aktarıldı'
        }
    },
    uk: {
        commands: {
            exportCliCapabilityManifest: 'Експортувати маніфест можливостей CLI',
            exportCliInvocationContract: 'Експортувати контракт виклику CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Маніфест можливостей CLI експортовано до {path}',
            cliInvocationContractExported: 'Контракт виклику CLI експортовано до {path}'
        }
    },
    vi: {
        commands: {
            exportCliCapabilityManifest: 'Xuat ban ke kha nang CLI',
            exportCliInvocationContract: 'Xuat hop dong goi CLI'
        },
        notices: {
            cliCapabilityManifestExported: 'Da xuat ban ke kha nang CLI den {path}',
            cliInvocationContractExported: 'Da xuat hop dong goi CLI den {path}'
        }
    }
};
