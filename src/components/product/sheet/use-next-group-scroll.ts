'use client';

import { useCallback, useEffect, useRef } from 'react';
import { resolveScrollBehavior } from '@/helpers/scroll-behavior';
import { motion } from '@/theme';
import { optionGroupElementId } from '../composer/option-groups';

const KEYBOARD_FOCUS_SELECTOR = ':focus-visible';

interface GroupAction {
  groupId: number;
  wasComplete: boolean;
}

function isKeyboardFocused(element: Element): boolean {
  try {
    return element.matches(KEYBOARD_FOCUS_SELECTOR);
  } catch {
    return false;
  }
}

function isKeyboardAction(groupId: number): boolean {
  const active = document.activeElement;

  if (active === null || !isKeyboardFocused(active)) {
    return false;
  }

  return document.getElementById(optionGroupElementId(groupId))?.contains(active) ?? false;
}

function findNextIncompleteGroupId(
  orderedGroupIds: number[],
  completeGroupIds: number[],
  groupId: number
): number | null {
  const position = orderedGroupIds.indexOf(groupId);

  if (position < 0) {
    return null;
  }

  return orderedGroupIds.slice(position + 1).find(id => !completeGroupIds.includes(id)) ?? null;
}

export function useNextGroupScroll(orderedGroupIds: number[], completeGroupIds: number[]): (groupId: number) => void {
  const actionRef = useRef<GroupAction | null>(null);
  const timerRef = useRef<number | null>(null);

  const cancelScroll = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const registerGroupAction = useCallback(
    (groupId: number) => {
      cancelScroll();

      if (isKeyboardAction(groupId)) {
        actionRef.current = null;
        return;
      }

      actionRef.current = { groupId, wasComplete: completeGroupIds.includes(groupId) };
    },
    [cancelScroll, completeGroupIds]
  );

  useEffect(() => {
    const action = actionRef.current;

    actionRef.current = null;

    if (action === null || action.wasComplete || !completeGroupIds.includes(action.groupId)) {
      return;
    }

    const nextGroupId = findNextIncompleteGroupId(orderedGroupIds, completeGroupIds, action.groupId);

    if (nextGroupId === null) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      document
        .getElementById(optionGroupElementId(nextGroupId))
        ?.scrollIntoView({ behavior: resolveScrollBehavior(), block: 'start' });
    }, motion.duration.fast);
  }, [completeGroupIds, orderedGroupIds]);

  useEffect(() => cancelScroll, [cancelScroll]);

  return registerGroupAction;
}
