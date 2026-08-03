import sanitizeHtml from 'sanitize-html';

export const cleanInput = (dirtyText: string): string => {
  if (!dirtyText) return '';
  return sanitizeHtml(dirtyText, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {},
  }).trim();
};
