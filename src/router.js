(function(window, undefined){

"use strict";

function Router(options) {
    options = typeof options === 'object' ? options : {};
    this.version = '0.8';
    this.routes = options.routes || [];
    this.current_route = {};
}

Router.prototype = {

    add_route: function(route) {
        if (Object.prototype.toString.call(route) === '[object Array]') {
            this.routes = this.routes.concat(route);
        }
        else {
            this.routes.push(route);
        }
    },

    find_route: function(url) {
        var uri = parse_uri(url),
            route = null,
            found = false;
        this.routes.forEach(function(i, idx) {
            if (found) { return false; }
            if (i.route && i.route.test(uri.path)) {
                found = true;
                route = copy_obj(i);
            }
        });
        if (route) {
            route.params = uri.params;
            var matches = uri.path.match(route.route).slice(1);
            if (matches && matches.length && route.matches.length) {
                matches.forEach(function(i, idx) {
                    route.params[ route.matches[idx] ] = decodeURIComponent(i);
                });
            }
        }
        return route;
    },

    observe: function() {
        var router = this,
            loc = window.location,
            history = window.history;
        router.supported = !!(history && history.pushState);
        if (router.supported) {
            window.onpopstate = function(evt) {
                router.run(window.location.href);
            };
        }
        window.document.addEventListener('click', function(evt) {
            var el = evt.target,
                href = el.href,
                bypass = el.getAttribute('data-bypass');
            if (el.tagName === 'A' && href) {
                var root = loc.protocol + '//' + loc.host + '/';
                if (href.slice(0, root.length) === root) {
                    if ((bypass && bypass === 'true') || evt.defaultPrevented || evt.metaKey || evt.ctrlKey) {
                        return;
                    }
                    else {
                        if (router.supported) {
                            evt.preventDefault();
                            router.run(href);
                            history.pushState(parse_uri(href), null, href);
                        }
                    }
                }
            }
        });
    },

    run: function(url) {
        var route = this.find_route(url);
        if (route) {
            route.callback(route.params, route);
            this.current_route = route;
        }
        else {
            window.location.href = url;
        }
    }
};

function copy_obj(obj) {
    if (typeof obj === 'undefined') {
        return obj;
    }
    var c = {}, i;
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            c[i] = obj[i];
        }
    }
    return c;
}

var parse_uri_settings = {
    uri_parser: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
    query_parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
    key: ['source','protocol','authority','userInfo','user','password','host','port','relative','path','directory','file','query','anchor']
};

function parse_uri(str) {
    var o = parse_uri_settings,
        m = o.uri_parser.exec(str),
        uri = { params: {} },
        i = 14;
    while (i--) { uri[o.key[i]] = m[i] || ''; }
    uri[o.key[12]].replace(o.query_parser, function (a, b, c) {
        if (b) { uri.params[b] = decodeURIComponent(c); }
    });
    return uri;
}

if (typeof define !== 'undefined' && define.amd) { define(function() { return Router; }); }
else if (typeof module !== 'undefined' && module.exports) { module.exports = Router; }
else { window.Router = Router; }

})(window);
