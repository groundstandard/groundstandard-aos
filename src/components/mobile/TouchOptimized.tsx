import { ReactNode, TouchEvent, useState } from 'react';
import { cn } from '@/lib/utils';

// ABOUTME: Touch-optimized wrapper component that adds mobile-friendly interactions like proper touch targets, haptic feedback, and swipe gestures for enhanced mobile user experience.

interface TouchOptimizedProps {
  children: ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enableHaptics?: boolean;
  minSwipeDistance?: number;
}

const TouchOptimized = ({
  children,
  className = "",
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enableHaptics = true,
  minSwipeDistance = 50
}: TouchOptimizedProps) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const triggerHaptic = () => {
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const absDistanceX = Math.abs(distanceX);
    const absDistanceY = Math.abs(distanceY);

    // Determine if it's a horizontal or vertical swipe
    const isHorizontalSwipe = absDistanceX > absDistanceY;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isHorizontalSwipe) {
      if (isLeftSwipe && onSwipeLeft) {
        triggerHaptic();
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        triggerHaptic();
        onSwipeRight();
      }
    } else {
      if (isUpSwipe && onSwipeUp) {
        triggerHaptic();
        onSwipeUp();
      } else if (isDownSwipe && onSwipeDown) {
        triggerHaptic();
        onSwipeDown();
      }
    }
  };

  return (
    <div
      className={cn(
        // Touch optimization classes
        "touch-manipulation",
        // Ensure proper touch targets (minimum 44px)
        "[&_button]:min-h-[44px] [&_button]:min-w-[44px]",
        // Smooth scrolling and momentum
        "overflow-auto overscroll-behavior-contain",
        // Disable text selection on touch elements
        "[&_button]:select-none [&_[role=button]]:select-none",
        // Improve tap highlighting
        "[&_button]:tap-highlight-transparent [&_[role=button]]:tap-highlight-transparent",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </div>
  );
};

export default TouchOptimized;