import { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const EXPERIMENTAL_DIAGRAM_PIPELINE_LOCALE_EXTENSIONS: Record<string, DeepPartial<NotemdEnglishStrings>> = {
    ar: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    obsidianCompatiblePngName: "إنشاء صور متوافقة مع Obsidian",
                    obsidianCompatiblePngDesc: "مفعّل افتراضيًا. يتحقق من فك ترميز PNG في Obsidian؛ عند الفشل يحتفظ بالأصل ويضيف نسخة بدقة PPI أقل. يظهر PPI في الاسمين. عند التعطيل يُصدّر الأصل فقط.",
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
                    obsidianCompatiblePngName: "Obsidian-kompatible Bilder erzeugen",
                    obsidianCompatiblePngDesc: "Standardmäßig aktiv. Prüft die PNG-Dekodierung in Obsidian. Bei Fehlern bleibt das Original erhalten und eine Kopie mit niedrigerem PPI wird ergänzt. Beide Dateinamen zeigen den PPI. Aus: nur das angeforderte Original.",
                    heading: 'Experimentelle Diagramm-Pipeline',
                    enableName: 'Spezifikationsbasierte Mermaid-Pipeline aktivieren',
                    enableDesc:
                        'Ein: Vor dem alten Mermaid-Prompt zuerst die neue DiagramSpec -> Renderer-Pipeline versuchen. Wenn der experimentelle Pfad fehlschlägt, fällt Notemd automatisch auf den alten Mermaid-Ablauf zurück.',
                    compatibilityName: 'Experimenteller Kompatibilitätsmodus',
                    compatibilityDesc:
                        'Wählen Sie, wie offensiv experimentelle Diagrammerzeugung und Vorschau Ziele auswählen. "Mermaid-kompatibel" hält Mermaid-kompatible Ausgabe bei. "Beste Passung" versucht zuerst reichere Intents und fällt bei fehlender Unterstützung zurück. Der Standardbefehl "Als Mermaid-Diagramm zusammenfassen" pinnt den spec-first-Pfad immer auf Mermaid-kompatible Ausgabe.',
                    compatibilityLegacy: 'Mermaid-kompatibel',
                    compatibilityBestFit: 'Beste Passung',
                    intentCircuit: 'Schaltung (Circuitikz)',
                    intentTimeline: 'Zeitachse',
                    intentSwimlane: 'Swimlane-Ablauf',
                    intentQuadrant: 'Prioritätsquadrant',
                    renderTargetCircuitikz: 'Circuitikz + SVG-Vorschau'
                }
            }
        }
    },
    es: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    obsidianCompatiblePngName: "Generar imágenes compatibles con Obsidian",
                    obsidianCompatiblePngDesc: "Activado por defecto. Comprueba la decodificación del PNG en Obsidian; si falla, conserva el original y añade una copia con menos PPI. Ambos nombres indican los PPI. Desactivado: solo el original solicitado.",
                    heading: 'Canal experimental de diagramas',
                    enableName: 'Activar canal Mermaid basado en especificaciones',
                    enableDesc:
                        'Activado: prueba primero el nuevo canal DiagramSpec -> renderer antes del prompt heredado de Mermaid. Si la ruta experimental falla, Notemd vuelve automáticamente al flujo heredado de Mermaid.',
                    compatibilityName: 'Modo de compatibilidad experimental',
                    compatibilityDesc:
                        'Elige con qué agresividad la generación y vista previa experimentales seleccionan el destino del diagrama. "Compatible con Mermaid" mantiene una salida compatible con Mermaid. "Mejor ajuste" puede probar primero intenciones más ricas y retroceder cuando no haya soporte. El comando estándar "Resumir como diagrama Mermaid" siempre fija la ruta spec-first a una salida compatible con Mermaid.',
                    compatibilityLegacy: 'Compatible con Mermaid',
                    compatibilityBestFit: 'Mejor ajuste',
                    intentCircuit: 'Circuito (Circuitikz)',
                    intentTimeline: 'Línea de tiempo',
                    intentSwimlane: 'Flujo por carriles',
                    intentQuadrant: 'Cuadrante de prioridades',
                    renderTargetCircuitikz: 'Circuitikz + vista previa SVG'
                }
            }
        }
    },
    fa: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    obsidianCompatiblePngName: "تولید تصاویر سازگار با Obsidian",
                    obsidianCompatiblePngDesc: "به‌طور پیش‌فرض فعال است. رمزگشایی PNG در Obsidian بررسی می‌شود؛ در صورت شکست، نسخه اصلی حفظ و یک نسخه با PPI کمتر افزوده می‌شود. هر دو نام فایل PPI را نشان می‌دهند. در حالت غیرفعال فقط نسخه اصلی صادر می‌شود.",
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
                    obsidianCompatiblePngName: "Générer des images compatibles avec Obsidian",
                    obsidianCompatiblePngDesc: "Activé par défaut. Vérifie le décodage du PNG dans Obsidian ; en cas d’échec, conserve l’original et ajoute une copie à PPI réduit. Les deux noms indiquent le PPI. Désactivé : seulement l’original demandé.",
                    heading: 'Pipeline expérimental de diagrammes',
                    enableName: 'Activer le pipeline Mermaid orienté spécification',
                    enableDesc:
                        'Activé : essaie d’abord le nouveau pipeline DiagramSpec -> renderer avant l’ancien prompt Mermaid. Si le chemin expérimental échoue, Notemd revient automatiquement au flux Mermaid historique.',
                    compatibilityName: 'Mode de compatibilité expérimental',
                    compatibilityDesc:
                        'Choisissez à quel point la génération et l’aperçu expérimentaux sélectionnent agressivement la cible du diagramme. « Compatible Mermaid » conserve une sortie compatible Mermaid. « Meilleur ajustement » peut essayer d’abord des intentions plus riches puis revenir en arrière si elles ne sont pas prises en charge. La commande standard « Résumer en diagramme Mermaid » force toujours le chemin spec-first à rester compatible Mermaid.',
                    compatibilityLegacy: 'Compatible Mermaid',
                    compatibilityBestFit: 'Meilleur ajustement',
                    intentCircuit: 'Circuit (Circuitikz)',
                    intentTimeline: 'Timeline',
                    intentSwimlane: 'Swimlane flow',
                    intentQuadrant: 'Priority quadrant',
                    renderTargetCircuitikz: 'Circuitikz + aperçu SVG'
                }
            }
        }
    },
    id: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    obsidianCompatiblePngName: "Buat gambar yang kompatibel dengan Obsidian",
                    obsidianCompatiblePngDesc: "Aktif secara default. Periksa dekode PNG di Obsidian; jika gagal, simpan gambar asli dan tambahkan salinan dengan PPI lebih rendah. Kedua nama berkas mencantumkan PPI. Nonaktif: hanya gambar asli yang diminta.",
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
                    obsidianCompatiblePngName: "Genera immagini compatibili con Obsidian",
                    obsidianCompatiblePngDesc: "Attivo per impostazione predefinita. Verifica la decodifica PNG in Obsidian; in caso di errore conserva l’originale e aggiunge una copia con PPI ridotto. Entrambi i nomi indicano il PPI. Disattivato: solo l’originale richiesto.",
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
                    obsidianCompatiblePngName: "Obsidian 対応の画像を生成",
                    obsidianCompatiblePngDesc: "既定で有効です。Obsidian で PNG をデコードできるか確認し、失敗した場合は指定 PPI の原本を残して低 PPI のコピーを追加します。両方のファイル名に PPI を表示します。無効時は指定の原本のみ出力します。",
                    heading: '実験的なダイアグラムパイプライン',
                    enableName: '仕様先行の Mermaid パイプラインを有効化',
                    enableDesc:
                        'オン: 従来の Mermaid プロンプトより前に、新しい DiagramSpec -> renderer パイプラインを先に試します。実験経路が失敗した場合、Notemd は自動で従来の Mermaid フローへ戻ります。',
                    compatibilityName: '実験的互換モード',
                    compatibilityDesc:
                        '実験的な図生成とプレビューがどれだけ積極的に図ターゲットを選ぶかを指定します。「Mermaid 互換」は Mermaid 互換出力を維持します。「最適一致」はより豊かな intent を先に試し、未対応ならフォールバックします。標準の「Mermaid 図として要約」コマンドは、spec-first 経路を常に Mermaid 互換出力へ固定します。',
                    compatibilityLegacy: 'Mermaid 互換',
                    compatibilityBestFit: '最適一致',
                    intentCircuit: '回路 (Circuitikz)',
                    intentTimeline: 'タイムライン',
                    intentSwimlane: 'スイムレーン フロー',
                    intentQuadrant: '優先度クアドラント',
                    renderTargetCircuitikz: 'Circuitikz + SVG プレビュー'
                }
            }
        }
    },
    ko: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    obsidianCompatiblePngName: "Obsidian 호환 이미지 생성",
                    obsidianCompatiblePngDesc: "기본적으로 켜져 있습니다. Obsidian에서 PNG 디코딩을 확인하고 실패하면 요청한 원본을 보존하면서 PPI가 낮은 사본을 추가합니다. 두 파일 이름에 PPI를 표시합니다. 끄면 요청한 원본만 내보냅니다.",
                    heading: '실험적 다이어그램 파이프라인',
                    enableName: '명세 우선 Mermaid 파이프라인 사용',
                    enableDesc:
                        '켜기: 기존 Mermaid 프롬프트보다 먼저 새 DiagramSpec -> renderer 파이프라인을 시도합니다. 실험 경로가 실패하면 Notemd가 자동으로 기존 Mermaid 흐름으로 되돌아갑니다.',
                    compatibilityName: '실험적 호환 모드',
                    compatibilityDesc:
                        '실험적 다이어그램 생성과 미리보기가 얼마나 적극적으로 다이어그램 대상을 선택할지 지정합니다. "Mermaid 호환"은 Mermaid 호환 출력을 유지합니다. "최적 적합"은 더 풍부한 intent를 먼저 시도하고 지원되지 않으면 되돌아갑니다. 기본 "Mermaid 다이어그램으로 요약" 명령은 spec-first 경로를 항상 Mermaid 호환 출력으로 고정합니다.',
                    compatibilityLegacy: 'Mermaid 호환',
                    compatibilityBestFit: '최적 적합',
                    intentCircuit: '회로 (Circuitikz)',
                    intentTimeline: '타임라인',
                    intentSwimlane: '스윔레인 흐름',
                    intentQuadrant: '우선순위 사분면',
                    renderTargetCircuitikz: 'Circuitikz + SVG 미리보기'
                }
            }
        }
    },
    nl: {
        settings: {
            developer: {
                experimentalDiagramPipeline: {
                    obsidianCompatiblePngName: "Obsidian-compatibele afbeeldingen genereren",
                    obsidianCompatiblePngDesc: "Standaard ingeschakeld. Controleert PNG-decodering in Obsidian; bij mislukking blijft het origineel behouden en wordt een kopie met lagere PPI toegevoegd. Beide namen tonen de PPI. Uit: alleen het gevraagde origineel.",
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
                    obsidianCompatiblePngName: "Generuj obrazy zgodne z Obsidian",
                    obsidianCompatiblePngDesc: "Domyślnie włączone. Sprawdza dekodowanie PNG w Obsidian; w razie błędu zachowuje oryginał i dodaje kopię o niższym PPI. Obie nazwy zawierają PPI. Po wyłączeniu eksportuje tylko żądany oryginał.",
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
                    obsidianCompatiblePngName: "Gerar imagens compatíveis com Obsidian",
                    obsidianCompatiblePngDesc: "Ativado por padrão. Verifica a descodificação do PNG no Obsidian; se falhar, mantém o original e acrescenta uma cópia com PPI inferior. Ambos os nomes indicam o PPI. Desativado: apenas o original pedido.",
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
                    obsidianCompatiblePngName: "Gerar imagens compatíveis com Obsidian",
                    obsidianCompatiblePngDesc: "Ativado por padrão. Verifica a decodificação do PNG no Obsidian; se falhar, mantém o original e adiciona uma cópia com PPI menor. Os dois nomes indicam o PPI. Desativado: somente o original solicitado.",
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
                    obsidianCompatiblePngName: "Создавать изображения, совместимые с Obsidian",
                    obsidianCompatiblePngDesc: "Включено по умолчанию. Проверяет декодирование PNG в Obsidian; при ошибке сохраняет оригинал и добавляет копию с меньшим PPI. PPI указан в обоих именах файлов. При отключении экспортируется только запрошенный оригинал.",
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
                    obsidianCompatiblePngName: "สร้างภาพที่เข้ากันได้กับ Obsidian",
                    obsidianCompatiblePngDesc: "เปิดโดยค่าเริ่มต้น ตรวจสอบการถอดรหัส PNG ใน Obsidian หากล้มเหลวจะเก็บต้นฉบับและเพิ่มสำเนาที่มี PPI ต่ำกว่า ชื่อไฟล์ทั้งสองระบุ PPI เมื่อปิดจะส่งออกเฉพาะต้นฉบับตามที่ขอ",
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
                    obsidianCompatiblePngName: "Obsidian ile uyumlu görseller oluştur",
                    obsidianCompatiblePngDesc: "Varsayılan olarak açıktır. Obsidian’da PNG çözümlemesini kontrol eder; başarısızsa özgün dosyayı korur ve daha düşük PPI ile bir kopya ekler. İki dosya adı da PPI belirtir. Kapalıysa yalnızca istenen özgün dosya dışa aktarılır.",
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
                    obsidianCompatiblePngName: "Створювати зображення, сумісні з Obsidian",
                    obsidianCompatiblePngDesc: "Увімкнено за замовчуванням. Перевіряє декодування PNG в Obsidian; у разі помилки зберігає оригінал і додає копію з нижчим PPI. Обидві назви файлів містять PPI. Після вимкнення експортує лише запитаний оригінал.",
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
                    obsidianCompatiblePngName: "Tạo ảnh tương thích với Obsidian",
                    obsidianCompatiblePngDesc: "Bật theo mặc định. Kiểm tra giải mã PNG trong Obsidian; nếu thất bại, giữ bản gốc và thêm bản sao có PPI thấp hơn. Cả hai tên tệp đều ghi PPI. Khi tắt, chỉ xuất bản gốc theo yêu cầu.",
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
