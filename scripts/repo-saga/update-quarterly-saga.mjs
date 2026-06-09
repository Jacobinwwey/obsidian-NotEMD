#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageManagerRuntime from "../lib/package-manager-runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const {
  DEFAULT_REPO_SAGA_LOCK_FILENAME,
  acquireRepoSagaExecutionLock,
} = require("../lib/repo-saga-execution-lock.js");
const {
  countCanonicalHumanContributorsFromIdentityLines,
  rewriteRepoSagaContributorCountsInSvg,
} = require("../lib/repo-saga-contributor-normalization.js");
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "docs", "repo-saga");
const buildRoot = path.join(repoRoot, ".cache", "repo-saga-build");
const upstreamRoot = path.join(repoRoot, ".cache", "repo-saga-upstream");
const repoSagaCacheRoot = path.join(repoRoot, ".cache", "repo-saga-sources");
const repoSagaExecutionLockPath = path.join(repoRoot, ".cache", DEFAULT_REPO_SAGA_LOCK_FILENAME);
const canonicalMailmapPath = path.join(repoRoot, ".mailmap");
const granularitySourceRoot = path.join(repoSagaCacheRoot, "timeline-granularity");
const localeSourceRoot = path.join(repoSagaCacheRoot, "locale-i18n");
const legacyTempToolRoot = path.join(repoRoot, ".tmp_repo_saga_tool");
const legacyDocsBuildRoot = path.join(outputDir, ".build");
const repoSagaForkUrl = "https://github.com/Jacobinwwey/repo-saga.git";
const repoSagaIntegrationStamp = path.join(upstreamRoot, ".notemd-repo-saga-integration.json");
const repoSagaIntegrationVersion = 3;
const repoSagaSourceInput = repoRoot.split(path.sep).join("/");
const { buildPackageManagerRuntime, packageManagerCandidates } = packageManagerRuntime;
const repoSagaSources = [
  {
    label: "timeline-granularity",
    root: granularitySourceRoot,
    repoUrl: repoSagaForkUrl,
    branch: "feat/timeline-granularity",
  },
  {
    label: "locale-i18n",
    root: localeSourceRoot,
    repoUrl: repoSagaForkUrl,
    branch: "feat-locale-i18n",
  },
];
const localeOverlayFiles = [
  "packages/cli/test/args.test.ts",
  "packages/renderer/src/generated-locales.ts",
  "packages/renderer/src/i18n.ts",
  "packages/renderer/src/index.ts",
  "packages/renderer/src/manual-locales.ts",
  "packages/renderer/src/markdown.ts",
  "packages/renderer/src/svg.ts",
  "packages/renderer/test/i18n.test.ts",
];
const rootReadmePattern = /^README(?:_([^.]+))?\.md$/i;
const chronicleCopyByLocale = {
  ar: {
    heading: "## السجل التطوري",
    description: "يُعرض هذا السجل الفصلي بأسلوب [repo-saga](https://github.com/teee32/repo-saga) الأصلي، مع تغيير تقسيم العصور فقط من سنوي إلى ربعي.",
    refreshedWorkingTree: (date) => `تم آخر تحديث من شجرة العمل في ${date}.`,
    refreshedRelease: (tag, date) => `تم آخر تحديث للإصدار ذي الوسم \`${tag}\` في ${date}.`,
    latestCommitDate: (date) => `تاريخ أحدث التزام: ${date}.`,
  },
  bn: {
    heading: "## উন্নয়ন ক্রনিকল",
    description: "এই ত্রৈমাসিক ক্রনিকলটি [repo-saga](https://github.com/teee32/repo-saga)-এর মূল ভিজ্যুয়াল স্টাইল বজায় রাখে; শুধু যুগভাগকে বছর থেকে ত্রৈমাসিকে বদলানো হয়েছে।",
    refreshedWorkingTree: (date) => `সর্বশেষ ${date} তারিখে বর্তমান ওয়ার্কিং ট্রি থেকে রিফ্রেশ করা হয়েছে।`,
    refreshedRelease: (tag, date) => `সর্বশেষ \`${tag}\` রিলিজ ট্যাগের জন্য ${date} তারিখে রিফ্রেশ করা হয়েছে।`,
    latestCommitDate: (date) => `সর্বশেষ কমিটের তারিখ: ${date}।`,
  },
  cs: {
    heading: "## Kronika Vývoje",
    description: "Tato čtvrtletní kronika zachovává původní vizuální styl [repo-saga](https://github.com/teee32/repo-saga); mění se pouze dělení ér z ročního na čtvrtletní.",
    refreshedWorkingTree: (date) => `Naposledy obnoveno z aktuálního pracovního stromu dne ${date}.`,
    refreshedRelease: (tag, date) => `Naposledy obnoveno pro tag vydání \`${tag}\` dne ${date}.`,
    latestCommitDate: (date) => `Datum posledního commitu: ${date}.`,
  },
  da: {
    heading: "## Udviklingskrønike",
    description: "Denne kvartalsvise krønike bevarer den oprindelige visuelle stil fra [repo-saga](https://github.com/teee32/repo-saga); kun era-opdelingen er ændret fra år til kvartal.",
    refreshedWorkingTree: (date) => `Senest opdateret fra det aktuelle arbejdstræ den ${date}.`,
    refreshedRelease: (tag, date) => `Senest opdateret for udgivelsestagget \`${tag}\` den ${date}.`,
    latestCommitDate: (date) => `Seneste commit-dato: ${date}.`,
  },
  de: {
    heading: "## Entwicklungschronik",
    description: "Diese quartalsweise Chronik behält den ursprünglichen visuellen Stil von [repo-saga](https://github.com/teee32/repo-saga) bei; nur die Einteilung der Epochen wurde von Jahren auf Quartale umgestellt.",
    refreshedWorkingTree: (date) => `Zuletzt am ${date} aus dem aktuellen Arbeitsbaum aktualisiert.`,
    refreshedRelease: (tag, date) => `Zuletzt für das Release-Tag \`${tag}\` am ${date} aktualisiert.`,
    latestCommitDate: (date) => `Datum des letzten Commits: ${date}.`,
  },
  el: {
    heading: "## Χρονικό Ανάπτυξης",
    description: "Αυτό το τριμηνιαίο χρονικό διατηρεί το αρχικό οπτικό ύφος του [repo-saga](https://github.com/teee32/repo-saga), αλλάζει μόνο η διαίρεση των εποχών από έτη σε τρίμηνα.",
    refreshedWorkingTree: (date) => `Τελευταία ανανέωση από το τρέχον αντίγραφο εργασίας στις ${date}.`,
    refreshedRelease: (tag, date) => `Τελευταία ανανέωση για την ετικέτα έκδοσης \`${tag}\` στις ${date}.`,
    latestCommitDate: (date) => `Ημερομηνία τελευταίου commit: ${date}.`,
  },
  en: {
    heading: "## Development Chronicle",
    description: "Quarterly chronicle rendered in the original [repo-saga](https://github.com/teee32/repo-saga) visual style. The slicing is now produced directly by repo-saga itself with quarter granularity.",
    refreshedWorkingTree: (date) => `Last refreshed from the working tree on ${date}.`,
    refreshedRelease: (tag, date) => `Last refreshed for release tag \`${tag}\` on ${date}.`,
    latestCommitDate: (date) => `Latest commit date: ${date}.`,
  },
  es: {
    heading: "## Crónica De Desarrollo",
    description: "Esta crónica trimestral conserva el estilo visual original de [repo-saga](https://github.com/teee32/repo-saga); ahora el propio repo-saga genera la división trimestral.",
    refreshedWorkingTree: (date) => `Actualizado por última vez desde el árbol de trabajo el ${date}.`,
    refreshedRelease: (tag, date) => `Actualizado por última vez para la etiqueta de lanzamiento \`${tag}\` el ${date}.`,
    latestCommitDate: (date) => `Fecha del commit más reciente: ${date}.`,
  },
  fi: {
    heading: "## Kehityskronikka",
    description: "Tämä neljännesvuosittainen kronikka säilyttää [repo-saga](https://github.com/teee32/repo-saga)-projektin alkuperäisen visuaalisen tyylin; repo-saga tuottaa nyt neljännesjaon suoraan itse.",
    refreshedWorkingTree: (date) => `Päivitetty viimeksi nykyisestä työhakemistosta ${date}.`,
    refreshedRelease: (tag, date) => `Päivitetty viimeksi julkaisutägille \`${tag}\` ${date}.`,
    latestCommitDate: (date) => `Viimeisimmän commitin päivämäärä: ${date}.`,
  },
  fr: {
    heading: "## Chronique Du Développement",
    description: "Cette chronique trimestrielle conserve le style visuel original de [repo-saga](https://github.com/teee32/repo-saga) ; le découpage trimestriel est désormais produit directement par repo-saga.",
    refreshedWorkingTree: (date) => `Dernière actualisation depuis l’arbre de travail le ${date}.`,
    refreshedRelease: (tag, date) => `Dernière actualisation pour le tag de publication \`${tag}\` le ${date}.`,
    latestCommitDate: (date) => `Date du dernier commit : ${date}.`,
  },
  he: {
    heading: "## כרוניקת הפיתוח",
    description: "הכרוניקה הרבעונית הזו שומרת על הסגנון החזותי המקורי של [repo-saga](https://github.com/teee32/repo-saga); כעת repo-saga עצמו מייצר את החלוקה לרבעונים.",
    refreshedWorkingTree: (date) => `רוענן לאחרונה מעץ העבודה בתאריך ${date}.`,
    refreshedRelease: (tag, date) => `רוענן לאחרונה עבור תג השחרור \`${tag}\` בתאריך ${date}.`,
    latestCommitDate: (date) => `תאריך הקומיט האחרון: ${date}.`,
  },
  hi: {
    heading: "## विकास कालक्रम",
    description: "यह त्रैमासिक कालक्रम [repo-saga](https://github.com/teee32/repo-saga) की मूल दृश्य शैली को बनाए रखता है; अब तिमाही विभाजन सीधे repo-saga स्वयं उत्पन्न करता है।",
    refreshedWorkingTree: (date) => `इसे ${date} को वर्तमान वर्किंग ट्री से अंतिम बार रीफ़्रेश किया गया।`,
    refreshedRelease: (tag, date) => `इसे रिलीज़ टैग \`${tag}\` के लिए ${date} को अंतिम बार रीफ़्रेश किया गया।`,
    latestCommitDate: (date) => `नवीनतम कमिट तिथि: ${date}।`,
  },
  hu: {
    heading: "## Fejlesztési Krónika",
    description: "Ez a negyedéves krónika megőrzi a [repo-saga](https://github.com/teee32/repo-saga) eredeti vizuális stílusát; a negyedéves felosztást most már maga a repo-saga állítja elő.",
    refreshedWorkingTree: (date) => `Utoljára a jelenlegi munkafából frissítve: ${date}.`,
    refreshedRelease: (tag, date) => `Utoljára a(z) \`${tag}\` kiadási címkéhez frissítve: ${date}.`,
    latestCommitDate: (date) => `A legutóbbi commit dátuma: ${date}.`,
  },
  id: {
    heading: "## Kronik Pengembangan",
    description: "Kronik triwulanan ini mempertahankan gaya visual asli [repo-saga](https://github.com/teee32/repo-saga); pembagian triwulan kini dihasilkan langsung oleh repo-saga itu sendiri.",
    refreshedWorkingTree: (date) => `Terakhir diperbarui dari salinan kerja saat ini pada ${date}.`,
    refreshedRelease: (tag, date) => `Terakhir diperbarui untuk tag rilis \`${tag}\` pada ${date}.`,
    latestCommitDate: (date) => `Tanggal commit terbaru: ${date}.`,
  },
  it: {
    heading: "## Cronaca Dello Sviluppo",
    description: "Questa cronaca trimestrale mantiene lo stile visivo originale di [repo-saga](https://github.com/teee32/repo-saga); ora è repo-saga stesso a generare direttamente la suddivisione per trimestre.",
    refreshedWorkingTree: (date) => `Aggiornato l'ultima volta dall'albero di lavoro il ${date}.`,
    refreshedRelease: (tag, date) => `Aggiornato l'ultima volta per il tag di rilascio \`${tag}\` il ${date}.`,
    latestCommitDate: (date) => `Data dell'ultimo commit: ${date}.`,
  },
  ja: {
    heading: "## 開発クロニクル",
    description: "この四半期クロニクルは [repo-saga](https://github.com/teee32/repo-saga) の元のビジュアルスタイルを保ちつつ、四半期分割そのものを repo-saga が直接生成します。",
    refreshedWorkingTree: (date) => `${date} に現在のワーキングツリーから最新更新しました。`,
    refreshedRelease: (tag, date) => `リリースタグ \`${tag}\` 向けに ${date} に最新更新しました。`,
    latestCommitDate: (date) => `最新コミット日: ${date}。`,
  },
  ko: {
    heading: "## 개발 연대기",
    description: "이 분기별 연대기는 [repo-saga](https://github.com/teee32/repo-saga)의 원래 시각 스타일을 유지하며, 분기 단위 분할도 이제 repo-saga 자체가 직접 생성합니다.",
    refreshedWorkingTree: (date) => `${date}에 현재 작업 트리 기준으로 마지막 새로고침을 완료했습니다.`,
    refreshedRelease: (tag, date) => `릴리스 태그 \`${tag}\` 기준으로 ${date}에 마지막 새로고침을 완료했습니다.`,
    latestCommitDate: (date) => `최신 커밋 날짜: ${date}.`,
  },
  ms: {
    heading: "## Kronik Pembangunan",
    description: "Kronik suku tahunan ini mengekalkan gaya visual asal [repo-saga](https://github.com/teee32/repo-saga); pembahagian suku kini dijana terus oleh repo-saga sendiri.",
    refreshedWorkingTree: (date) => `Kali terakhir disegarkan daripada salinan kerja semasa pada ${date}.`,
    refreshedRelease: (tag, date) => `Kali terakhir disegarkan untuk tag keluaran \`${tag}\` pada ${date}.`,
    latestCommitDate: (date) => `Tarikh commit terkini: ${date}.`,
  },
  nl: {
    heading: "## Ontwikkelingskroniek",
    description: "Deze kwartaalchroniek behoudt de oorspronkelijke visuele stijl van [repo-saga](https://github.com/teee32/repo-saga); de kwartaalindeling wordt nu rechtstreeks door repo-saga zelf gegenereerd.",
    refreshedWorkingTree: (date) => `Laatst vernieuwd vanuit de werkboom op ${date}.`,
    refreshedRelease: (tag, date) => `Laatst vernieuwd voor releasetag \`${tag}\` op ${date}.`,
    latestCommitDate: (date) => `Datum van de laatste commit: ${date}.`,
  },
  no: {
    heading: "## Utviklingskrønike",
    description: "Denne kvartalsvise krøniken bevarer den opprinnelige visuelle stilen fra [repo-saga](https://github.com/teee32/repo-saga); kvartalsinndelingen genereres nå direkte av repo-saga selv.",
    refreshedWorkingTree: (date) => `Sist oppdatert fra gjeldende arbeidstre ${date}.`,
    refreshedRelease: (tag, date) => `Sist oppdatert for utgivelsestaggen \`${tag}\` ${date}.`,
    latestCommitDate: (date) => `Dato for siste commit: ${date}.`,
  },
  pl: {
    heading: "## Kronika Rozwoju",
    description: "Ta kwartalna kronika zachowuje oryginalny styl wizualny [repo-saga](https://github.com/teee32/repo-saga); podział kwartalny jest teraz generowany bezpośrednio przez samo repo-saga.",
    refreshedWorkingTree: (date) => `Ostatnio odświeżono z bieżącego drzewa roboczego: ${date}.`,
    refreshedRelease: (tag, date) => `Ostatnio odświeżono dla tagu wydania \`${tag}\`: ${date}.`,
    latestCommitDate: (date) => `Data ostatniego commita: ${date}.`,
  },
  pt: {
    heading: "## Crônica De Desenvolvimento",
    description: "Esta crônica trimestral preserva o estilo visual original do [repo-saga](https://github.com/teee32/repo-saga); agora é o próprio repo-saga que gera a divisão trimestral.",
    refreshedWorkingTree: (date) => `Atualizado pela última vez a partir da árvore de trabalho em ${date}.`,
    refreshedRelease: (tag, date) => `Atualizado pela última vez para a tag de release \`${tag}\` em ${date}.`,
    latestCommitDate: (date) => `Data do commit mais recente: ${date}.`,
  },
  ro: {
    heading: "## Cronica Dezvoltării",
    description: "Această cronică trimestrială păstrează stilul vizual original al [repo-saga](https://github.com/teee32/repo-saga); împărțirea trimestrială este acum generată direct de repo-saga însuși.",
    refreshedWorkingTree: (date) => `Actualizat ultima dată din arborele de lucru la ${date}.`,
    refreshedRelease: (tag, date) => `Actualizat ultima dată pentru tagul de release \`${tag}\` la ${date}.`,
    latestCommitDate: (date) => `Data ultimului commit: ${date}.`,
  },
  ru: {
    heading: "## Хроника Развития",
    description: "Эта квартальная хроника сохраняет исходный визуальный стиль [repo-saga](https://github.com/teee32/repo-saga); квартальное разбиение теперь создаётся самим repo-saga напрямую.",
    refreshedWorkingTree: (date) => `Последнее обновление из текущего рабочего дерева: ${date}.`,
    refreshedRelease: (tag, date) => `Последнее обновление для тега релиза \`${tag}\`: ${date}.`,
    latestCommitDate: (date) => `Дата последнего коммита: ${date}.`,
  },
  sv: {
    heading: "## Utvecklingskrönika",
    description: "Den här kvartalskronikan behåller den ursprungliga visuella stilen från [repo-saga](https://github.com/teee32/repo-saga); kvartalsindelningen genereras nu direkt av repo-saga självt.",
    refreshedWorkingTree: (date) => `Senast uppdaterad från det aktuella arbetsträdet den ${date}.`,
    refreshedRelease: (tag, date) => `Senast uppdaterad för release-taggen \`${tag}\` den ${date}.`,
    latestCommitDate: (date) => `Datum för senaste commit: ${date}.`,
  },
  th: {
    heading: "## พงศาวดารการพัฒนา",
    description: "พงศาวดารรายไตรมาสนี้คงสไตล์ภาพต้นฉบับของ [repo-saga](https://github.com/teee32/repo-saga) ไว้ และตอนนี้ repo-saga จะสร้างการแบ่งรายไตรมาสโดยตรงเอง",
    refreshedWorkingTree: (date) => `รีเฟรชล่าสุดจากชุดไฟล์ทำงานปัจจุบันเมื่อ ${date}`,
    refreshedRelease: (tag, date) => `รีเฟรชล่าสุดสำหรับแท็กรุ่น \`${tag}\` เมื่อ ${date}`,
    latestCommitDate: (date) => `วันที่คอมมิตล่าสุด: ${date}`,
  },
  tr: {
    heading: "## Gelişim Kroniği",
    description: "Bu üç aylık kronik, [repo-saga](https://github.com/teee32/repo-saga) özgün görsel stilini korur; çeyreklik dilimleme artık doğrudan repo-saga tarafından üretilir.",
    refreshedWorkingTree: (date) => `Çalışma ağacından son yenileme tarihi: ${date}.`,
    refreshedRelease: (tag, date) => `\`${tag}\` sürüm etiketi için son yenileme tarihi: ${date}.`,
    latestCommitDate: (date) => `En son commit tarihi: ${date}.`,
  },
  uk: {
    heading: "## Хроніка Розвитку",
    description: "Ця квартальна хроніка зберігає оригінальний візуальний стиль [repo-saga](https://github.com/teee32/repo-saga); квартальний поділ тепер генерує сам repo-saga напряму.",
    refreshedWorkingTree: (date) => `Востаннє оновлено з поточного робочого дерева: ${date}.`,
    refreshedRelease: (tag, date) => `Востаннє оновлено для тега релізу \`${tag}\`: ${date}.`,
    latestCommitDate: (date) => `Дата останнього коміту: ${date}.`,
  },
  vi: {
    heading: "## Biên Niên Sử Phát Triển",
    description: "Biên niên sử theo quý này giữ nguyên phong cách hình ảnh gốc của [repo-saga](https://github.com/teee32/repo-saga); việc chia theo quý nay do chính repo-saga tạo trực tiếp.",
    refreshedWorkingTree: (date) => `Lần làm mới gần nhất từ bản làm việc hiện tại vào ${date}.`,
    refreshedRelease: (tag, date) => `Lần làm mới gần nhất cho thẻ phát hành \`${tag}\` vào ${date}.`,
    latestCommitDate: (date) => `Ngày commit mới nhất: ${date}.`,
  },
  zh: {
    heading: "## 发展编年史",
    description: "这个季度版编年史保留了 [repo-saga](https://github.com/teee32/repo-saga) 的原始视觉样式，而且季度切分现在直接由 repo-saga 自身生成。",
    refreshedWorkingTree: (date) => `最近一次已于 ${date} 基于当前工作树刷新。`,
    refreshedRelease: (tag, date) => `最近一次已针对发布 tag \`${tag}\` 于 ${date} 刷新。`,
    latestCommitDate: (date) => `最新提交日期：${date}。`,
  },
  zh_Hant: {
    heading: "## 發展編年史",
    description: "這個季度版編年史保留了 [repo-saga](https://github.com/teee32/repo-saga) 的原始視覺樣式，而且季度切分現在直接由 repo-saga 自身生成。",
    refreshedWorkingTree: (date) => `最近一次已於 ${date} 基於目前工作樹刷新。`,
    refreshedRelease: (tag, date) => `最近一次已針對發佈 tag \`${tag}\` 於 ${date} 刷新。`,
    latestCommitDate: (date) => `最新提交日期：${date}。`,
  },
};

const argv = process.argv.slice(2);
const cliOptions = parseArgs(argv);
const releaseTag = cliOptions.tag ?? "";
const writeReadmes = !cliOptions.noReadme;
const releaseRepoSagaExecutionLock = acquireRepoSagaExecutionLock(repoSagaExecutionLockPath);

try {
  cleanupLegacyArtifacts();
  await ensureRepoSagaTool();
  if (cliOptions.syncOnly) {
    console.log("Synchronized repo-saga integration cache only.");
  } else {
    fs.mkdirSync(outputDir, { recursive: true });

    const rootReadmes = getProjectReadmes();
    const locales = [...new Set(rootReadmes.map((readme) => readme.locale))];
    fs.rmSync(buildRoot, { recursive: true, force: true });
    fs.mkdirSync(buildRoot, { recursive: true });

    let latestCommitDate = currentIsoDate();
    for (const locale of locales) {
      const buildDir = path.join(buildRoot, locale);
      fs.mkdirSync(buildDir, { recursive: true });
      runRepoSagaCli(locale, buildDir);

      const localizedSvgPath = svgPathForLocale(locale);
      fs.copyFileSync(path.join(buildDir, "saga.svg"), localizedSvgPath);

      if (locale === "en") {
        fs.copyFileSync(localizedSvgPath, path.join(outputDir, "notemd-development-history.svg"));
        const sagaJson = JSON.parse(fs.readFileSync(path.join(buildDir, "saga.json"), "utf8"));
        latestCommitDate = String(sagaJson.repo?.lastCommitDate ?? "").slice(0, 10) || latestCommitDate;
      }
    }

    normalizeRepoSagaContributorCounts(locales);

    if (writeReadmes) {
      for (const readme of rootReadmes) {
        updateReadme(
          readme.filePath,
          buildLocalizedReadmeBlock({
            locale: readme.locale,
            releaseTag,
            latestCommitDate,
          }),
        );
      }
    }

    fs.rmSync(buildRoot, { recursive: true, force: true });

    console.log(`Updated repo-saga chronicle SVGs in ${path.relative(repoRoot, outputDir)}`);
    if (writeReadmes) {
      console.log("Updated README chronicle sections above Star History.");
    }
  }
} finally {
  releaseRepoSagaExecutionLock();
}

function parseArgs(args) {
  const options = { noReadme: false, syncOnly: false, tag: "" };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--no-readme") {
      options.noReadme = true;
      continue;
    }
    if (token === "--sync-only") {
      options.syncOnly = true;
      continue;
    }
    if (token === "--tag") {
      const nextValue = args[index + 1];
      if (!nextValue || nextValue.startsWith("--")) {
        throw new Error("Missing value for --tag");
      }
      options.tag = nextValue;
      index += 1;
      continue;
    }
    if (token.startsWith("--tag=")) {
      const [, nextValue] = token.split("=", 2);
      if (!nextValue) {
        throw new Error("Missing value for --tag");
      }
      options.tag = nextValue;
      continue;
    }
    if (token.startsWith("--")) {
      throw new Error(`Unknown option "${token}"`);
    }
  }
  return options;
}

async function ensureRepoSagaTool() {
  const cliDist = path.join(upstreamRoot, "packages", "cli", "dist", "index.js");
  const sourceStates = repoSagaSources.map((source) => ensureSourceRepo(source));
  const nextStamp = JSON.stringify(
    {
      integrationVersion: repoSagaIntegrationVersion,
      sources: sourceStates,
    },
    null,
    2,
  );
  if (fs.existsSync(cliDist) && fs.existsSync(repoSagaIntegrationStamp)) {
    const currentStamp = fs.readFileSync(repoSagaIntegrationStamp, "utf8");
    if (currentStamp === nextStamp) {
      return;
    }
  }

  rebuildRepoSagaIntegration(sourceStates);
  fs.writeFileSync(repoSagaIntegrationStamp, nextStamp, "utf8");
}

function cleanupLegacyArtifacts() {
  for (const legacyPath of [legacyTempToolRoot, legacyDocsBuildRoot]) {
    if (fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { recursive: true, force: true });
    }
  }
}

function ensureSourceRepo(source) {
  fs.mkdirSync(path.dirname(source.root), { recursive: true });
  clearRepoSagaGitLocks(source.root);
  if (!fs.existsSync(path.join(source.root, ".git"))) {
    recloneSourceRepo(source);
  } else {
    try {
      runCommand("git", ["fetch", "origin", source.branch, "--depth", "1"], source.root);
      runCommand("git", ["checkout", source.branch], source.root);
      runCommand("git", ["pull", "--ff-only", "origin", source.branch], source.root);
    } catch (error) {
      console.warn(
        `Rebuilding cached repo-saga source ${source.label} after a non-fast-forward or stale local state.`,
      );
      recloneSourceRepo(source);
    }
  }

  return {
    label: source.label,
    branch: source.branch,
    repoUrl: source.repoUrl,
    commit: captureCommand("git", ["rev-parse", "HEAD"], source.root),
  };
}

function recloneSourceRepo(source) {
  assertWithinRepoSagaCacheRoot(source.root);
  fs.rmSync(source.root, { recursive: true, force: true });
  runCommand("git", ["clone", "--depth", "1", "--branch", source.branch, source.repoUrl, source.root], repoRoot);
}

function rebuildRepoSagaIntegration(sourceStates) {
  const granularitySource = repoSagaSources.find((source) => source.label === "timeline-granularity");
  const localeSource = repoSagaSources.find((source) => source.label === "locale-i18n");
  if (!granularitySource || !localeSource) {
    throw new Error("Missing repo-saga source definitions.");
  }

  fs.rmSync(upstreamRoot, { recursive: true, force: true });
  copyRepoSagaTree(granularitySource.root, upstreamRoot);
  overlayLocaleScope(localeSource.root, upstreamRoot);
  mergeCliLocaleSupport(localeSource.root, upstreamRoot);

  runPnpmCommand(["install"], upstreamRoot);
  runPnpmCommand(["run", "build"], upstreamRoot);
  console.log(
    `Prepared repo-saga integration cache from ${sourceStates
      .map((state) => `${state.label}@${state.commit.slice(0, 7)}`)
      .join(" + ")}`,
  );
}

function copyRepoSagaTree(sourceRoot, targetRoot) {
  fs.mkdirSync(targetRoot, { recursive: true });
  fs.cpSync(sourceRoot, targetRoot, {
    recursive: true,
    filter: (currentPath) => shouldCopyRepoSagaPath(sourceRoot, currentPath),
  });
}

function overlayLocaleScope(sourceRoot, targetRoot) {
  for (const relativeFile of localeOverlayFiles) {
    const sourceFile = path.join(sourceRoot, relativeFile);
    const targetFile = path.join(targetRoot, relativeFile);
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.copyFileSync(sourceFile, targetFile);
  }
}

function mergeCliLocaleSupport(sourceRoot, targetRoot) {
  const validLangPattern = /const VALID_LANGS: Lang\[] = \[[\s\S]*?\];/;
  const localeCliSource = fs.readFileSync(path.join(sourceRoot, "packages", "cli", "src", "index.ts"), "utf8");
  const localeValidLangBlock = localeCliSource.match(validLangPattern)?.[0];
  if (!localeValidLangBlock) {
    throw new Error("Could not locate VALID_LANGS block in repo-saga locale branch.");
  }

  const targetCliPath = path.join(targetRoot, "packages", "cli", "src", "index.ts");
  const integrationCliSource = fs.readFileSync(targetCliPath, "utf8");
  if (!validLangPattern.test(integrationCliSource)) {
    throw new Error("Could not locate VALID_LANGS block in repo-saga integration CLI.");
  }

  const mergedCliSource = integrationCliSource.replace(validLangPattern, localeValidLangBlock);
  fs.writeFileSync(targetCliPath, mergedCliSource, "utf8");
}

function shouldCopyRepoSagaPath(sourceRoot, currentPath) {
  const relativePath = path.relative(sourceRoot, currentPath);
  if (!relativePath) {
    return true;
  }
  const parts = relativePath.split(path.sep);
  return !parts.some((part) => part === ".git" || part === ".worktrees" || part === "node_modules" || part === "dist");
}

function runRepoSagaCli(locale, outDir) {
  const cliEntry = path.join(upstreamRoot, "packages", "cli", "dist", "index.js");
  runCommand(
    "node",
    [
      cliEntry,
      repoSagaSourceInput,
      "--out",
      outDir,
      "--theme",
      "epic",
      "--lang",
      locale,
      "--granularity",
      "quarter",
      "--no-open",
      "--no-server",
    ],
    upstreamRoot,
  );
}

function normalizeRepoSagaContributorCounts(locales) {
  const contributorStats = collectRepoSagaContributorStats();
  const svgPaths = new Set(
    locales.map((locale) => svgPathForLocale(locale)),
  );
  svgPaths.add(path.join(outputDir, "notemd-development-history.svg"));

  for (const svgPath of svgPaths) {
    const currentSvg = fs.readFileSync(svgPath, "utf8");
    const normalizedSvg = rewriteRepoSagaContributorCountsInSvg(currentSvg, contributorStats);
    if (normalizedSvg !== currentSvg) {
      fs.writeFileSync(svgPath, normalizedSvg, "utf8");
    }
  }
}

function collectRepoSagaContributorStats() {
  if (!fs.existsSync(canonicalMailmapPath)) {
    console.warn(`Canonical contributor mailmap not found at ${canonicalMailmapPath}; continuing with email-based human contributor normalization.`);
  }

  const quarterLabels = listCommitQuarterLabels();
  if (!quarterLabels.length) {
    throw new Error("Could not derive any commit quarters for repo-saga contributor normalization.");
  }

  return {
    summary: {
      rangeStartLabel: quarterLabels[0],
      rangeEndLabel: quarterLabels[quarterLabels.length - 1],
      contributorCount: countHumanContributorsForRange(),
      tagCount: countAllTags(),
    },
    quarters: quarterLabels.map((label) => {
      const { since, until } = quarterDateRangeFromLabel(label);
      return {
        label,
        contributorCount: countHumanContributorsForRange(since, until),
      };
    }),
  };
}

function listCommitQuarterLabels() {
  const history = captureCommand("git", ["log", "--date=format:%Y-%m-%d", "--format=%ad", "--reverse", "--all"], repoRoot);
  const labels = [];
  const seen = new Set();

  for (const dateText of history.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)) {
    const label = quarterLabelFromDate(dateText);
    if (label && !seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }

  return labels;
}

function quarterLabelFromDate(dateText) {
  const match = String(dateText).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const quarter = Math.floor(monthIndex / 3) + 1;
  return `${year} Q${quarter}`;
}

function quarterDateRangeFromLabel(label) {
  const match = String(label).match(/^(\d{4}) Q([1-4])$/);
  if (!match) {
    throw new Error(`Invalid quarter label: ${label}`);
  }

  const year = Number(match[1]);
  const quarterIndex = Number(match[2]) - 1;
  const startMonthIndex = quarterIndex * 3;
  const endMonthIndex = startMonthIndex + 2;

  const since = new Date(Date.UTC(year, startMonthIndex, 1));
  const until = new Date(Date.UTC(year, endMonthIndex + 1, 0));

  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

function countHumanContributorsForRange(since, until) {
  const args = ["log", "--format=%aN <%aE>", "--all"];
  if (since) {
    args.push(`--since=${since}`);
  }
  if (until) {
    args.push(`--until=${until}`);
  }

  return countCanonicalHumanContributorsFromIdentityLines(captureCommand("git", args, repoRoot));
}

function countAllTags() {
  const tags = captureCommand("git", ["tag", "--list"], repoRoot);
  if (!tags) {
    return 0;
  }
  return tags.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length;
}

function runCommand(command, args, cwd, options = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: options.env ?? process.env,
  });
}

function captureCommand(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
  }).trim();
}

function runPnpmCommand(args, cwd) {
  let lastError = null;
  for (const candidate of packageManagerCandidates()) {
    if (!commandExists(candidate.command, candidate.versionArgs)) {
      continue;
    }
    const runtime = buildPackageManagerRuntime(candidate, cwd);
    try {
      runCommand(candidate.command, [...candidate.prefix, ...args], cwd, { env: runtime.env });
      return;
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        `Package manager candidate ${candidate.command} failed while running ${args.join(" ")}; trying next fallback. Error: ${errorMessage}`,
      );
    }
  }
  if (lastError) {
    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(
      `Could not execute repo-saga build command "${args.join(" ")}" with any package manager fallback. Last error: ${message}`,
    );
  }
  throw new Error("Could not find pnpm, corepack, or bun to build repo-saga integration cache.");
}

function commandExists(command, args) {
  try {
    execFileSync(command, args, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function clearRepoSagaGitLocks(repoPath) {
  const gitDir = path.join(repoPath, ".git");
  if (!fs.existsSync(gitDir)) {
    return;
  }
  for (const lockFile of ["index.lock", "packed-refs.lock", "shallow.lock"]) {
    const lockPath = path.join(gitDir, lockFile);
    if (fs.existsSync(lockPath)) {
      fs.rmSync(lockPath, { force: true });
    }
  }
}

function assertWithinRepoSagaCacheRoot(targetPath) {
  const resolvedCacheRoot = path.resolve(repoSagaCacheRoot);
  const resolvedTargetPath = path.resolve(targetPath);
  const relativePath = path.relative(resolvedCacheRoot, resolvedTargetPath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to remove repo-saga cache path outside ${resolvedCacheRoot}: ${resolvedTargetPath}`);
  }
}

function getProjectReadmes() {
  return fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && rootReadmePattern.test(entry.name))
    .map((entry) => {
      const match = entry.name.match(rootReadmePattern);
      const locale = match?.[1] ?? "en";
      return {
        filePath: path.join(repoRoot, entry.name),
        locale,
      };
    })
    .sort((left, right) => left.filePath.localeCompare(right.filePath));
}

function buildLocalizedReadmeBlock({ locale, releaseTag, latestCommitDate }) {
  const copy = chronicleCopyByLocale[locale] ?? chronicleCopyByLocale.en;
  const refreshLabel = releaseTag
    ? copy.refreshedRelease(releaseTag, currentIsoDate())
    : copy.refreshedWorkingTree(currentIsoDate());

  return [
    copy.heading,
    "",
    copy.description,
    "",
    `![Notemd Development Chronicle](${svgMarkdownPathForLocale(locale)})`,
    "",
    `_${refreshLabel} ${copy.latestCommitDate(latestCommitDate)}_`,
  ].join("\n");
}

function updateReadme(filePath, blockContent) {
  const markerStart = "<!-- repo-chronicle:start -->";
  const markerEnd = "<!-- repo-chronicle:end -->";
  const source = fs.readFileSync(filePath, "utf8");
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const replacement = `${markerStart}${newline}${blockContent}${newline}${markerEnd}`;

  let next;
  const markerPattern = new RegExp(`${escapeRegex(markerStart)}[\\s\\S]*?${escapeRegex(markerEnd)}`, "m");
  if (markerPattern.test(source)) {
    next = source.replace(markerPattern, replacement);
  } else {
    const starHistoryPattern = /\n!\[Star History Chart\]\([^)]+\)/;
    if (!starHistoryPattern.test(source)) {
      throw new Error(`Could not find Star History section in ${filePath}`);
    }
    next = source.replace(starHistoryPattern, `${newline}${replacement}${newline}${newline}$&`);
  }

  fs.writeFileSync(filePath, next, "utf8");
}

function svgPathForLocale(locale) {
  return path.join(outputDir, `notemd-development-history.${locale}.svg`);
}

function svgMarkdownPathForLocale(locale) {
  return `./docs/repo-saga/notemd-development-history.${locale}.svg`;
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
