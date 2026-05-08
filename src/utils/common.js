export default {
  calPercent: function Percentage(num, total) {
    if (num === 0 || total === 0) {
      return 0;
    }
    return (Math.round(num / total * 10000) / 100.00);// 小数点后两位百分比
  },

  calPiePercent: function Percentage(num, total) {
    if (num === 0 || total === 0) {
      return 0;
    }
    return (Math.round(num / total * 100) / 100.00);// 小数点后两位百分比
  },
  parseHeaders: headers => {
    if (!headers) {
      return [];
    }
    let hd = {}
    if (typeof headers === 'string') {
      try {
        hd = JSON.parse(headers);
      } catch (e) {
        // Backward-compatible fallback: avoid UI crash when legacy data stores
        // non-JSON previews like "...<truncated xxx chars>".
        hd = {};
      }
    } else {
      hd = headers;
    }
    return Object.keys(hd).map((key, index) => ({
      key, value: hd[key], id: index
    }))
  },
  translateHeaders: headers => {
    const hd = {};
    for (const h in headers) {
      if (!Object.prototype.hasOwnProperty.call(headers, h)) {
        continue;
      }
      hd[headers[h].key] = headers[h].value;
    }
    return JSON.stringify(hd, null, 2);
  },
}
