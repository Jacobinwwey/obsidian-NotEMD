import { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const EXPERIMENTAL_DIAGRAM_PIPELINE_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'مسار المخططات التجريبي',
                    enableName: 'تفعيل مسار Mermaid المعتمد على المواصفات',
                    enableDesc:
                        'تشغيل: جرّب أولًا مسار DiagramSpec -> renderer الجديد قبل موجه Mermaid القديم. إذا فشل المسار التجريبي، يعود Notemd تلقائيًا إلى تدفق Mermaid القديم.',
                    compatibilityName: 'وضع التوافق التجريبي',
                    compatibilityDesc:
                        'اختر مدى جرأة التوليد والمعاينة التجريبية للمخططات في اختيار هدف الرسم. يحافظ "Mermaid المتوافق" على خرج متوافق مع Mermaid. أما "الأفضل ملاءمة" فيجرّب أولًا نوايا أغنى ثم يتراجع عند عدم الدعم. أمر "تلخيص كمخطط Mermaid" يثبّت دائمًا المسار الجديد على خرج متوافق مع Mermaid.',
                    compatibilityLegacy: 'Mermaid متوافق',
                    compatibilityBestFit: 'أفضل ملاءمة'
                }
            }
        }
    },
    de: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Experimentelle Diagramm-Pipeline',
                    enableName: 'Spezifikationsbasierte Mermaid-Pipeline aktivieren',
                    enableDesc:
                        'Ein: Vor dem alten Mermaid-Prompt zuerst die neue DiagramSpec -> Renderer-Pipeline versuchen. Wenn der experimentelle Pfad fehlschlägt, fällt Notemd automatisch auf den alten Mermaid-Ablauf zurück.',
                    compatibilityName: 'Experimenteller Kompatibilitätsmodus',
                    compatibilityDesc:
                        'Wählen Sie, wie offensiv experimentelle Diagrammerzeugung und Vorschau Ziele auswählen. "Mermaid-kompatibel" hält Mermaid-kompatible Ausgabe bei. "Beste Passung" versucht zuerst reichere Intents und fällt bei fehlender Unterstützung zurück. Der Standardbefehl "Als Mermaid-Diagramm zusammenfassen" pinnt den spec-first-Pfad immer auf Mermaid-kompatible Ausgabe.',
                    compatibilityLegacy: 'Mermaid-kompatibel',
                    compatibilityBestFit: 'Beste Passung'
                }
            }
        }
    },
    es: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Canal experimental de diagramas',
                    enableName: 'Activar canal Mermaid basado en especificaciones',
                    enableDesc:
                        'Activado: prueba primero el nuevo canal DiagramSpec -> renderer antes del prompt heredado de Mermaid. Si la ruta experimental falla, Notemd vuelve automáticamente al flujo heredado de Mermaid.',
                    compatibilityName: 'Modo de compatibilidad experimental',
                    compatibilityDesc:
                        'Elige con qué agresividad la generación y vista previa experimentales seleccionan el destino del diagrama. "Compatible con Mermaid" mantiene una salida compatible con Mermaid. "Mejor ajuste" puede probar primero intenciones más ricas y retroceder cuando no haya soporte. El comando estándar "Resumir como diagrama Mermaid" siempre fija la ruta spec-first a una salida compatible con Mermaid.',
                    compatibilityLegacy: 'Compatible con Mermaid',
                    compatibilityBestFit: 'Mejor ajuste'
                }
            }
        }
    },
    fa: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'خط لوله آزمایشی نمودار',
                    enableName: 'فعال‌سازی خط لوله Mermaid مبتنی بر مشخصات',
                    enableDesc:
                        'روشن: پیش از پرامپت قدیمی Mermaid، ابتدا خط لوله جدید DiagramSpec -> renderer را امتحان کن. اگر مسیر آزمایشی شکست بخورد، Notemd به‌صورت خودکار به جریان قدیمی Mermaid برمی‌گردد.',
                    compatibilityName: 'حالت سازگاری آزمایشی',
                    compatibilityDesc:
                        'مشخص کن تولید و پیش‌نمایش آزمایشی نمودار تا چه حد تهاجمی مقصد نمودار را انتخاب کنند. «سازگار با Mermaid» خروجی سازگار با Mermaid را حفظ می‌کند. «بهترین تطابق» ابتدا intentهای غنی‌تر را امتحان می‌کند و در صورت نبود پشتیبانی عقب‌نشینی می‌کند. فرمان استاندارد «خلاصه به‌صورت نمودار Mermaid» همیشه مسیر spec-first را به خروجی سازگار با Mermaid مقید می‌کند.',
                    compatibilityLegacy: 'سازگار با Mermaid',
                    compatibilityBestFit: 'بهترین تطابق'
                }
            }
        }
    },
    fr: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Pipeline expérimental de diagrammes',
                    enableName: 'Activer le pipeline Mermaid orienté spécification',
                    enableDesc:
                        'Activé : essaie d’abord le nouveau pipeline DiagramSpec -> renderer avant l’ancien prompt Mermaid. Si le chemin expérimental échoue, Notemd revient automatiquement au flux Mermaid historique.',
                    compatibilityName: 'Mode de compatibilité expérimental',
                    compatibilityDesc:
                        'Choisissez à quel point la génération et l’aperçu expérimentaux sélectionnent agressivement la cible du diagramme. « Compatible Mermaid » conserve une sortie compatible Mermaid. « Meilleur ajustement » peut essayer d’abord des intentions plus riches puis revenir en arrière si elles ne sont pas prises en charge. La commande standard « Résumer en diagramme Mermaid » force toujours le chemin spec-first à rester compatible Mermaid.',
                    compatibilityLegacy: 'Compatible Mermaid',
                    compatibilityBestFit: 'Meilleur ajustement'
                }
            }
        }
    },
    id: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Pipeline diagram eksperimental',
                    enableName: 'Aktifkan pipeline Mermaid berbasis spesifikasi',
                    enableDesc:
                        'Aktif: coba pipeline DiagramSpec -> renderer yang baru sebelum prompt Mermaid lama. Jika jalur eksperimental gagal, Notemd otomatis kembali ke alur Mermaid lama.',
                    compatibilityName: 'Mode kompatibilitas eksperimental',
                    compatibilityDesc:
                        'Pilih seagresif apa pembuatan dan pratinjau diagram eksperimental memilih target diagram. "Kompatibel Mermaid" mempertahankan keluaran yang kompatibel dengan Mermaid. "Paling sesuai" dapat mencoba intent yang lebih kaya lebih dulu lalu mundur saat tidak didukung. Perintah standar "Ringkas sebagai diagram Mermaid" selalu mengunci jalur spec-first ke keluaran yang kompatibel dengan Mermaid.',
                    compatibilityLegacy: 'Kompatibel Mermaid',
                    compatibilityBestFit: 'Paling sesuai'
                }
            }
        }
    },
    it: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Pipeline diagrammi sperimentale',
                    enableName: 'Abilita pipeline Mermaid guidata da specifica',
                    enableDesc:
                        'Attivo: prova prima la nuova pipeline DiagramSpec -> renderer prima del prompt Mermaid legacy. Se il percorso sperimentale fallisce, Notemd torna automaticamente al flusso Mermaid legacy.',
                    compatibilityName: 'Modalità di compatibilità sperimentale',
                    compatibilityDesc:
                        'Scegli quanto aggressivamente generazione e anteprima sperimentali selezionano il target del diagramma. "Compatibile con Mermaid" mantiene un output compatibile con Mermaid. "Miglior corrispondenza" può provare prima intent più ricchi e poi ripiegare se non supportati. Il comando standard "Riassumi come diagramma Mermaid" forza sempre il percorso spec-first a restare compatibile con Mermaid.',
                    compatibilityLegacy: 'Compatibile con Mermaid',
                    compatibilityBestFit: 'Miglior corrispondenza'
                }
            }
        }
    },
    ja: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: '実験的なダイアグラムパイプライン',
                    enableName: '仕様先行の Mermaid パイプラインを有効化',
                    enableDesc:
                        'オン: 従来の Mermaid プロンプトより前に、新しい DiagramSpec -> renderer パイプラインを先に試します。実験経路が失敗した場合、Notemd は自動で従来の Mermaid フローへ戻ります。',
                    compatibilityName: '実験的互換モード',
                    compatibilityDesc:
                        '実験的な図生成とプレビューがどれだけ積極的に図ターゲットを選ぶかを指定します。「Mermaid 互換」は Mermaid 互換出力を維持します。「最適一致」はより豊かな intent を先に試し、未対応ならフォールバックします。標準の「Mermaid 図として要約」コマンドは、spec-first 経路を常に Mermaid 互換出力へ固定します。',
                    compatibilityLegacy: 'Mermaid 互換',
                    compatibilityBestFit: '最適一致'
                }
            }
        }
    },
    ko: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: '실험적 다이어그램 파이프라인',
                    enableName: '명세 우선 Mermaid 파이프라인 사용',
                    enableDesc:
                        '켜기: 기존 Mermaid 프롬프트보다 먼저 새 DiagramSpec -> renderer 파이프라인을 시도합니다. 실험 경로가 실패하면 Notemd가 자동으로 기존 Mermaid 흐름으로 되돌아갑니다.',
                    compatibilityName: '실험적 호환 모드',
                    compatibilityDesc:
                        '실험적 다이어그램 생성과 미리보기가 얼마나 적극적으로 다이어그램 대상을 선택할지 지정합니다. "Mermaid 호환"은 Mermaid 호환 출력을 유지합니다. "최적 적합"은 더 풍부한 intent를 먼저 시도하고 지원되지 않으면 되돌아갑니다. 기본 "Mermaid 다이어그램으로 요약" 명령은 spec-first 경로를 항상 Mermaid 호환 출력으로 고정합니다.',
                    compatibilityLegacy: 'Mermaid 호환',
                    compatibilityBestFit: '최적 적합'
                }
            }
        }
    },
    nl: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Experimentele diagrampijplijn',
                    enableName: 'Spec-first Mermaid-pijplijn inschakelen',
                    enableDesc:
                        'Aan: probeer eerst de nieuwe DiagramSpec -> renderer-pijplijn vóór de oude Mermaid-prompt. Als het experimentele pad faalt, valt Notemd automatisch terug op de oude Mermaid-stroom.',
                    compatibilityName: 'Experimentele compatibiliteitsmodus',
                    compatibilityDesc:
                        'Kies hoe agressief experimentele diagramgeneratie en voorbeeldweergave diagramdoelen selecteren. "Mermaid-compatibel" houdt Mermaid-compatibele uitvoer aan. "Beste passing" probeert eerst rijkere intents en valt terug wanneer ondersteuning ontbreekt. De standaardopdracht "Samenvatten als Mermaid-diagram" zet het spec-first-pad altijd vast op Mermaid-compatibele uitvoer.',
                    compatibilityLegacy: 'Mermaid-compatibel',
                    compatibilityBestFit: 'Beste passing'
                }
            }
        }
    },
    pl: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Eksperymentalny potok diagramów',
                    enableName: 'Włącz potok Mermaid oparty na specyfikacji',
                    enableDesc:
                        'Wł.: przed starym promptem Mermaid najpierw wypróbuj nowy potok DiagramSpec -> renderer. Jeśli ścieżka eksperymentalna zawiedzie, Notemd automatycznie wróci do starego przepływu Mermaid.',
                    compatibilityName: 'Eksperymentalny tryb zgodności',
                    compatibilityDesc:
                        'Wybierz, jak agresywnie eksperymentalne generowanie i podgląd diagramów wybierają cel diagramu. „Zgodny z Mermaid” utrzymuje wyjście zgodne z Mermaid. „Najlepsze dopasowanie” może najpierw próbować bogatszych intentów, a przy braku wsparcia wróci do prostszego wariantu. Standardowe polecenie „Podsumuj jako diagram Mermaid” zawsze przypina ścieżkę spec-first do wyjścia zgodnego z Mermaid.',
                    compatibilityLegacy: 'Zgodny z Mermaid',
                    compatibilityBestFit: 'Najlepsze dopasowanie'
                }
            }
        }
    },
    pt: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Pipeline experimental de diagramas',
                    enableName: 'Ativar pipeline Mermaid orientado por especificação',
                    enableDesc:
                        'Ligado: tenta primeiro o novo pipeline DiagramSpec -> renderer antes do prompt Mermaid legado. Se o caminho experimental falhar, o Notemd volta automaticamente ao fluxo Mermaid legado.',
                    compatibilityName: 'Modo de compatibilidade experimental',
                    compatibilityDesc:
                        'Escolhe quão agressivamente a geração e a pré-visualização experimentais selecionam alvos de diagrama. "Compatível com Mermaid" mantém saída compatível com Mermaid. "Melhor ajuste" pode tentar intenções mais ricas primeiro e recuar quando não houver suporte. O comando padrão "Resumir como diagrama Mermaid" fixa sempre o caminho spec-first em saída compatível com Mermaid.',
                    compatibilityLegacy: 'Compatível com Mermaid',
                    compatibilityBestFit: 'Melhor ajuste'
                }
            }
        }
    },
    'pt-BR': {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Pipeline experimental de diagramas',
                    enableName: 'Ativar pipeline Mermaid orientado por especificação',
                    enableDesc:
                        'Ligado: tenta primeiro o novo pipeline DiagramSpec -> renderer antes do prompt Mermaid legado. Se o caminho experimental falhar, o Notemd volta automaticamente ao fluxo Mermaid legado.',
                    compatibilityName: 'Modo de compatibilidade experimental',
                    compatibilityDesc:
                        'Escolha quão agressivamente a geração e a pré-visualização experimentais selecionam alvos de diagrama. "Compatível com Mermaid" mantém saída compatível com Mermaid. "Melhor ajuste" pode tentar intents mais ricos primeiro e recuar quando não houver suporte. O comando padrão "Resumir como diagrama Mermaid" sempre fixa o caminho spec-first em saída compatível com Mermaid.',
                    compatibilityLegacy: 'Compatível com Mermaid',
                    compatibilityBestFit: 'Melhor ajuste'
                }
            }
        }
    },
    ru: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Экспериментальный конвейер диаграмм',
                    enableName: 'Включить spec-first конвейер Mermaid',
                    enableDesc:
                        'Вкл.: сначала пробовать новый конвейер DiagramSpec -> renderer перед старым Mermaid prompt. Если экспериментальный путь не сработает, Notemd автоматически откатится к старому Mermaid-потоку.',
                    compatibilityName: 'Экспериментальный режим совместимости',
                    compatibilityDesc:
                        'Выберите, насколько агрессивно экспериментальная генерация и предпросмотр будут выбирать цель диаграммы. «Совместимо с Mermaid» сохраняет Mermaid-совместимый вывод. «Лучшее соответствие» сначала пробует более богатые intent-ы и откатывается при отсутствии поддержки. Стандартная команда «Суммировать как диаграмму Mermaid» всегда фиксирует spec-first путь на Mermaid-совместимом выводе.',
                    compatibilityLegacy: 'Совместимо с Mermaid',
                    compatibilityBestFit: 'Лучшее соответствие'
                }
            }
        }
    },
    th: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'ไปป์ไลน์ไดอะแกรมแบบทดลอง',
                    enableName: 'เปิดใช้ไปป์ไลน์ Mermaid แบบยึดสเปกก่อน',
                    enableDesc:
                        'เปิด: ลองใช้ไปป์ไลน์ DiagramSpec -> renderer ใหม่ก่อนพรอมป์ต์ Mermaid แบบเดิม หากเส้นทางทดลองล้มเหลว Notemd จะย้อนกลับไปยังโฟลว์ Mermaid แบบเดิมโดยอัตโนมัติ',
                    compatibilityName: 'โหมดความเข้ากันได้แบบทดลอง',
                    compatibilityDesc:
                        'เลือกระดับความเข้มในการเลือกเป้าหมายไดอะแกรมของการสร้างและพรีวิวแบบทดลอง "เข้ากันได้กับ Mermaid" จะคงผลลัพธ์ที่เข้ากันได้กับ Mermaid ไว้ ส่วน "เหมาะที่สุด" จะลอง intent ที่หลากหลายกว่าก่อนแล้วค่อย fallback เมื่อไม่รองรับ คำสั่งมาตรฐาน "สรุปเป็นไดอะแกรม Mermaid" จะตรึงเส้นทาง spec-first ให้เป็นผลลัพธ์ที่เข้ากันได้กับ Mermaid เสมอ',
                    compatibilityLegacy: 'เข้ากันได้กับ Mermaid',
                    compatibilityBestFit: 'เหมาะที่สุด'
                }
            }
        }
    },
    tr: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Deneysel diyagram hattı',
                    enableName: 'Spec-first Mermaid hattını etkinleştir',
                    enableDesc:
                        'Açık: eski Mermaid isteminden önce yeni DiagramSpec -> renderer hattını önce dene. Deneysel yol başarısız olursa Notemd otomatik olarak eski Mermaid akışına döner.',
                    compatibilityName: 'Deneysel uyumluluk modu',
                    compatibilityDesc:
                        'Deneysel diyagram üretimi ve önizlemenin diyagram hedeflerini ne kadar agresif seçeceğini belirleyin. "Mermaid uyumlu" Mermaid uyumlu çıktıyı korur. "En iyi eşleşme" önce daha zengin intentleri deneyip destek yoksa geri çekilir. Standart "Mermaid diyagramı olarak özetle" komutu spec-first yolunu her zaman Mermaid uyumlu çıktıya sabitler.',
                    compatibilityLegacy: 'Mermaid uyumlu',
                    compatibilityBestFit: 'En iyi eşleşme'
                }
            }
        }
    },
    uk: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Експериментальний конвеєр діаграм',
                    enableName: 'Увімкнути spec-first конвеєр Mermaid',
                    enableDesc:
                        'Увімкнено: спочатку пробувати новий конвеєр DiagramSpec -> renderer перед старим Mermaid prompt. Якщо експериментальний шлях зламається, Notemd автоматично повернеться до старого Mermaid-потоку.',
                    compatibilityName: 'Експериментальний режим сумісності',
                    compatibilityDesc:
                        'Виберіть, наскільки агресивно експериментальна генерація та попередній перегляд обирають ціль діаграми. «Сумісно з Mermaid» зберігає Mermaid-сумісний вивід. «Найкраща відповідність» спочатку пробує багатші intent-и й відступає, якщо підтримки немає. Стандартна команда «Підсумувати як Mermaid-діаграму» завжди фіксує spec-first шлях на Mermaid-сумісному виводі.',
                    compatibilityLegacy: 'Сумісно з Mermaid',
                    compatibilityBestFit: 'Найкраща відповідність'
                }
            }
        }
    },
    vi: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    heading: 'Pipeline sơ đồ thử nghiệm',
                    enableName: 'Bật pipeline Mermaid ưu tiên đặc tả',
                    enableDesc:
                        'Bật: thử pipeline DiagramSpec -> renderer mới trước prompt Mermaid cũ. Nếu nhánh thử nghiệm thất bại, Notemd sẽ tự động quay lại luồng Mermaid cũ.',
                    compatibilityName: 'Chế độ tương thích thử nghiệm',
                    compatibilityDesc:
                        'Chọn mức độ mạnh tay khi việc tạo và xem trước sơ đồ thử nghiệm chọn đích sơ đồ. "Tương thích Mermaid" giữ đầu ra tương thích Mermaid. "Khớp tốt nhất" có thể thử các intent phong phú hơn trước rồi lùi lại khi không được hỗ trợ. Lệnh chuẩn "Tóm tắt thành sơ đồ Mermaid" luôn ghim nhánh spec-first vào đầu ra tương thích Mermaid.',
                    compatibilityLegacy: 'Tương thích Mermaid',
                    compatibilityBestFit: 'Khớp tốt nhất'
                }
            }
        }
    }
};
