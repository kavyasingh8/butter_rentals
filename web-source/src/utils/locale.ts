import en from '../../../locales/en.json';

export type LocaleKey = keyof typeof en.ui;

const fallback: Record<string, string> = en.ui;
let strings: Record<string, string> = fallback;

/** Applies the strings sent by the game. Missing or invalid entries keep the English text. */
export const setLocale = (dict: unknown) => {
  if (!dict || typeof dict !== 'object') return;

  const next: Record<string, string> = { ...fallback };
  for (const [key, value] of Object.entries(dict)) {
    if (typeof value === 'string') next[key] = value;
  }
  strings = next;
};

/** Looks up a UI string and fills `%s` / `%d` with `args` in order. `%%` prints a percent sign. */
export const t = (key: LocaleKey, ...args: (string | number)[]) => {
  let i = 0;
  return (strings[key] ?? key).replace(/%([sd%])/g, (_, type: string) => (type === '%' ? '%' : String(args[i++] ?? '')));
};

/** The text around a single `%s`, for strings that wrap a styled value. */
export const tParts = (key: LocaleKey): [string, string] => {
  const [before, ...after] = (strings[key] ?? key).replace(/%%/g, '%').split('%s');
  return [before, after.join('%s')];
};
