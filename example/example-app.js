require(['../src/router'], function(Router) {

    router = new Router();
    router.add_route([
        { route: /^\/example\/example.html\/$/, callback: sample_callback },
        { route: /^\/example\/example\/example.html\/apples$/, callback: sample_callback },
        { route: /^\/example\/example.html\/oranges$/, callback: sample_callback },
        { route: /^\/example\/example.html\/captured\/(\w+)\/(\w+)$/, matches: ['param1', 'param2'], callback: sample_callback },
        { route: /^\/example\/example.html\/bypassed$/, callback: sample_callback }
    ]);

    router.observe();
    router.run(window.location);

    function sample_callback(options, route) {
        console.log(options);
        console.log(route);
    }

});