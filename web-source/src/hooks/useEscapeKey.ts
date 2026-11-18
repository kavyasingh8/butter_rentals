import { useEffect, useRef } from 'react';

type Handler = () => void;

/** Open layers in the order they appeared; Escape only reaches the most recent one. */
const stack: { current: Handler }[] = [];

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || stack.length === 0) return;
  stack[stack.length - 1].current();
};

/**
 * Runs `handler` when Escape is pressed while this is the most recently opened layer,
 * so closing a dialog does not also close the panel underneath it.
 */
export const useEscapeKey = (handler: Handler, enabled = true) => {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;

    if (stack.length === 0) window.addEventListener('keydown', onKeyDown);
    stack.push(ref);

    return () => {
      stack.splice(stack.indexOf(ref), 1);
      if (stack.length === 0) window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled]);
};
