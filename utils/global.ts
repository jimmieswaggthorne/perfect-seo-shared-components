/* eslint-disable no-restricted-globals, import/no-extraneous-dependencies */
import moment from 'moment-timezone';

export const areArraysEqual = <T>(target: T[], comparison: T[]) => {
  if (target.length !== comparison.length) {
    return false;
  } else {
    return target.every((element, index) => element === comparison[index]);
  }
};

export const getTimeZone = () => {
  try {
    const timeZone = moment.tz.zone(moment.tz.guess());
    return timeZone ? timeZone.abbr(new Date().valueOf()) : '';
  } catch (error) {
    return '';
  }
};

export const capitalizeFirst = (string: string) => {
  if (string === undefined || !string) {
    return null;
  }
  let newString = string.toString();
  // converting first letter to uppercase

  if (newString?.length > 0) {
    newString = newString.substring(0, 1).toUpperCase() + newString.slice(1);
  }
  return newString;
};

export const range = (low: number, high: number): number[] => {
  return new Array(high - low + 1)
    .fill(0)
    .map((_, index) => low + index);
};

export const padZero = (time: number): string =>
  `${time.toString().length === 1 ? '0' : ''}${time}`;

const sanitizePhoneNumber = (tel: string) => {
  if (!tel) return;
  return tel.includes('+1') ? tel.substring(2, tel.length) : tel;
};

export const createPhoneString = (tel) => {
  const regex = /(?<first>\d{0,3})(?<second>\d{0,3})(?<third>\d{0,4})/;
  let aux = sanitizePhoneNumber(tel);
  let phoneString;
  const groups = aux?.match(regex)?.groups;
  const first = groups?.first;
  const second = groups?.second;
  const third = groups?.third;
  const length = aux?.length || 0;

  if (length < 3) {
    phoneString = first;
  } else if (length === 3) {
    phoneString = ['(', first, ')'].join('');
  } else if (length > 3 && length < 7) {
    phoneString = ['(', first, ')', ' ', second].join('');
  } else if (length > 6) {
    phoneString = ['(', first, ')', ' ', second, '-', third].join('');
  }

  return phoneString;
};

export const numberToCurrency = (value: number | string, accountingNegatives: boolean = true, currency: string = 'USD', addSign: boolean = true): string => {
  if (value) {
    if (currency === 'USD') {
      let number = value;

      if (typeof value === 'number') {
        number = parseFloat(value.toString());
      } else {
        number = parseFloat(value.toString());
      }

      // @ts-ignore
      if (accountingNegatives) {
        return `${number < 0 ? '(' : ''}${addSign && '$'}${Math.abs(number).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${number < 0 ? ')' : ''}`;
      } else {
        return `${addSign && '$'}${Math.abs(number).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      }
    } else {
      return '$0.00';
    }
  } else {
    return '$0.00';
  }
};

export const filterUnique = (arr, key) => {
  if (arr?.length > 0 && arr !== null) {
    let newArray = [...arr];
    let uniqueKeys: any[] = [];

    let newData = newArray.filter(element => {
      if (element && element[key]) {
        const isDuplicate = uniqueKeys.includes(element[key]);

        if (!isDuplicate) {
          uniqueKeys.push(element[key]);

          return true;
        }
      }
      return false;
    });

    return newData;
  } else
    return null;
};

export const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
  console.log(text);
};

export const delayActionWithCancel = (action, ms = 5000) => {
  let resolve;
  let reject;
  let cancelled;

  const promise = new Promise((resolveFromPromise, rejectFromPromise) => {
    resolve = resolveFromPromise;
    reject = rejectFromPromise;
  });

  const wrapWithCancel = (fn) => {
    return (data) => {
      if (!cancelled) {
        return fn(data);
      }
    };
  };

  const wait = (delay) => new Promise((resolver) => {
    setTimeout(() => {
      resolver('');
    }, delay);
  });

  wait(ms)
    .then(wrapWithCancel(action))
    .then(resolve)
    .then(reject);

  return {
    promise,
    cancel: () => {
      cancelled = true;
      reject({ reason: 'cancelled' });
    },
  };
};

export const getFilterQueryParams = (filters) => {
  let activeFilters = filters.filter(obj => obj.applied);
  let newTypes = activeFilters.filter(obj => obj.key === 'type').map(obj => obj.value);
  let category = activeFilters.filter(obj => obj.key === 'categoryId').map(obj => obj.value);
  let host = activeFilters.filter(obj => obj.key === 'hostId').map(obj => obj.value);

  return ({ type: newTypes, category, host });
};

export const makeSearchParams = (data: object) => {
  let keys = Object.keys(data);

  let flattenedKeys = keys.map(key => {
    let paramKey = key;
    let value = data[key].toString();

    if (value) {
      return [paramKey, value].join('=');
    }
  }).filter(obj => obj !== undefined);

  return `?${flattenedKeys.join('&')}`;
};

export const getQueryValues = (string) => {
  if (string) {
    let newString = string.replace('?', '');

    if (newString.toString().includes('&')) {
      newString = newString?.split('&');
    } else {
      newString = [newString];
    }

    let newList = newString.map(obj => {
      let value = obj?.split('=')[1];

      return value?.includes(',') ? value?.split(',') : [value];

    });

    return newList.join(',')?.split(',');
  } else return [];
};


export const scrollingTo = (config: ScrollToOptions = { top: 0, behavior: 'smooth' }) => {
  if (typeof window !== undefined && window.scrollTo) {
    window?.scrollTo(config);
  }
};

export const nativeShare = (title, description): boolean => {
  const TitleConst = title;
  const URLConst = window.location.href;
  const DescriptionConst = description;

  try {
    if (navigator.canShare({ title: TitleConst, text: DescriptionConst, url: URLConst })) {
      navigator.share({ title: TitleConst, text: DescriptionConst, url: URLConst });
      return true;
    } else {
      console.log('Web Share');
      return false;
    }
  } catch (e) {
    return false;
  }
};

const printStyling = `<style type="text/css" media="all"> 
@page { size: portrait; } body { max-width: 8.5in;}
.hidePrint { display: none;}
table {
  border-collapse: collapse;
  outline: 1px solid black;
  width: 100%;
}
tbody {
  display: table-row-group;
  vertical-align: center;
}

thead, tbody, tfoot {
  border: 1px solid black;
}
thead, tfoot{
  background-color: lightgray;
}
td, th{
  padding: .5em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tr > td:first-of-type {
  padding-left: 1em;
}

tr > td:not(:first-of-type){
  text-align: end;
}

tr > th:not(:first-of-type){
  text-align: end;
}

.table-subrow > td:first-of-type {
  padding-left: 2em !important;
}

th{
  text-align: start
}

tbody{
tr{
  border-bottom: .5px solid lightgray;
}
}
</style>`;

export const printDiv = (divId, title?) => {
  var mywindow = window.open('', 'PRINT');
  let docTitle = title || document.title;
  if (mywindow && window) {
    mywindow.document.open('', 'PRINT');
    mywindow.document.write(`<html><head><title>${docTitle} </title>`);
    mywindow.document.write(`${printStyling}</head><body>`);
    mywindow.document.write('<h1>' + docTitle + '</h1>');
    const divElement = window.document.getElementById(divId);
    if (divElement) {
      mywindow.document.write(divElement.innerHTML);
    }
    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

    mywindow.print();
    mywindow.close();

    return true;
  }
  else return false;
};

export const printRaw = (raw, title?) => {
  let mywindow = window.open('', 'PRINT');

  if (mywindow) {
    mywindow.document.write(`<html><head><title>${title ? title : document.title}</title>`);
    mywindow.document.write('<style type="text/css" media="all"> @page { size: portrait; } body { max-width: 8.5in;} th, td { width: 33%;  font-size: 10px;} h1 {font-size: 16px; margin-bottom: 8px;} .truncate{ overflow: hidden; text-overflow: ellipsis;white-space: nowrap;}</style></head><body>');
    mywindow.document.write(`<h1 style="text-transform:capitalize">${title ? title : document.title}</h1>`);
    mywindow.document.write(raw);
    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

    mywindow.print();
    return mywindow.close();
  }


};

export function debounce(func, timeout = 300) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

export const getNumberSuffix = (number: number) => {
  let lastDigit = number.toString().substring(-1);

  switch (lastDigit) {
    case '1':
      return 'st';
    case '2':
      return 'nd';
    case '3':
      return 'rd';
    default:
      return 'th';
  }
};

/**
 * Helper function to download a file to the user's device
 * @param content - The file content as string
 * @param filename - The filename to download as
 * @param mimeType - The MIME type of the file
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  console.log('📥 [downloadFile] Starting download for:', filename);

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('📥 [downloadFile] ✅ Download initiated for:', filename);
};