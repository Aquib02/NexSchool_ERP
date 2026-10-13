/**
 * Universal Print & PDF Export Utility for School ERP
 * Solves the Chromium / WebKit blank print preview issue by cloning
 * the target element to a dedicated print mount point directly under body,
 * bypassing all React modal clipping, transform, and overflow constraints.
 */
export const printElement = (elementIdOrElement, documentTitle = 'Document', options = {}) => {
  const el =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!el) {
    console.warn(`[printUtils] Element not found: ${elementIdOrElement}, falling back to window.print()`);
    window.print();
    return;
  }

  // Ensure a dedicated mount point exists directly on document.body (outside #root)
  let mountPoint = document.getElementById('print-mount-point');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'print-mount-point';
    document.body.appendChild(mountPoint);
  }

  // Clone target element and synchronize form controls (inputs, textareas, selects)
  const clone = el.cloneNode(true);
  const origFormElements = el.querySelectorAll('input, textarea, select');
  const cloneFormElements = clone.querySelectorAll('input, textarea, select');
  origFormElements.forEach((orig, i) => {
    const cloned = cloneFormElements[i];
    if (!cloned) return;
    if (orig.type === 'checkbox' || orig.type === 'radio') {
      cloned.checked = orig.checked;
    } else {
      cloned.value = orig.value;
      if (orig.tagName === 'TEXTAREA') {
        cloned.textContent = orig.value;
      }
    }
  });

  mountPoint.innerHTML = '';
  mountPoint.appendChild(clone);

  // Set document title temporarily for the generated PDF filename
  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // Determine orientation: explicit option or default landscape for broadsheets
  const isLandscape =
    options.orientation === 'landscape' ||
    (typeof elementIdOrElement === 'string' && elementIdOrElement.includes('broadsheet'));

  let orientationStyle = null;
  if (isLandscape) {
    orientationStyle = document.createElement('style');
    orientationStyle.id = 'dynamic-print-orientation';
    orientationStyle.textContent = `
      @page {
        size: landscape;
        margin: 6mm 8mm;
      }
    `;
    document.head.appendChild(orientationStyle);
    document.body.classList.add('is-printing-landscape');
  }

  // Activate print mode class on body
  document.body.classList.add('is-printing-active');

  const cleanup = () => {
    document.body.classList.remove('is-printing-active');
    document.body.classList.remove('is-printing-landscape');
    if (orientationStyle && orientationStyle.parentNode) {
      orientationStyle.parentNode.removeChild(orientationStyle);
    }
    if (mountPoint) {
      mountPoint.innerHTML = '';
    }
    document.title = originalTitle;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Small delay so browser layout engine calculates the new DOM node before triggering print dialog
  setTimeout(() => {
    window.print();

    // Fallback cleanup in case browser does not fire afterprint event
    setTimeout(cleanup, 3000);
  }, 120);
};

export default printElement;
