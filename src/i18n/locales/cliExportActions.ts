import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const CLI_EXPORT_ACTION_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        commands: {
            exportProviderProfilesRedacted: 'تصدير ملفات تعريف المزود بعد التنقيح',
            exportCliCapabilityManifest: 'تصدير بيان قدرات CLI',
            exportCliInvocationContract: 'تصدير عقد استدعاء CLI',
            exportCliPublicSurface: 'تصدير واجهة CLI العامة'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'تم تصدير إعدادات المزود المنقحة إلى {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'تم تصدير بيان قدرات CLI إلى {path}',
            cliInvocationContractExported: 'تم تصدير عقد استدعاء CLI إلى {path}',
            cliPublicSurfaceExported: 'تم تصدير واجهة CLI العامة إلى {path}'
        }
    },
    de: {
        commands: {
            exportProviderProfilesRedacted: 'Bereinigte Anbieterprofile exportieren',
            exportCliCapabilityManifest: 'CLI-Fahigkeitsmanifest exportieren',
            exportCliInvocationContract: 'CLI-Aufrufvertrag exportieren',
            exportCliPublicSurface: 'Offentliche CLI-Oberflache exportieren'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Bereinigte Anbietereinstellungen wurden nach {path} exportiert'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'CLI-Fahigkeitsmanifest wurde nach {path} exportiert',
            cliInvocationContractExported: 'CLI-Aufrufvertrag wurde nach {path} exportiert',
            cliPublicSurfaceExported: 'Offentliche CLI-Oberflache wurde nach {path} exportiert'
        }
    },
    es: {
        commands: {
            exportProviderProfilesRedacted: 'Exportar perfiles de proveedor depurados',
            exportCliCapabilityManifest: 'Exportar manifiesto de capacidades de CLI',
            exportCliInvocationContract: 'Exportar contrato de invocacion de CLI',
            exportCliPublicSurface: 'Exportar superficie publica de CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'La configuracion depurada del proveedor se exporto a {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'El manifiesto de capacidades de CLI se exporto a {path}',
            cliInvocationContractExported: 'El contrato de invocacion de CLI se exporto a {path}',
            cliPublicSurfaceExported: 'La superficie publica de CLI se exporto a {path}'
        }
    },
    fa: {
        commands: {
            exportProviderProfilesRedacted: 'خروجی گرفتن از پروفایل های ارائه دهنده به صورت پالایش شده',
            exportCliCapabilityManifest: 'خروجی گرفتن از فهرست قابلیت های CLI',
            exportCliInvocationContract: 'خروجی گرفتن از قرارداد فراخوانی CLI',
            exportCliPublicSurface: 'خروجی گرفتن از سطح عمومی CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'تنظیمات پالایش شده ارائه دهنده در {path} ذخیره شد'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'فهرست قابلیت های CLI در {path} ذخیره شد',
            cliInvocationContractExported: 'قرارداد فراخوانی CLI در {path} ذخیره شد',
            cliPublicSurfaceExported: 'سطح عمومی CLI در {path} ذخیره شد'
        }
    },
    fr: {
        commands: {
            exportProviderProfilesRedacted: 'Exporter les profils fournisseur expurges',
            exportCliCapabilityManifest: 'Exporter le manifeste de capacites CLI',
            exportCliInvocationContract: 'Exporter le contrat d invocation CLI',
            exportCliPublicSurface: 'Exporter la surface publique CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Les parametres fournisseur expurges ont ete exportes vers {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Le manifeste de capacites CLI a ete exporte vers {path}',
            cliInvocationContractExported: 'Le contrat d invocation CLI a ete exporte vers {path}',
            cliPublicSurfaceExported: 'La surface publique CLI a ete exportee vers {path}'
        }
    },
    id: {
        commands: {
            exportProviderProfilesRedacted: 'Ekspor profil penyedia tersunting',
            exportCliCapabilityManifest: 'Ekspor manifes kapabilitas CLI',
            exportCliInvocationContract: 'Ekspor kontrak invokasi CLI',
            exportCliPublicSurface: 'Ekspor permukaan CLI publik'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Pengaturan penyedia tersunting diekspor ke {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Manifes kapabilitas CLI diekspor ke {path}',
            cliInvocationContractExported: 'Kontrak invokasi CLI diekspor ke {path}',
            cliPublicSurfaceExported: 'Permukaan CLI publik diekspor ke {path}'
        }
    },
    it: {
        commands: {
            exportProviderProfilesRedacted: 'Esporta profili provider redatti',
            exportCliCapabilityManifest: 'Esporta manifesto capacita CLI',
            exportCliInvocationContract: 'Esporta contratto di invocazione CLI',
            exportCliPublicSurface: 'Esporta superficie CLI pubblica'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Le impostazioni provider redatte sono state esportate in {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Manifesto capacita CLI esportato in {path}',
            cliInvocationContractExported: 'Contratto di invocazione CLI esportato in {path}',
            cliPublicSurfaceExported: 'Superficie CLI pubblica esportata in {path}'
        }
    },
    ja: {
        commands: {
            exportProviderProfilesRedacted: '秘匿化したプロバイダープロファイルをエクスポート',
            exportCliCapabilityManifest: 'CLI 機能マニフェストをエクスポート',
            exportCliInvocationContract: 'CLI 呼び出し契約をエクスポート',
            exportCliPublicSurface: '公開 CLI サーフェスをエクスポート'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: '秘匿化したプロバイダー設定を {path} にエクスポートしました'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'CLI 機能マニフェストを {path} にエクスポートしました',
            cliInvocationContractExported: 'CLI 呼び出し契約を {path} にエクスポートしました',
            cliPublicSurfaceExported: '公開 CLI サーフェスを {path} にエクスポートしました'
        }
    },
    ko: {
        commands: {
            exportProviderProfilesRedacted: '민감정보 제거된 제공자 프로필 내보내기',
            exportCliCapabilityManifest: 'CLI 기능 매니페스트 내보내기',
            exportCliInvocationContract: 'CLI 호출 계약 내보내기',
            exportCliPublicSurface: '공개 CLI 표면 내보내기'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: '민감정보 제거된 제공자 설정을 {path} 로 내보냈습니다'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'CLI 기능 매니페스트를 {path} 로 내보냈습니다',
            cliInvocationContractExported: 'CLI 호출 계약을 {path} 로 내보냈습니다',
            cliPublicSurfaceExported: '공개 CLI 표면을 {path} 로 내보냈습니다'
        }
    },
    nl: {
        commands: {
            exportProviderProfilesRedacted: 'Geredigeerde providerprofielen exporteren',
            exportCliCapabilityManifest: 'CLI-capaciteitenmanifest exporteren',
            exportCliInvocationContract: 'CLI-aanroepcontract exporteren',
            exportCliPublicSurface: 'Publiek CLI-oppervlak exporteren'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Geredigeerde providerinstellingen zijn geexporteerd naar {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'CLI-capaciteitenmanifest is geexporteerd naar {path}',
            cliInvocationContractExported: 'CLI-aanroepcontract is geexporteerd naar {path}',
            cliPublicSurfaceExported: 'Publiek CLI-oppervlak is geexporteerd naar {path}'
        }
    },
    pl: {
        commands: {
            exportProviderProfilesRedacted: 'Eksportuj zredagowane profile dostawcow',
            exportCliCapabilityManifest: 'Eksportuj manifest mozliwosci CLI',
            exportCliInvocationContract: 'Eksportuj kontrakt wywolania CLI',
            exportCliPublicSurface: 'Eksportuj publiczna powierzchnie CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Zredagowane ustawienia dostawcy wyeksportowano do {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Manifest mozliwosci CLI wyeksportowano do {path}',
            cliInvocationContractExported: 'Kontrakt wywolania CLI wyeksportowano do {path}',
            cliPublicSurfaceExported: 'Publiczna powierzchnie CLI wyeksportowano do {path}'
        }
    },
    pt: {
        commands: {
            exportProviderProfilesRedacted: 'Exportar perfis de provedor com redacao',
            exportCliCapabilityManifest: 'Exportar manifesto de capacidades da CLI',
            exportCliInvocationContract: 'Exportar contrato de invocacao da CLI',
            exportCliPublicSurface: 'Exportar superficie publica da CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'As configuracoes do provedor com redacao foram exportadas para {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Manifesto de capacidades da CLI exportado para {path}',
            cliInvocationContractExported: 'Contrato de invocacao da CLI exportado para {path}',
            cliPublicSurfaceExported: 'Superficie publica da CLI exportada para {path}'
        }
    },
    'pt-BR': {
        commands: {
            exportProviderProfilesRedacted: 'Exportar perfis de provedor com redacao',
            exportCliCapabilityManifest: 'Exportar manifesto de capacidades da CLI',
            exportCliInvocationContract: 'Exportar contrato de invocacao da CLI',
            exportCliPublicSurface: 'Exportar superficie publica da CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'As configuracoes do provedor com redacao foram exportadas para {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Manifesto de capacidades da CLI exportado para {path}',
            cliInvocationContractExported: 'Contrato de invocacao da CLI exportado para {path}',
            cliPublicSurfaceExported: 'Superficie publica da CLI exportada para {path}'
        }
    },
    ru: {
        commands: {
            exportProviderProfilesRedacted: 'Экспортировать обезличенные профили провайдера',
            exportCliCapabilityManifest: 'Экспортировать манифест возможностей CLI',
            exportCliInvocationContract: 'Экспортировать контракт вызова CLI',
            exportCliPublicSurface: 'Экспортировать публичную поверхность CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Обезличенные настройки провайдера экспортированы в {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Манифест возможностей CLI экспортирован в {path}',
            cliInvocationContractExported: 'Контракт вызова CLI экспортирован в {path}',
            cliPublicSurfaceExported: 'Публичная поверхность CLI экспортирована в {path}'
        }
    },
    th: {
        commands: {
            exportProviderProfilesRedacted: 'ส่งออกโปรไฟล์ผู้ให้บริการแบบปกปิดข้อมูล',
            exportCliCapabilityManifest: 'ส่งออกรายการความสามารถ CLI',
            exportCliInvocationContract: 'ส่งออกสัญญาการเรียกใช้ CLI',
            exportCliPublicSurface: 'ส่งออกพื้นผิว CLI สาธารณะ'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'ส่งออกการตั้งค่าผู้ให้บริการแบบปกปิดข้อมูลไปที่ {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'ส่งออกรายการความสามารถ CLI ไปที่ {path}',
            cliInvocationContractExported: 'ส่งออกสัญญาการเรียกใช้ CLI ไปที่ {path}',
            cliPublicSurfaceExported: 'ส่งออกพื้นผิว CLI สาธารณะไปที่ {path}'
        }
    },
    tr: {
        commands: {
            exportProviderProfilesRedacted: 'Sansurlenmis saglayici profillerini disa aktar',
            exportCliCapabilityManifest: 'CLI yetenek manifestini disa aktar',
            exportCliInvocationContract: 'CLI cagri sozlesmesini disa aktar',
            exportCliPublicSurface: 'Herkese acik CLI yuzeyini disa aktar'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Sansurlenmis saglayici ayarlari {path} konumuna disa aktarıldı'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'CLI yetenek manifesti {path} konumuna disa aktarıldı',
            cliInvocationContractExported: 'CLI cagri sozlesmesi {path} konumuna disa aktarıldı',
            cliPublicSurfaceExported: 'Herkese acik CLI yuzeyi {path} konumuna disa aktarıldı'
        }
    },
    uk: {
        commands: {
            exportProviderProfilesRedacted: 'Експортувати знеособлені профілі провайдера',
            exportCliCapabilityManifest: 'Експортувати маніфест можливостей CLI',
            exportCliInvocationContract: 'Експортувати контракт виклику CLI',
            exportCliPublicSurface: 'Експортувати публічну поверхню CLI'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Знеособлені налаштування провайдера експортовано до {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Маніфест можливостей CLI експортовано до {path}',
            cliInvocationContractExported: 'Контракт виклику CLI експортовано до {path}',
            cliPublicSurfaceExported: 'Публічну поверхню CLI експортовано до {path}'
        }
    },
    vi: {
        commands: {
            exportProviderProfilesRedacted: 'Xuat ho so nha cung cap da an thong tin',
            exportCliCapabilityManifest: 'Xuat ban ke kha nang CLI',
            exportCliInvocationContract: 'Xuat hop dong goi CLI',
            exportCliPublicSurface: 'Xuat be mat CLI cong khai'
        },
        settings: {
            providerConfig: {
                exportRedactedSuccess: 'Da xuat cau hinh nha cung cap da an thong tin den {path}'
            }
        },
        notices: {
            cliCapabilityManifestExported: 'Da xuat ban ke kha nang CLI den {path}',
            cliInvocationContractExported: 'Da xuat hop dong goi CLI den {path}',
            cliPublicSurfaceExported: 'Da xuat be mat CLI cong khai den {path}'
        }
    }
};
