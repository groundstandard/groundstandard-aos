import { useState, useEffect } from 'react';

// ABOUTME: Enhanced responsive hook that provides breakpoint detection, device type identification, and responsive utilities for mobile-first design.

// Standard responsive breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const;

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
        orientation: 'landscape',
        isTouch: false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
      isDesktop: width >= BREAKPOINTS.desktop,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  });

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait',
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      });
    };

    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
}

// Utility hook for responsive values
export function useResponsiveValue<T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue: T
): T {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return mobileValue;
  if (isTablet) return tabletValue;
  return desktopValue;
}

// Utility hook for conditional rendering based on breakpoints
export function useBreakpoint() {
  const responsive = useResponsive();
  
  return {
    ...responsive,
    showOnMobile: (content: React.ReactNode) => responsive.isMobile ? content : null,
    showOnTablet: (content: React.ReactNode) => responsive.isTablet ? content : null,
    showOnDesktop: (content: React.ReactNode) => responsive.isDesktop ? content : null,
    hideOnMobile: (content: React.ReactNode) => !responsive.isMobile ? content : null,
    hideOnTablet: (content: React.ReactNode) => !responsive.isTablet ? content : null,
    hideOnDesktop: (content: React.ReactNode) => !responsive.isDesktop ? content : null
  };
}