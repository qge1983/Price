import { useEffect, useState } from 'react';

interface ScrollState {
  /** header should slide away (scrolling down) */
  hidden: boolean;
  /** page is scrolled a little (for shadows) */
  scrolled: boolean;
  /** far down the page (show "back to top") */
  farDown: boolean;
}

export function useScrollHide(threshold = 72): ScrollState {
  const [state, setState] = useState<ScrollState>({ hidden: false, scrolled: false, farDown: false });

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    let hidden = false;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      if (y <= threshold) {
        hidden = false;
        lastY = y;
      } else if (y - lastY > 10) {
        hidden = true;
        lastY = y;
      } else if (lastY - y > 10) {
        hidden = false;
        lastY = y;
      }
      const next: ScrollState = { hidden, scrolled: y > 4, farDown: y > 900 };
      setState((prev) =>
        prev.hidden === next.hidden && prev.scrolled === next.scrolled && prev.farDown === next.farDown ? prev : next,
      );
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return state;
}
