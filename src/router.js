(function(global, undefined){

"use strict";

function Router(options) {
    options = typeof options === 'object' ? options : {};
    this.version = '0.8';
    this.routes = options.routes || [];
    this.current_route = {};
    this.parse_uri_settings = {
        uri_parser: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
        query_parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
        smart_uri_parser: /(:\w+)/g,
        key: ['source','protocol','authority','userInfo','user','password','host','port','relative','path','directory','file','query','anchor']
    };
}

Router.prototype = {

    add_route: function(route) {
        var router = this;
        if (is_array(route)) {
            route.forEach(function(i) { router.routes.push(router.compile_route(i)); });
        }
        else {
            router.routes.push(router.compile_route(route));
        }
    },

    compile_route: function(route) {
        if (typeof route.route === 'string') {
            if (route.route.indexOf(':') !== -1) {
                var matches = route.route.match(this.parse_uri_settings.smart_uri_parser);
                route.matches = [];
                matches.forEach(function(match) {
                    route.route = route.route.replace(match, '(.+)?');
                    route.matches.push(match.slice(1));
                });
            }
            route.route = new RegExp('^' + route.route + '$');
        }
        return route;
    },

    find_route: function(url) {
        var uri = this.parse_uri(url),
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
            loc = global.location,
            history = global.history;
        router.supported = !!(history && history.pushState);
        if (router.supported) {
            global.onpopstate = function(evt) {
                router.run(global.location.href);
            };
        }
        global.document.addEventListener('click', function(evt) {
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
                            history.pushState(router.parse_uri(href), null, href);
                        }
                    }
                }
            }
        });
    },

    run: function(url, force) {
        var route = this.find_route(url);
        if (route) {
            route.callback(route.params, route);
            this.current_route = route;
        }
        else {
            if (global.location.href !== url || force === true) {
                global.location.href = url;
            }
        }
    },

    parse_uri: function(str) {
        var o = this.parse_uri_settings,
            m = o.uri_parser.exec(str),
            uri = { params: {} },
            i = 14;
        while (i--) { uri[o.key[i]] = m[i] || ''; }
        uri[o.key[12]].replace(o.query_parser, function (a, b, c) {
            if (b) { uri.params[b] = decodeURIComponent(c); }
        });
        return uri;
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

function is_array(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}


var define, module;
if (typeof define !== 'undefined' && define.amd) { define(function() { return Router; }); }
else if (typeof module !== 'undefined' && module.exports) { module.exports = Router; }
else { global.Router = Router; }

})(global);
