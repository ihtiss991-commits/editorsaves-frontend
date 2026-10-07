export const SITE_URL = 'https://editorsaves.com';

export const SITE_NAME = 'EditorSaves';

export const SITE_DESCRIPTION =
  'Free universal save editor for game saves. Supports RPG Maker, Ren\'Py, Unity, Unreal Engine, and 50+ formats.';

// Maximum file size: 25MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE;
export const MAX_FILE_SIZE_LABEL = '25MB';

// Allowed file extensions for save files
export const ALLOWED_EXTENSIONS: string[] = [
  '.rpgsave',
  '.rmmzsave',
  '.save',
  '.rvdata2',
  '.rvdata',
  '.rxdata',
  '.sav',
  '.dat',
  '.json',
  '.xml',
  '.sqlite',
  '.db',
  '.plr',
  '.wld',
  '.rsv',
  '.sol',
  '.sgs',
  '.qsp',
  '.ksd',
  '.pkl',
  '.pickle',
  '.es3',
  '.lsd',
];

/**
 * Returns the lowercase file extension including the leading dot.
 * e.g. "save.RPGSAVE" -> ".rpgsave"
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Returns true if the filename has an allowed extension.
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}
