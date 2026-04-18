export type Note = {
  id: string;
  title: string;
  content: string;
  isDirty: boolean;
  lastModified: number;
};

export type Settings = {
  fontSize: number;
  fontFamily: string;
  darkMode: boolean;
  wordWrap: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  fontFamily: 'font-mono',
  darkMode: true,
  wordWrap: false,
};
