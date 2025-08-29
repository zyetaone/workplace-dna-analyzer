/**
 * Reusable {@attach ...} utilities for common UI patterns
 * Enhanced with Svelte 5 patterns and accessibility features
 */
import type { Attachment } from 'svelte/attachments';

/**
 * Intersection Observer attachment for lazy loading and scroll-based animations
 */
export function intersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): Attachment {
  return (element: HTMLElement) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(callback);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  };
}

/**
 * Click outside attachment for dropdowns, modals, etc.
 */
export function clickOutside(callback: () => void): Attachment {
  return (element: HTMLElement) => {
    function handleClick(event: MouseEvent) {
      if (!element.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  };
}

/**
 * Focus trap attachment for modals and dialogs
 */
export function focusTrap(): Attachment {
  return (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Find and click the close button or trigger close
        const closeButton = element.querySelector('[data-close], .close, [aria-label="Close"]') as HTMLElement;
        closeButton?.click();
      }
    }

    element.addEventListener('keydown', handleTabKey);
    element.addEventListener('keydown', handleEscapeKey);

    // Focus first element when attached
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
      element.removeEventListener('keydown', handleEscapeKey);
    };
  };
}

/**
 * Resize Observer attachment for responsive components
 */
export function resizeObserver(callback: (entry: ResizeObserverEntry) => void): Attachment {
  return (element: HTMLElement) => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach(callback);
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  };
}

/**
 * Auto-resize textarea attachment
 */
export function autoResize(minHeight: number = 40): Attachment {
  return (element: HTMLTextAreaElement) => {
    function adjustHeight() {
      element.style.height = 'auto';
      element.style.height = Math.max(minHeight, element.scrollHeight) + 'px';
    }

    element.addEventListener('input', adjustHeight);

    // Initial adjustment
    adjustHeight();

    return () => {
      element.removeEventListener('input', adjustHeight);
    };
  };
}

/**
 * Debounced scroll attachment
 */
export function scrollListener(
  callback: (scrollY: number, scrollX: number) => void,
  delay: number = 16
): Attachment {
  return (element: HTMLElement) => {
    let timeoutId: number;

    function handleScroll() {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback(window.scrollY, window.scrollX);
      }, delay);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  };
}

/**
 * Copy to clipboard attachment
 */
export function copyToClipboard(text: string, onSuccess?: () => void, onError?: (error: Error) => void): Attachment {
  return (element: HTMLElement) => {
    async function handleClick() {
      try {
        await navigator.clipboard.writeText(text);
        onSuccess?.();
      } catch (error) {
        onError?.(error as Error);
      }
    }

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  };
}

/**
 * Long press attachment for mobile interactions
 */
export function longPress(
  callback: () => void,
  duration: number = 500
): Attachment {
  return (element: HTMLElement) => {
    let timeoutId: number;
    let startTime: number;

    function startPress() {
      startTime = Date.now();
      timeoutId = window.setTimeout(() => {
        callback();
        // Add visual feedback
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.style.transform = '';
        }, 150);
      }, duration);
    }

    function cancelPress() {
      clearTimeout(timeoutId);
      const pressDuration = Date.now() - startTime;
      if (pressDuration < duration) {
        // It was a short press, you might want to handle this differently
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
          element.style.transform = '';
        }, 100);
      }
    }

    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchend', cancelPress, { passive: true });
    element.addEventListener('touchcancel', cancelPress, { passive: true });

    // Also handle mouse events for desktop testing
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', cancelPress);
    element.addEventListener('mouseleave', cancelPress);

    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener('touchstart', startPress);
      element.removeEventListener('touchend', cancelPress);
      element.removeEventListener('touchcancel', cancelPress);
      element.removeEventListener('mousedown', startPress);
      element.removeEventListener('mouseup', cancelPress);
      element.removeEventListener('mouseleave', cancelPress);
    };
  };
}

/**
 * Tooltip attachment with reactive positioning
 */
export function tooltip(
  content: string,
  position: 'top' | 'bottom' | 'left' | 'right' = 'top',
  delay: number = 300
): Attachment {
  return (element: HTMLElement) => {
    let tooltipElement: HTMLDivElement | null = null;
    let showTimeout: number;
    let hideTimeout: number;

    function createTooltip() {
      if (tooltipElement) return;

      tooltipElement = document.createElement('div');
      tooltipElement.textContent = content;
      tooltipElement.className = `
        fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg
        pointer-events-none opacity-0 transition-opacity duration-200
        whitespace-nowrap max-w-xs
      `;

      // Position tooltip
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();

      switch (position) {
        case 'top':
          tooltipElement.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltipElement.style.top = `${rect.top - 8}px`;
          tooltipElement.style.transform = 'translateY(-100%)';
          break;
        case 'bottom':
          tooltipElement.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltipElement.style.top = `${rect.bottom + 8}px`;
          break;
        case 'left':
          tooltipElement.style.left = `${rect.left - 8}px`;
          tooltipElement.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          tooltipElement.style.transform = 'translateX(-100%)';
          break;
        case 'right':
          tooltipElement.style.left = `${rect.right + 8}px`;
          tooltipElement.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
      }

      document.body.appendChild(tooltipElement);
    }

    function showTooltip() {
      clearTimeout(hideTimeout);
      showTimeout = window.setTimeout(() => {
        createTooltip();
        if (tooltipElement) {
          tooltipElement.style.opacity = '1';
        }
      }, delay);
    }

    function hideTooltip() {
      clearTimeout(showTimeout);
      hideTimeout = window.setTimeout(() => {
        if (tooltipElement) {
          tooltipElement.style.opacity = '0';
          setTimeout(() => {
            if (tooltipElement && tooltipElement.parentNode) {
              tooltipElement.parentNode.removeChild(tooltipElement);
              tooltipElement = null;
            }
          }, 200);
        }
      }, 100);
    }

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      element.removeEventListener('mouseenter', showTooltip);
      element.removeEventListener('mouseleave', hideTooltip);
      element.removeEventListener('focus', showTooltip);
      element.removeEventListener('blur', hideTooltip);

      if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
      }
    };
  };
}

/**
 * Keyboard navigation attachment for custom components
 */
export function keyboardNavigation(
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
): Attachment {
  return (element: HTMLElement) => {
    function handleKeydown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.();
          break;
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
      }
    }

    element.addEventListener('keydown', handleKeydown);
    element.setAttribute('tabindex', '0');

    return () => {
      element.removeEventListener('keydown', handleKeydown);
      element.removeAttribute('tabindex');
    };
  };
}

/**
 * Form validation attachment with real-time feedback
 */
export function formValidation(
  validator: (value: string) => { isValid: boolean; message?: string },
  onValidationChange?: (isValid: boolean, message?: string) => void
): Attachment {
  return (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    let lastValue = element.value;
    let isValid = true;

    function validate() {
      const result = validator(element.value);
      isValid = result.isValid;

      // Update visual feedback
      element.classList.toggle('border-red-500', !isValid);
      element.classList.toggle('border-green-500', isValid && element.value.length > 0);

      // Update ARIA attributes
      element.setAttribute('aria-invalid', (!isValid).toString());
      if (result.message) {
        element.setAttribute('aria-describedby', `${element.id}-error`);
      }

      onValidationChange?.(isValid, result.message);
    }

    function handleInput() {
      if (element.value !== lastValue) {
        lastValue = element.value;
        validate();
      }
    }

    function handleBlur() {
      validate();
    }

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', handleBlur);

    // Initial validation
    validate();

    return () => {
      element.removeEventListener('input', handleInput);
      element.removeEventListener('blur', handleBlur);
      element.classList.remove('border-red-500', 'border-green-500');
      element.removeAttribute('aria-invalid');
      element.removeAttribute('aria-describedby');
    };
  };
}