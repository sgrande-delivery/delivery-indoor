import { REDUCED_MOTION_QUERY } from './reduced-motion';

export function resolveScrollBehavior(): ScrollBehavior {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches ? 'auto' : 'smooth';
}
