﻿/** 
 * @projectDescription  PagesJS is a small JavaSciprt Framework originally built as an experiment in designing single page applications.
 *                      As PagesJS evolved it aimed to solve the common problems associated with writing this new style of application. It became clear early on that PagesJS was well suited for building simple single page applications without the requirement of heavier libraries such as jQuery to perform simple DOM related functions.
 *
 * @author  Christopher D. Langton chris@codewiz.biz
 * @version     1.1
 */
//	pagesJS selector
function p(id, debug) {
    if (debug) { this.debug = true; if (!(window.console && console.log)) { (function () { var noop = function () { }; var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn']; var length = methods.length; var console = window.console = {}; while (length--) { console[methods[length]] = noop; } }()); } } else { this.debug = false; }
    //fixes for old browsers
    if (!document.getElementsByClassName) {
        document.getElementsByClassName = function (classname) {
            var elArray = [];
            var tmp = document.getElementsByTagName("*");
            var regex = new RegExp("(^|\s)" + classname + "(\s|$)");
            for (var i = 0; i < tmp.length; i++) {
                if (regex.test(tmp[i].className)) {
                    elArray.push(tmp[i]);
                }
            }
            return elArray;
        };
    }
    if (typeof Array.prototype.indexOf !== 'function') {
        Array.prototype.indexOf = function (item) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === item) {
                    return i;
                }
            }
            return -1;
        };
    }
    this.hash = window.location.hash.substring(2);
    this.page_title = document.getElementsByTagName('title')[0].innerHTML.replace('<', '&lt;').replace('>', '&gt;').replace(' & ', ' &amp; ').substring(0, document.getElementsByTagName('title')[0].innerHTML.replace('<', '&lt;').replace('>', '&gt;').replace(' & ', ' &amp; ').indexOf(" |")) || document.getElementsByTagName('title')[0].innerHTML.replace('<', '&lt;').replace('>', '&gt;').replace(' & ', ' &amp; ');
    var link_arr = document.getElementsByTagName("link");
    for (var i = 0; i < link_arr.length; i++) {
        if (link_arr[i].getAttribute('rel') === 'canonical') {
            this.canonical = link_arr[i].href.substring(0, link_arr[i].href.indexOf("#!")) || link_arr[i].href;
        }
    }
    // About object is returned if there is no 'id' parameter
    var about = {
        Library: "PagesJS",
        Version: 1.1,
        Author: "Christopher D. Langton",
        Website: "http:\/\/chrisdlangton.com",
        Created: "2013-02-03",
        Updated: "2013-02-25"
    };
    if (id) {
        // return a new page object if we're in the window scope
        if (window === this) {
            return new p(id);
        }
        // Init our element object and return the object
        if (id.charAt(0) === '#') {
            id = id.substring(1);
            this.id = id;
            if (typeof (document.getElementById(id)) !== 'undefined' && document.getElementById(id) !== null) {
                this.ele = document.getElementById(id);
                return this;
            } else {
                if (this.debug) { console.log("PagesJS: unknown element"); }
                return false;
            }
        } else if (id.charAt(0) === '.') {
            id = id.substring(1);
            this.id = id;
            if (typeof (document.getElementsByClassName(id)) !== 'undefined' && document.getElementsByClassName(id) !== null) {
                this.ele = document.getElementsByClassName(id);
                return this;
            } else {
                if (this.debug) { console.log("PagesJS: unknown element"); }
                return false;
            }
        } else if (id.charAt(0) === '_') {
            id = id.substring(1);
            this.id = id;
            var elements = document.getElementsByTagName('*');
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].getAttribute('page')) {
                    // return element when found with attribute page matching id.
                    if (elements[i].getAttribute('page') === id) {
                        this.ele = elements[i];
                        i = elements.length;
                        return this;
                    }
                }
            }
        } else if (id === 'body') {
            return this;
        } else {
            if (this.debug) { console.log("PagesJS: invalid selector"); }
            return false;
        }
    } else {
        // No id paramter was given, return the about object
        return about;
    }
};
//	PagesJS prototype methods
p.prototype = {
    init: function () {
        // prevent init being used multiple times
        if (typeof window.meta !== 'undefined') { return; }
        window.meta = {
            title: document.getElementsByTagName('title')[0].innerHTML.replace('<', '&lt;').replace('>', '&gt;').replace(' & ', ' &amp; ')
        }
        if ("onhashchange" in window) {
            window.onhashchange = function () {
                var hash = window.location.hash.substring(2);
                if (hash.length > 1) {
                    p('_' + hash).exist().nav();
                }
            };
        } else {
            var prevHash = window.location.hash;
            window.setInterval(function () {
                if (window.location.hash !== prevHash) {
                    var hash = window.location.hash.substring(2);
                    if (hash.length > 1) {
                        p('_' + hash).exist().nav();
                    }
                }
            }, 500);
        }
        if (this.hash.length > 1) {
            p('_' + this.hash).exist().nav();
        }
    },
    forEach: function (fn, scope) {
        for (var i = 0, len = this.ele.length; i < len; ++i) {
            fn.call(scope, this.ele[i], i, this.ele);
        }
    },
    hide: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (var i = 0, len = this.ele.length; i < len; ++i) {
                    this.ele[i].style.display = 'none';
                }
                return this;
            } else {
                this.ele.style.display = 'none';
                return this;
            }
        } else {
            return false;
        }
    },
    show: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (var i = 0, len = this.ele.length; i < len; ++i) {
                    this.ele[i].style.display = 'inherit';
                }
                return this;
            } else {
                this.ele.style.display = 'inherit';
                return this;
            }
        } else {
            return false;
        }
    },
    toggle: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (var i = 0, len = this.ele.length; i < len; ++i) {
                    if (this.ele[i].style.display !== 'none') {
                        this.ele[i].style.display = 'none';
                    } else {
                        this.ele[i].style.display = 'inherit';
                    }
                }
                return this;
            } else {
                if (this.ele.style.display !== 'none') {
                    this.ele.style.display = 'none';
                } else {
                    this.ele.style.display = 'inherit';
                }
                return this;
            }
        } else {
            return false;
        }
    },
    trim: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    ltrim: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.replace(/\s+$/, '');
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.replace(/\s+$/, '');
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    rtrim: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.replace(/^\s+/, '');
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.replace(/^\s+/, '');
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    clear: function (start, end) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                var index1 = this.ele.value.indexOf(start);
                var index2 = this.ele.value.indexOf(end);
                return this.ele.value.slice(0, index1) + this.ele.value.slice(index2 + 1);
            } else if (typeof this.ele.innerHTML === "string") {
                var index1 = this.ele.innerHTML.indexOf(start);
                var index2 = this.ele.innerHTML.indexOf(end);
                return this.ele.innerHTML.slice(0, index1) + this.ele.innerHTML.slice(index2 + 1);
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    contains: function (str) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.indexOf(str) > -1;
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.indexOf(str) > -1;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    reverse: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.split('').reverse().join('');
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.split('').reverse().join('');
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    camelCase: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.replace(/\W+(.)/g, function (match, letter) {
                    return letter.toUpperCase();
                });
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.replace(/\W+(.)/g, function (match, letter) {
                    return letter.toUpperCase();
                });
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    inverse: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return this.ele.value.replace(/([a-z]+)|([A-Z]+)/g, function (match, lower, upper) {
                    return lower ? match.toUpperCase() : match.toLowerCase();
                });
            } else if (typeof this.ele.innerHTML === "string") {
                return this.ele.innerHTML.replace(/([a-z]+)|([A-Z]+)/g, function (match, lower, upper) {
                    return lower ? match.toUpperCase() : match.toLowerCase();
                });
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    capitalize: function (a) {
        if (typeof a === 'undefined' && a === null) {
            var all = false;
        } else {
            var all = a;
        }
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof this.ele.value === "string") {
                return all ? this.ele.value.replace(/\w+/g, function (word) {
                    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
                }) : this.ele.value.charAt(0).toUpperCase() + this.ele.value.substring(1).toLowerCase();
            } else if (typeof this.ele.innerHTML === "string") {
                return all ? this.ele.innerHTML.replace(/\w+/g, function (word) {
                    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
                }) : this.ele.innerHTML.charAt(0).toUpperCase() + this.ele.innerHTML.substring(1).toLowerCase();
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    disable: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if ((this.ele.tagName && this.ele.tagName.toLowerCase() === "textarea") || (this.ele.tagName && this.ele.tagName.toLowerCase() === "input" && this.ele.type.toLowerCase() === "text")) {
                this.ele.disabled = true;
                return this;
            } else {
                var inputs = this.ele.getElementsByTagName("input");
                var i = 0;
                for (i = 0; i < inputs.length; i++) {
                    inputs[i].disabled = true;
                }
                var selects = this.ele.getElementsByTagName("select");
                for (i = 0; i < selects.length; i++) {
                    selects[i].disabled = true;
                }
                var textareas = this.ele.getElementsByTagName("textarea");
                for (i = 0; i < textareas.length; i++) {
                    textareas[i].disabled = true;
                }
                var buttons = this.ele.getElementsByTagName("button");
                for (i = 0; i < buttons.length; i++) {
                    buttons[i].disabled = true;
                }
                return this;
            }
        } else {
            return false;
        }
    },
    enable: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if ((this.ele.tagName && this.ele.tagName.toLowerCase() === "textarea") || (this.ele.tagName && this.ele.tagName.toLowerCase() === "input" && this.ele.type.toLowerCase() === "text")) {
                this.ele.disabled = false;
                return this;
            } else {
                var inputs = this.ele.getElementsByTagName("input");
                var i = 0;
                for (i = 0; i < inputs.length; i++) {
                    inputs[i].disabled = false;
                }
                var selects = this.ele.getElementsByTagName("select");
                for (i = 0; i < selects.length; i++) {
                    selects[i].disabled = false;
                }
                var textareas = this.ele.getElementsByTagName("textarea");
                for (i = 0; i < textareas.length; i++) {
                    textareas[i].disabled = false;
                }
                var buttons = this.ele.getElementsByTagName("button");
                for (i = 0; i < buttons.length; i++) {
                    buttons[i].disabled = false;
                }
                return this;
            }
        } else {
            return false;
        }
    },
    stringify: function (obj) {
        if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
            if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
            return false;
        }
        if (obj && typeof obj === 'object') {
            if (window.JSON && window.JSON.stringify) {
                if ((this.ele.tagName && this.ele.tagName.toLowerCase() === "textarea") || (this.ele.tagName && this.ele.tagName.toLowerCase() === "input" && this.ele.type.toLowerCase() === "text")) {
                    this.ele.value = window.JSON.stringify(obj, function (key, value) {
                        if (typeof value === 'number' && !isFinite(value)) {
                            return String(value);
                        }
                        return value;
                    });
                } else {
                    this.ele.innerHTML = windowJSON.stringify(obj, function (key, value) {
                        if (typeof value === 'number' && !isFinite(value)) {
                            return String(value);
                        }
                        return value;
                    });
                }
                return this;
            } else {
                if (this.debug) { console.log('PagesJS: browser doesnt support json natively'); }
                return false;
            }
        } else {
            if (this.debug) { console.log('PagesJS: stringify accepts an object'); }
            return false;
        }
    },
    parse: function () {
        if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
            if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
            return false;
        }
        var data = "";
        if ((this.ele.tagName && this.ele.tagName.toLowerCase() === "textarea") || (this.ele.tagName && this.ele.tagName.toLowerCase() === "input" && this.ele.type.toLowerCase() === "text")) {
            if (typeof this.ele.value === "string" && this.ele.value !== null) {
                data = this.ele.value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                if (window.JSON && window.JSON.parse) {
                    return window.JSON.parse(data);
                } else {
                    if (this.debug) { console.log('PagesJS: browser doesnt support json natively'); }
                    return false;
                }
            } else {
                if (this.debug) { console.log('PagesJS: parse accepts a string'); }
                return false;
            }
        } else {
            if (typeof this.ele.innerHTML === "string" && this.ele.innerHTML !== null) {
                data = this.ele.innerHTML.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                if (window.JSON && window.JSON.parse) {
                    return window.JSON.parse(data);
                } else {
                    if (this.debug) { console.log('PagesJS: browser doesnt support json natively'); }
                    return false;
                }
            }
        }
    },
    html: function (replacement) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (typeof replacement === "undefined") {
                return this.ele.innerHTML;
            } else {
                this.ele.innerHTML = replacement;
                return this;
            }
        } else {
            return false;
        }
    },
    val: function (replacement) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            if (this.ele.tagName && this.ele.tagName.toLowerCase() === "input") {
                if (typeof replacement === "undefined") {
                    return this.ele.value;
                } else {
                    this.ele.value = replacement;
                    return this;
                }
            } else {
                if (this.debug) { console.log('PagesJS: method available for input selectors only.'); }
                return false;
            }
        } else {
            return false;
        }
    },
    style: function (property, value) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (var i = 0, len = this.ele.length; i < len; ++i) {
                    this.ele[i].style[property] = value;
                }
                return this;
            } else {
                this.ele.style[property] = value;
                return this;
            }
        } else {
            return false;
        }
    },
    remove: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            var elem;
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            (elem = this.ele).parentNode.removeChild(elem);
            return this;
        } else {
            return false;
        }
    },
    empty: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (var i = 0, len = this.ele.length; i < len; ++i) {
                    this.ele[i].innerHTML = "";
                }
                return this;
            } else {
                this.ele.innerHTML = "";
                return this;
            }
        } else {
            return false;
        }
    },
    addClass: function (classes) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            var className = "";
            var len, i = 0;
            if (typeof classes !== "string") {
                for (i = 0; i < classes.length; i++) {
                    className += " " + classes[i];
                }
            } else {
                className = " " + classes;
            }
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (i = 0, len = this.ele.length; i < len; ++i) {
                    this.ele[i].className += className;
                }
                return this;
            } else {
                this.ele.className += className;
                return this;
            }
        } else {
            return false;
        }
    },
    removeClass: function (remClass) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            var len, i = 0;
            if (typeof remClass === 'undefined' || this.ele === null) {
                if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                    for (i = 0, len = this.ele.length; i < len; ++i) {
                        this.ele[i].className = "";
                    }
                    return this;
                } else {
                    this.ele.className = "";
                    return this;
                }
            } else {
                if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                    for (i = 0, len = this.ele.length; i < len; ++i) {
                        while ((' ' + this.ele[i].className + ' ').indexOf(' ' + remClass + ' ') > -1) {
                            this.ele[i].className = this.ele[i].className.replace(new RegExp('\\b' + remClass + '\\b'), '');
                        }
                    }
                    return this;
                } else {
                    while ((' ' + this.ele.className + ' ').indexOf(' ' + remClass + ' ') > -1) {
                        this.ele.className = this.ele.className.replace(new RegExp('\\b' + remClass + '\\b'), '');
                    }
                    return this;
                }
            }
        } else {
            return false;
        }
    },
    hasClass: function (c) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            var r = true, e = this.ele.className.split(' '); c = c.split(' ');
            for (var i = 0; i < c.length; i++)
                if (e.indexOf(c[i]) === -1)
                    r = false;
            return r;
        } else {
            return false;
        }
    },
    attr: function (attr, val) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                for (var i = 0, len = this.ele.length; i < len; ++i) {
                    this.ele[i].setAttribute(attr, val);
                }
                return this;
            } else {
                this.ele.setAttribute(attr, val);
                return this;
            }
        } else {
            return false;
        }
    },
    append: function (elems) {
        if (typeof this.ele !== 'undefined' && this.ele !== null && typeof elems === "string") {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            this.ele.innerHTML = this.ele.innerHTML + elems;
            return this;
        } else {
            return false;
        }
    },
    prepend: function (elems) {
        if (typeof this.ele !== 'undefined' && this.ele !== null && typeof elems === "string") {
            if (typeof this.ele[1] !== 'undefined' && this.ele[1] !== null) {
                if (this.debug) { console.log('PagesJS: method available for unique selectors only.'); }
                return false;
            }
            this.ele.innerHTML = elems + this.ele.innerHTML;
            return this;
        } else {
            return false;
        }
    },
    goTo: function () {
        this.ele.scrollIntoView(true);
        return this;
    },
    addPage: function (value) {
        if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (this.ele.hasAttribute('page')) {
                if (this.debug) { console.log("PagesJS: page already exists as '" + this.ele.getAttribute('page') + "'"); }
                return false;
            } else {
                this.ele.setAttribute("page", value);
                return this;
            }
        } else {
            if (this.debug) { console.log("PagesJS: invalid selector"); }
            return false;
        }
    },
    exist: function (value) {
        if (typeof this.ele !== 'undefined' && this.ele !== null && typeof value !== 'undefined' && value !== null) {
            if (this.ele.hasAttribute('page')) {
                return this.ele.getAttribute('page') === value ? true : false;
            } else {
                return false;
            }
        } else if (typeof this.ele !== 'undefined' && this.ele !== null) {
            if (this.ele.hasAttribute('page')) {
                return this.ele.getAttribute('page') === this.id ? this : false;
            } else {
                return false;
            }
        }
    },
    // methods available to page selectors only
    title: function (value) {
        if (typeof this.ele !== 'undefined' && this.ele !== null && this.ele.hasAttribute('page')) {
            if (typeof value === 'undefined') {
                return this.ele.getAttribute('page-title');
            } else {
                this.ele.setAttribute("page-title", value);
                return this;
            }
        } else {
            if (this.debug) { console.log("PagesJS: pageTitle method only available for page selector"); }
            return false;
        }
    },
    change: function (callback) {
        var self = this;
        if (history && history.pushState) {
            window.addEventListener("popstate", function (e) {
                if (window.location.hash.substring(2) === self.id) {
                    callback({ page: self.id, title: document.getElementsByTagName('title')[0].innerHTML, node: self.ele });
                }
            });
        } else {
            window.addEventListener("hashchange", function (e) {
                if (window.location.hash.substring(2) === self.id) {
                    callback({ page: self.id, title: document.getElementsByTagName('title')[0].innerHTML, node: self.ele });
                }
            });
        }
    },
    nav: function (obj, callback) {
        //navigate
        if (typeof this.ele !== 'undefined' && this.ele !== null && this.ele.hasAttribute('page')) {
            var elements = document.getElementsByTagName('*');
            var i = 0;
            for (i = 0; i < elements.length; i++) {
                if (elements[i].getAttribute('page')) {
                    if (elements[i].getAttribute('page') === this.id) {
                        elements[i].style.display = 'inherit';
                    } else {
                        elements[i].style.display = 'none';
                    }
                }
            }
            // HTML5 history state
            if (window.history.replaceState) {
                // was a title given
                if (typeof obj === 'object' && typeof obj.title !== 'undefined') {
                    //title legacy: this is not currently supported by any major browsers.
                    document.getElementsByTagName('title')[0].innerHTML = obj.title;
                    window.history.pushState({
                        page: this.id
                    }, obj.title, this.canonical + "#!" + this.id);
                } else {
                    // is there a page-title attribute
                    if (this.ele.hasAttribute('page-title')) {
                        //title legacy: this is not currently supported by any major browsers.
                        document.getElementsByTagName('title')[0].innerHTML = this.ele.getAttribute('page-title');
                        window.history.pushState({
                            page: this.id
                        }, this.ele.getAttribute('page-title'), this.canonical + "#!" + this.id);
                    } else {
                        // is there an orriginal page title to prepend
                        if (typeof window.meta === 'object' && typeof window.meta.title !== 'undefined') {
                            //title legacy: this is not currently supported by any major browsers.
                            document.getElementsByTagName('title')[0].innerHTML = window.meta.title + " | " + this.id;
                            window.history.pushState({
                                page: this.id
                            }, window.meta.title + " | " + this.id, this.canonical + "#!" + this.id);
                        } else {
                            // prepend the current page title
                            //title legacy: this is not currently supported by any major browsers.
                            document.getElementsByTagName('title')[0].innerHTML = this.page_title + " | " + this.id;
                            window.history.pushState({
                                page: this.id
                            }, this.page_title + " | " + this.id, this.canonical + "#!" + this.id);
                        }
                    }
                }
            } else {
                // update Title
                // was a title given
                if (typeof obj === 'object' && typeof obj.title !== 'undefined') {
                    document.getElementsByTagName('title')[0].innerHTML = obj.title;
                } else {
                    // is there a page-title attribute
                    if (this.ele.hasAttribute('page-title')) {
                        document.getElementsByTagName('title')[0].innerHTML = this.ele.getAttribute('page-title');
                    } else {
                        // is there an orriginal page title to prepend
                        if (typeof window.meta === 'object' && typeof window.meta.title !== 'undefined') {
                            document.getElementsByTagName('title')[0].innerHTML = window.meta.title + " | " + this.id;
                        } else {
                            // prepend the current page title
                            document.getElementsByTagName('title')[0].innerHTML = this.page_title + " | " + this.id;
                        }
                    }
                }
            }
            // Update canonical
            var link_arr = document.getElementsByTagName("link");
            for (i = 0; i < link_arr.length; i++) {
                if (link_arr[i].getAttribute('rel') === 'canonical') {
                    link_arr[i].href = this.canonical + "#!" + this.id;
                }
            }
            // Inform Google Analytics of the change
            if (typeof window._gaq !== 'undefined') {
                window._gaq.push(['_trackPageview', '/#!' + this.id]);
            }
            // Inform ReInvigorate of a state change
            if (typeof window.reinvigorate !== 'undefined' && typeof window.reinvigorate.ajax_track !== 'undefined') {
                reinvigorate.ajax_track(window.location);
                // ^ we use the full url here as that is what reinvigorate supports
            }
            if (typeof callback !== 'undefined') {
                var self = this;
                return callback({ page: self.id, title: document.getElementsByTagName('title')[0].innerHTML, node: self.ele });
            } else {
                return this;
            }
        } else {
            if (this.debug) { console.log("PagesJS: nav method only available for page selector"); }
            return false;
        }
    },
    removePage: function () {
        if (typeof this.ele !== 'undefined' && this.ele !== null && this.ele.hasAttribute('page')) {
            this.ele.removeAttribute("page");
            return this;
        } else {
            if (this.debug) { console.log("PagesJS: invalid selector or no page attribute"); }
            return false;
        }
    }
};