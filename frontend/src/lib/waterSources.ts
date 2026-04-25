// Water sources (river basins) — loaded from /dashboard/LargeRiverBasins.geojson
export type WaterSource = {
  /** Internal id used for filtering (English name, lowercased, no spaces) */
  id: string;
  /** Display label */
  label: string;
  /** Original English property */
  nameEn: string;
  /** Original Bulgarian property */
  nameBg: string;
};

let cache: WaterSource[] | null = null;

function toId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((p) => (/^[a-z]/.test(p) ? p[0].toUpperCase() + p.slice(1) : p))
    .join("");
}

// Hardcoded fallback list extracted from LargeRiverBasins.geojson.
// Used if the 6.8MB geojson fails to fetch (sandbox / offline / large file).
const FALLBACK: Array<[string, string]> = [
  ["AHELOY", "Ахелой"], ["ARCHAR", "Арчар"], ["ARDA", "Арда"],
  ["ATERINSKA", "Атеринска"], ["AYTOSKA", "Айтоска"], ["AZMAK", "Азмак"],
  ["BATOVSKA", "Батовска"], ["BYALA REKA", "Бяла река"],
  ["CHUKARSKA", "Чукарска"], ["DANUBE", "Дунав"], ["DERMENDERE", "Дермендере"],
  ["DOSPAT", "Доспат"], ["DRASHTELA", "Дращела"], ["DVOYNITSA", "Двойница"],
  ["DYAVOLSKA", "Дяволска"], ["ERMA", "Ерма"], ["FAKIYSKA", "Факийска"],
  ["FANDAKLIYSKA", "Фандъклийска"], ["GABERSKA", "Габерска"],
  ["HADZHIDERE", "Хаджидере"], ["ISKAR", "Искър"], ["IZVORSKA", "Изворска"],
  ["KAMCHIA", "Камчия"], ["KANAGIOL", "Канагьол"], ["KARAAGACH", "Караагач"],
  ["KARABASHKA REKA", "Карабашка река"], ["KURBARDERE", "Курбардере"],
  ["LISOVO DERE", "Лисово дере"], ["LOM", "Лом"], ["MARINKA", "Маринка"],
  ["MARITSA", "Марица"], ["MESTA", "Места"], ["NISHAVA", "Нишава"],
  ["OGOSTA", "Огоста"], ["OSAM", "Осъм"], ["OTMANLI", "Отмънли"],
  ["PANAIRDERE", "Панаирдере"], ["PROVADIYSKA", "Провадийска"],
  ["REZOVSKA REKA", "Резовска река"], ["ROPOTAMO", "Ропотамо"],
  ["RUSENSKI LOM", "Русенски Лом"], ["RUSOKASTRENSKA", "Русокастренска"],
  ["SENKOVETS", "Сенковец"], ["SILISTAR", "Силистар"], ["SKOMLYA", "Скомля"],
  ["SPRING-CHERNO MORE", "Извор-Черно море"], ["SPRING-DANUBE", "Извор-Дунав"],
  ["SREDETSKA", "Средецка"], ["STRUMA", "Струма"], ["SUHA REKA", "Суха река"],
  ["TIMOK", "Тимок"], ["TOPOLOVETS", "Тополовец"], ["TSARATSAR", "Царацар"],
  ["TSIBRITSA", "Цибрица"], ["TUNDZHA", "Тунджа"], ["VAYA", "Вая"],
  ["VELEKA", "Велека"], ["VIDBOL", "Видбол"], ["VISOCHKA", "Височка"],
  ["VIT", "Вит"], ["VOYNISHKA", "Войнишка"], ["YANTRA", "Янтра"],
];

function fromPairs(pairs: Array<[string, string]>): WaterSource[] {
  const seen = new Set<string>();
  const list: WaterSource[] = [];
  for (const [en, bg] of pairs) {
    const id = toId(en);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    list.push({ id, label: titleCase(en), nameEn: en, nameBg: bg });
  }
  list.sort((a, b) => a.label.localeCompare(b.label));
  return list;
}

export async function loadWaterSources(): Promise<WaterSource[]> {
  if (cache) return cache;
  try {
    const res = await fetch("/dashboard/LargeRiverBasins.geojson");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const pairs: Array<[string, string]> = [];
    for (const f of json.features ?? []) {
      const en = (f.properties?.Name_en ?? "").trim();
      const bg = (f.properties?.Name_bg ?? "").trim();
      if (en) pairs.push([en, bg]);
    }
    cache = pairs.length ? fromPairs(pairs) : fromPairs(FALLBACK);
    return cache;
  } catch (e) {
    console.warn("Falling back to embedded water source list:", e);
    cache = fromPairs(FALLBACK);
    return cache;
  }
}

export const ISKAR_ID = "iskar";
