/* Modified from https://github.com/taylorhakes/fecha
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Taylor Hakes
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*eslint-disable*/
// 把 YYYY-MM-DD 改成了 yyyy-MM-dd
(function (main) {
  'use strict';

  /**
   * Parse or format dates
   * @class fecha
   */
  var fecha = {};
  var token = /d{1,4}|M{1,4}|yy(?:yy)?|S{1,3}|Do|ZZ|([HhMsDm])\1?|[aA]|"[^"]*"|'[^']*'/g;//'\1的含义是重复第一个捕获分组的值，这里是[HhMsDm],?是表示是否要重复'
  var twoDigits = /\d\d?/;
  var threeDigits = /\d{3}/;
  var fourDigits = /\d{4}/;
  var word = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;
  var noop = function () {
  };

  //变短，月份缩写，或者星期缩写
  function shorten(arr, sLen) {
    var newArr = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      newArr.push(arr[i].substr(0, sLen));
    }
    return newArr;
  }

  function monthUpdate(arrName) {
    return function (d, v, i18n) {
      var index = i18n[arrName].indexOf(v.charAt(0).toUpperCase() + v.substr(1).toLowerCase());
      if (~index) {
        d.month = index;
      }
    };
  }

  //两位数，1位的，高位补零
  function pad(val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) {
      val = '0' + val;
    }
    return val;
  }

  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var monthNamesShort = shorten(monthNames, 3);//缩写
  var dayNamesShort = shorten(dayNames, 3);//缩写
  fecha.i18n = {
    dayNamesShort: dayNamesShort,//星期缩写
    dayNames: dayNames,//星期完整名
    monthNamesShort: monthNamesShort,//月缩写
    monthNames: monthNames,//月完整名
    amPm: ['am', 'pm'],//上下午
    DoFn: function DoFn(D) {
      return D + ['th', 'st', 'nd', 'rd'][D % 10 > 3 ? 0 : (D - D % 10 !== 10) * D % 10];
    }
  };

  var formatFlags = {
    //返回数字星期几
    D: function(dateObj) {
      return dateObj.getDay();
    },
    DD: function(dateObj) {
      return pad(dateObj.getDay());
    },
    //返回类似23th,23st,23nd,23rd
    Do: function(dateObj, i18n) {
      return i18n.DoFn(dateObj.getDate());
    },
    //数字几号
    d: function(dateObj) {
      return dateObj.getDate();
    },
    //高位补零
    dd: function(dateObj) {
      return pad(dateObj.getDate());
    },
    //英文缩写星期几
    ddd: function(dateObj, i18n) {
      return i18n.dayNamesShort[dateObj.getDay()];
    },
    //英文星期几
    dddd: function(dateObj, i18n) {
      return i18n.dayNames[dateObj.getDay()];
    },
    //获得月份
    M: function(dateObj) {
      return dateObj.getMonth() + 1;
    },
    MM: function(dateObj) {
      return pad(dateObj.getMonth() + 1);
    },
    //月份缩写
    MMM: function(dateObj, i18n) {
      return i18n.monthNamesShort[dateObj.getMonth()];
    },
    //月份
    MMMM: function(dateObj, i18n) {
      return i18n.monthNames[dateObj.getMonth()];
    },
    //年份后两位，例如2018 取 18
    yy: function(dateObj) {
      return String(dateObj.getFullYear()).substr(2);
    },
    yyyy: function(dateObj) {
      return dateObj.getFullYear();
    },
    //取小时，非24小时制
    h: function(dateObj) {
      return dateObj.getHours() % 12 || 12;
    },
    //高位补零
    hh: function(dateObj) {
      return pad(dateObj.getHours() % 12 || 12);
    },
    //24小时制
    H: function(dateObj) {
      return dateObj.getHours();
    },
    HH: function(dateObj) {
      return pad(dateObj.getHours());
    },
    //获得分钟
    m: function(dateObj) {
      return dateObj.getMinutes();
    },
    mm: function(dateObj) {
      return pad(dateObj.getMinutes());
    },
    //秒
    s: function(dateObj) {
      return dateObj.getSeconds();
    },
    ss: function(dateObj) {
      return pad(dateObj.getSeconds());
    },
    //精确到毫秒/100
    S: function(dateObj) {
      return Math.round(dateObj.getMilliseconds() / 100);
    },
    //精确到毫米/10
    SS: function(dateObj) {
      return pad(Math.round(dateObj.getMilliseconds() / 10), 2);
    },
    SSS: function(dateObj) {
      return pad(dateObj.getMilliseconds(), 3);
    },
    //上下午（am，pm）
    a: function(dateObj, i18n) {
      return dateObj.getHours() < 12 ? i18n.amPm[0] : i18n.amPm[1];
    },
    //大写上下午（AM，PM）
    A: function(dateObj, i18n) {
      return dateObj.getHours() < 12 ? i18n.amPm[0].toUpperCase() : i18n.amPm[1].toUpperCase();
    },
    //时区，例如中国的时区+0800，东八时区
    ZZ: function(dateObj) {
      var o = dateObj.getTimezoneOffset();
      return (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4);
    }
  };

  var parseFlags = {
    //日的话，直接赋值，包括dd,d,Do
    d: [twoDigits, function (d, v) {
      d.day = v;
    }],
    //月的话-1，包括MM
    M: [twoDigits, function (d, v) {
      d.month = v - 1;
    }],
    //年的话，如果是2位，判断前2位+后2位
    yy: [twoDigits, function (d, v) {
      var da = new Date(), cent = +('' + da.getFullYear()).substr(0, 2);
      d.year = '' + (v > 68 ? cent - 1 : cent) + v;
    }],
    h: [twoDigits, function (d, v) {
      d.hour = v;
    }],
    m: [twoDigits, function (d, v) {
      d.minute = v;
    }],
    s: [twoDigits, function (d, v) {
      d.second = v;
    }],
    //直接赋值年
    yyyy: [fourDigits, function (d, v) {
      d.year = v;
    }],
    //毫秒
    S: [/\d/, function (d, v) {
      d.millisecond = v * 100;
    }],
    SS: [/\d{2}/, function (d, v) {
      d.millisecond = v * 10;
    }],
    SSS: [threeDigits, function (d, v) {
      d.millisecond = v;
    }],
    //忽略 D
    D: [twoDigits, noop],
    //忽略ddd
    ddd: [word, noop],
    MMM: [word, monthUpdate('monthNamesShort')],
    MMMM: [word, monthUpdate('monthNames')],
    a: [word, function (d, v, i18n) {
      var val = v.toLowerCase();
      if (val === i18n.amPm[0]) {
        d.isPm = false;
      } else if (val === i18n.amPm[1]) {
        d.isPm = true;
      }
    }],
    ZZ: [/[\+\-]\d\d:?\d\d/, function (d, v) {
      var parts = (v + '').match(/([\+\-]|\d\d)/gi), minutes;

      if (parts) {
        minutes = +(parts[1] * 60) + parseInt(parts[2], 10);
        d.timezoneOffset = parts[0] === '+' ? minutes : -minutes;
      }
    }]
  };
  //对上面的对象补充，主要是沿用原来的值，避免写法重复冗余，方便维护
  parseFlags.DD = parseFlags.D;
  parseFlags.dddd = parseFlags.ddd;
  parseFlags.Do = parseFlags.dd = parseFlags.d;
  parseFlags.mm = parseFlags.m;
  parseFlags.hh = parseFlags.H = parseFlags.HH = parseFlags.h;
  parseFlags.MM = parseFlags.M;
  parseFlags.ss = parseFlags.s;
  parseFlags.A = parseFlags.a;


  // Some common format strings 格式化一些通用的时间格式
  fecha.masks = {
    'default': 'ddd MMM dd yyyy HH:mm:ss',
    shortDate: 'M/D/yy',
    mediumDate: 'MMM d, yyyy',
    longDate: 'MMMM d, yyyy',
    fullDate: 'dddd, MMMM d, yyyy',
    shortTime: 'HH:mm',
    mediumTime: 'HH:mm:ss',
    longTime: 'HH:mm:ss.SSS'
  };

  /***
   * Format a date
   * @method format
   * @param {Date|number} dateObj
   * @param {string} mask Format of the date, i.e. 'mm-dd-yy' or 'shortDate'
   */
  fecha.format = function (dateObj, mask, i18nSettings) {
    var i18n = i18nSettings || fecha.i18n;

    if (typeof dateObj === 'number') {
      dateObj = new Date(dateObj);
    }
    //dataObj必须是一个时间对象或者是一个数字
    if (Object.prototype.toString.call(dateObj) !== '[object Date]' || isNaN(dateObj.getTime())) {
      throw new Error('Invalid Date in fecha.format');
    }

    //格式化成什么形式的
    mask = fecha.masks[mask] || mask || fecha.masks['default'];

    return mask.replace(token, function ($0) {
      return $0 in formatFlags ? formatFlags[$0](dateObj, i18n) : $0.slice(1, $0.length - 1);
    });
  };

  /**
   * Parse a date string into an object, changes - into /
   * @method parse
   * @param {string} dateStr Date string
   * @param {string} format Date parse format
   * @returns {Date|boolean}
   */
  fecha.parse = function (dateStr, format, i18nSettings) {
    var i18n = i18nSettings || fecha.i18n;

    if (typeof format !== 'string') {
      throw new Error('Invalid format in fecha.parse');
    }

    //提供要转化字符串的格式形式
    format = fecha.masks[format] || format;

    // Avoid regular expression denial of service, fail early for really long strings
    // https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS
    if (dateStr.length > 1000) {
      return false;
    }

    var isValid = true;
    var dateInfo = {};
    format.replace(token, function ($0) {
      if (parseFlags[$0]) {
        var info = parseFlags[$0];//正则 
        var index = dateStr.search(info[0]);
        if (!~index) {
          //校验格式是否有误，标记
          isValid = false;
        } else {
          dateStr.replace(info[0], function (result) {
            info[1](dateInfo, result, i18n);//信息收集
            dateStr = dateStr.substr(index + result.length);//把匹配到的去掉，避免影响下一个正则匹配
            return result;//返回无意义
          });
        }
      }

      return parseFlags[$0] ? '' : $0.slice(1, $0.length - 1);
    });

    //格式有误直接退出
    if (!isValid) {
      return false;
    }

    var today = new Date();
    //修正am，pm之后的小时24制
    if (dateInfo.isPm === true && dateInfo.hour != null && +dateInfo.hour !== 12) {
      dateInfo.hour = +dateInfo.hour + 12;
    } else if (dateInfo.isPm === false && +dateInfo.hour === 12) {
      dateInfo.hour = 0;
    }

    var date;
    //解析时区
    if (dateInfo.timezoneOffset != null) {
      dateInfo.minute = +(dateInfo.minute || 0) - +dateInfo.timezoneOffset;
      date = new Date(Date.UTC(dateInfo.year || today.getFullYear(), dateInfo.month || 0, dateInfo.day || 1,
        dateInfo.hour || 0, dateInfo.minute || 0, dateInfo.second || 0, dateInfo.millisecond || 0));
    } else {
      date = new Date(dateInfo.year || today.getFullYear(), dateInfo.month || 0, dateInfo.day || 1,
        dateInfo.hour || 0, dateInfo.minute || 0, dateInfo.second || 0, dateInfo.millisecond || 0);
    }
    return date;
  };

  /* cmd 和 amd 规范*/
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = fecha;
  } else if (typeof define === 'function' && define.amd) {
    define(function () {
      return fecha;
    });
  } else {
    //全局
    main.fecha = fecha;
  }
})(this);
