type TableEnhancerOptions = {
  selector: string;
  minStackColumns?: number;
  wrapperClass?: string;
  scrollerClass?: string;
  hintClass?: string;
  hintText?: string;
};

const defaultOptions = {
  minStackColumns: 5,
  wrapperClass: 'table-responsive',
  scrollerClass: 'table-scroll',
  hintClass: 'table-scroll-hint',
  hintText: 'Kéo ngang để xem đủ cột'
};

const initTableEnhancer = (options: TableEnhancerOptions) => {
  if (typeof window === 'undefined') return;

  const config = { ...defaultOptions, ...options };

  const enhance = () => {
    const tables = Array.from(document.querySelectorAll<HTMLTableElement>(config.selector));
    if (tables.length === 0) return;

    tables.forEach((table) => {
      if (table.dataset.tableEnhanced === 'true') return;

      const parent = table.parentElement;
      if (!parent) return;

      const wrapper = document.createElement('div');
      wrapper.className = config.wrapperClass;
      const scroller = document.createElement('div');
      scroller.className = config.scrollerClass;

      parent.insertBefore(wrapper, table);
      scroller.appendChild(table);
      wrapper.appendChild(scroller);

      table.dataset.tableEnhanced = 'true';

      const columnCount = getColumnCount(table);
      if (columnCount >= config.minStackColumns) {
        table.dataset.tableStack = 'true';
        applyDataLabels(table);
      }

      const hint = document.createElement('div');
      hint.className = config.hintClass;
      hint.innerHTML = `<span>${config.hintText}</span>`;
      wrapper.appendChild(hint);

      const updateOverflow = () => {
        const overflow = scroller.scrollWidth - scroller.clientWidth > 4;
        wrapper.dataset.overflow = overflow ? 'true' : 'false';
        wrapper.dataset.scrolled = scroller.scrollLeft > 12 ? 'true' : 'false';
      };

      updateOverflow();

      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateOverflow);
        resizeObserver.observe(scroller);
      } else {
        window.addEventListener('resize', updateOverflow);
      }

      scroller.addEventListener('scroll', () => {
        wrapper.dataset.scrolled = scroller.scrollLeft > 12 ? 'true' : 'false';
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance, { once: true });
  } else {
    enhance();
  }
};

const getColumnCount = (table: HTMLTableElement) => {
  const headerRow = table.querySelector<HTMLTableRowElement>('thead tr') || table.querySelector<HTMLTableRowElement>('tr');
  return headerRow ? headerRow.children.length : 0;
};

const applyDataLabels = (table: HTMLTableElement) => {
  const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th')).map((cell, index) => {
    const text = cell.textContent?.trim();
    return text && text.length > 0 ? text : `Cột ${index + 1}`;
  });

  Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr')).forEach((row) => {
    Array.from(row.cells).forEach((cell, index) => {
      const label = headers[index] || headers[headers.length - 1] || `Cột ${index + 1}`;
      cell.setAttribute('data-label', label);
    });
  });
};

export default initTableEnhancer;
