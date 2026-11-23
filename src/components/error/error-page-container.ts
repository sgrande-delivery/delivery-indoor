import { overlayBreakpoint } from '@/theme';

export const ERROR_PAGE_CONTAINER_NAME = 'error-page';

export const ERROR_PAGE_DESKTOP_QUERY = `@container ${ERROR_PAGE_CONTAINER_NAME} (min-width: ${overlayBreakpoint}px)`;
