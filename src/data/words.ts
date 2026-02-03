export type Word = {
  id: string;
  hanzi: string;
  pinyin: string;
  english: string;
};

export type UnitId = 1 | 2 | 3;

export const ALL_UNITS: readonly UnitId[] = [1, 2, 3];

export const UNIT1_WRITE_WORDS: Word[] = [
  { id: "yi-one", hanzi: "一", pinyin: "yī", english: "one" },
  { id: "er-two", hanzi: "二", pinyin: "èr", english: "two" },
  { id: "san-three", hanzi: "三", pinyin: "sān", english: "three" },
  { id: "si-four", hanzi: "四", pinyin: "sì", english: "four" },
  { id: "wu-five", hanzi: "五", pinyin: "wǔ", english: "five" },
  { id: "liu-six", hanzi: "六", pinyin: "liù", english: "six" },
  { id: "qi-seven", hanzi: "七", pinyin: "qī", english: "seven" },
  { id: "ba-eight", hanzi: "八", pinyin: "bā", english: "eight" },
  { id: "jiu-nine", hanzi: "九", pinyin: "jiǔ", english: "nine" },
  { id: "shi-ten", hanzi: "十", pinyin: "shí", english: "ten" },
  { id: "baba-dad", hanzi: "爸爸", pinyin: "bàba", english: "dad" },
  { id: "mama-mom", hanzi: "妈妈", pinyin: "māma", english: "mom" },
  { id: "ren-person", hanzi: "人", pinyin: "rén", english: "person" },
  { id: "ri-sun", hanzi: "日", pinyin: "rì", english: "sun" },
  { id: "yue-moon", hanzi: "月", pinyin: "yuè", english: "moon" },
  { id: "ban-half", hanzi: "半", pinyin: "bàn", english: "half" },
];

export const UNIT1_READ_ONLY_WORDS: Word[] = [
  { id: "xia-down", hanzi: "下", pinyin: "xià", english: "down" },
  { id: "da-big", hanzi: "大", pinyin: "dà", english: "big" },
  { id: "xiao-small", hanzi: "小", pinyin: "xiǎo", english: "small" },
  { id: "gege-older-brother", hanzi: "哥哥", pinyin: "gēge", english: "older brother" },
  { id: "jiejie-older-sister", hanzi: "姐姐", pinyin: "jiějie", english: "older sister" },
  { id: "didi-younger-brother", hanzi: "弟弟", pinyin: "dìdi", english: "younger brother" },
  { id: "meimei-younger-sister", hanzi: "妹妹", pinyin: "mèimei", english: "younger sister" },
  { id: "yeye-grandpa-dad", hanzi: "爷爷", pinyin: "yéye", english: "grandpa (dad's side)" },
  { id: "nainai-grandma-dad", hanzi: "奶奶", pinyin: "nǎinai", english: "grandma (dad's side)" },
  { id: "waigong-grandpa-mom", hanzi: "外公", pinyin: "wàigōng", english: "grandpa (mom's side)" },
  { id: "waipo-grandma-mom", hanzi: "外婆", pinyin: "wàipó", english: "grandma (mom's side)" },
];

export const UNIT2_WRITE_WORDS: Word[] = [
  { id: "xi-west", hanzi: "西", pinyin: "xī", english: "west" },
  { id: "jia-home", hanzi: "家", pinyin: "jiā", english: "home" },
  { id: "wo-i", hanzi: "我", pinyin: "wǒ", english: "I" },
  { id: "de-of", hanzi: "的", pinyin: "de", english: "of / 's" },
  { id: "nv-woman", hanzi: "女", pinyin: "nǚ", english: "woman" },
  { id: "kou-mouth", hanzi: "口", pinyin: "kǒu", english: "mouth" },
  { id: "qu-go", hanzi: "去", pinyin: "qù", english: "go" },
  { id: "zi-child", hanzi: "子", pinyin: "zǐ", english: "child (depends on context)" },
  { id: "zhi-only", hanzi: "只", pinyin: "zhǐ", english: "only / measure word" },
  { id: "chang-long", hanzi: "长", pinyin: "cháng", english: "long" },
  { id: "fang-square", hanzi: "方", pinyin: "fāng", english: "square" },
  { id: "zai-at", hanzi: "在", pinyin: "zài", english: "at" },
  { id: "le-already", hanzi: "了", pinyin: "le", english: "already" },
];

export const UNIT2_READ_ONLY_WORDS: Word[] = [
  { id: "dong-east", hanzi: "东", pinyin: "dōng", english: "east" },
  { id: "nan-south", hanzi: "南", pinyin: "nán", english: "south" },
  { id: "bei-north", hanzi: "北", pinyin: "běi", english: "north" },
  { id: "bao-treasure", hanzi: "宝", pinyin: "bǎo", english: "treasure" },
  { id: "shui-water", hanzi: "水", pinyin: "shuǐ", english: "water" },
  { id: "zuo-left", hanzi: "左", pinyin: "zuǒ", english: "left" },
  { id: "you-right", hanzi: "右", pinyin: "yòu", english: "right" },
  { id: "niao-bird", hanzi: "鸟", pinyin: "niǎo", english: "bird" },
  { id: "shou-hand", hanzi: "手", pinyin: "shǒu", english: "hand" },
  { id: "tian-sky", hanzi: "天", pinyin: "tiān", english: "sky" },
  { id: "xing-shape", hanzi: "形", pinyin: "xíng", english: "shape" },
  { id: "fang-house", hanzi: "房", pinyin: "fáng", english: "house" },
  { id: "wen-writing", hanzi: "文", pinyin: "wén", english: "writing (depends on context)" },
  { id: "dong-winter", hanzi: "冬", pinyin: "dōng", english: "winter" },
];

export const UNIT3_WRITE_WORDS: Word[] = [
  { id: "tu-soil", hanzi: "土", pinyin: "tǔ", english: "soil" },
  { id: "ge-unit", hanzi: "个", pinyin: "gè", english: "unit / measure word" },
  { id: "gong-public", hanzi: "公", pinyin: "gōng", english: "public" },
  { id: "la-trash", hanzi: "垃", pinyin: "lā", english: "trash (la)" },
  { id: "ji-trash", hanzi: "圾", pinyin: "jī", english: "trash (ji)" },
  { id: "xue-study", hanzi: "学", pinyin: "xué", english: "study" },
  { id: "ma-horse", hanzi: "马", pinyin: "mǎ", english: "horse" },
  { id: "nian-year", hanzi: "年", pinyin: "nián", english: "year" },
  { id: "fu-fortune", hanzi: "福", pinyin: "fú", english: "good fortune" },
  { id: "hui-return", hanzi: "回", pinyin: "huí", english: "return" },
  { id: "ni-you", hanzi: "你", pinyin: "nǐ", english: "you" },
  { id: "ke-can", hanzi: "可", pinyin: "kě", english: "can / but" },
];

export const UNIT3_READ_ONLY_WORDS: Word[] = [
  { id: "li-inside", hanzi: "里", pinyin: "lǐ", english: "inside" },
  { id: "sheng-life", hanzi: "生", pinyin: "shēng", english: "life / born" },
  { id: "hong-red", hanzi: "红", pinyin: "hóng", english: "red" },
  { id: "hei-black", hanzi: "黑", pinyin: "hēi", english: "black" },
  { id: "shou-receive", hanzi: "收", pinyin: "shōu", english: "receive" },
  { id: "lv-green", hanzi: "绿", pinyin: "lǜ", english: "green" },
  { id: "yu-fish", hanzi: "鱼", pinyin: "yú", english: "fish" },
  { id: "zhu-wish", hanzi: "祝", pinyin: "zhù", english: "wish / congratulate" },
];

export const READ_WORDS_BY_UNIT: Record<UnitId, Word[]> = {
  1: [...UNIT1_WRITE_WORDS, ...UNIT1_READ_ONLY_WORDS],
  2: [...UNIT2_WRITE_WORDS, ...UNIT2_READ_ONLY_WORDS],
  3: [...UNIT3_WRITE_WORDS, ...UNIT3_READ_ONLY_WORDS],
};

export const WRITE_WORDS_BY_UNIT: Record<UnitId, Word[]> = {
  1: UNIT1_WRITE_WORDS,
  2: UNIT2_WRITE_WORDS,
  3: UNIT3_WRITE_WORDS,
};

function uniqueById(words: Word[]): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  for (const word of words) {
    if (seen.has(word.id)) continue;
    seen.add(word.id);
    out.push(word);
  }
  return out;
}

export function getReadWordsForUnits(units: readonly UnitId[]): Word[] {
  return uniqueById(units.flatMap((unit) => READ_WORDS_BY_UNIT[unit]));
}

export function getWriteWordsForUnits(units: readonly UnitId[]): Word[] {
  return uniqueById(units.flatMap((unit) => WRITE_WORDS_BY_UNIT[unit]));
}

export const WORDS: Word[] = uniqueById([
  ...READ_WORDS_BY_UNIT[1],
  ...READ_WORDS_BY_UNIT[2],
  ...READ_WORDS_BY_UNIT[3],
]);
