export const SITE_URL = 'https://editorsaves.com';
export const SITE_NAME = 'EditorSaves';
export const SITE_DESCRIPTION =
  'EditorSaves offers an experimental browser-based RPG Maker MV and MZ save editor for selected recognized slot saves, alongside a game save-file collection and format-research project. Compatibility remains limited.';

// Maximum file size: 25MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE;
export const MAX_FILE_SIZE_LABEL = '25MB';

// Accepted filename extensions for the current upload intake.
// Acceptance does not imply that a game's save format can be parsed or edited.
export const ALLOWED_EXTENSIONS: string[] = [
  '.rpgsave', '.rmmzsave', '.save', '.rvdata2', '.rvdata', '.rxdata',
  '.sav', '.dat', '.json', '.xml', '.sqlite', '.db', '.plr', '.wld',
  '.rsv', '.sol', '.sgs', '.qsp', '.ksd', '.pkl', '.pickle', '.es3', '.lsd',
];

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

export function isAllowedExtension(filename: string): boolean {
  const ext = getExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}
