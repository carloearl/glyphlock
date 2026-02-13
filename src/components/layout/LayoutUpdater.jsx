import { useEffect } from 'react';

export default function LayoutUpdater() {
  useEffect(() => {
    // Update Beta Version badge to 3.0
    const updateBadge = () => {
      const desktopBadge = document.querySelector('.fixed.top-20.right-4 .bg-gradient-to-r');
      const mobileBadge = document.querySelector('.fixed.bottom-20.left-4 .bg-gradient-to-r');
      
      if (desktopBadge) {
        desktopBadge.textContent = 'Beta Version 3.0';
      }
      if (mobileBadge) {
        mobileBadge.textContent = 'v3.0';
      }
    };

    // Run on mount with delay for DOM
    const timer = setTimeout(updateBadge, 100);
    return () => clearTimeout(timer);
  }, []);

  return null;
}