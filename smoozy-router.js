var Router = {};

(function (Router) {
    var routes = {};
    var currentRoute = null;
    var previousRoute = null;

    var systemState = null;// переменная отвечаетза то, что бы понять, был ли активирован роут или была нажата кнопка назад\вперед

    var refsAttr = 'sup-ref';

    Router.init = function () {
        if (!location.hash) {
            location.hash = '#/';
        }

        var refs = document.querySelectorAll('a['+refsAttr+']');

        var clickHandler = function (event) {
            event.preventDefault();
            event.stopPropagation();

            var url = this.getAttribute(refsAttr);

            if (checkIfRouteNameIfRef(url)) {
                var params = transformRefAttributeToParameter(this);
                goUrl(params[0], params[1]);
            } else {
                if (/#/.test(url)) {
                    url = url.replace(/#/);
                }

                goUrl(url);
            }
        };

        for (var i = 0, n = refs.length; i < n; i++) {
            var element = refs[i];
            element.addEventListener('click', clickHandler);

        }

        goUrl(location.hash.replace(/#/, ''));

        window.addEventListener("hashchange", function (event) {
            if (systemState == 1) {
                var matches = event.newURL.match(/#(.*)$/);
                if (matches[1]) {
                    goUrl(matches[1]);
                }
            }
            systemState = null;
            console.log('hashchange');
        }, false);

        window.onpopstate = function () {
            systemState = 1;
            console.log('onpopstate');
        };
    };

    /**
     * Check if we need to parse attribute
     *
     * @param value
     *
     * @returns {boolean}
     */
    function checkIfRouteNameIfRef(value)
    {
        var regExp = new RegExp("goUrl", 'i');
        return regExp.test(value)
    }

    /**
     * Parse attribute
     *
     * @param element
     *
     * @returns {*}
     */
    function transformRefAttributeToParameter(element)
    {
        // Parse need attribute of the ref and transform it into
        // route name and object of parameters
        var attr = element.getAttribute(refsAttr);
        if (checkIfRouteNameIfRef(attr)) {
            var matches = attr.match(/goUrl\((.*)\)/);
            if (matches.length) {
                var params = matches[1];
                if (!params) {
                    throw new Error('Expected Parameters for refference '+element.innerHTML);
                }

                // фигурная скобка что бы учесть объекты, в которых > 1 поля
                params = params.split(', {');
                params[0] = params[0].replace(/\'/g, '');

                if (params[1]) {
                    params[1] = JSON.parse(('{'+params[1]).replace(/\'/g, '"'));
                }

                return [params[0], params[1]];
            }
        }

        return null;
    }

    /**
     * Set url
     *
     * @param url
     */
    function setUrl(url)
    {
        location.hash = '#' + url;
    }

    /**
     * @parameter route Route name or url
     * @parameter paramsObject Parameters for the route
     **/
    function goUrl(route, paramsObject)
    {
        systemState = 2;
        var r = {};
        var destinationUrl = getDestinationUrl(route, paramsObject, r);

        previousRoute = currentRoute;
        currentRoute = r;

        setUrl(destinationUrl);

        var ob = {
            title: document.title,
            url: location.pathname + location.hash
        };

        //history.pushState(ob, ob.title, ob.url);

        if (r.action) {
            r.action();
        }
    }

    /**
     *
     * @param route          url or route name
     * @param paramsObject   params for route
     * @param r              route object which keeps the route which was mapped to url
     *
     * @returns {*}
     */
    function getDestinationUrl(route, paramsObject, r)
    {
        if (r === undefined) {
            r = {};
        }

        var routeIsName = false;// true if parameter route is a name of a route
        if (routes[route]) {
            r = extend(r, routes[route]);
            routeIsName = true;
        } else {
            for (var key in routes) {
                if (!routes.hasOwnProperty(key)) {
                    continue;
                }

                var currentRoute = routes[key];
                var regExp = getRegExpForRoute(currentRoute);

                // If we found meed route
                if (regExp.test(route)) {
                    r = extend(r, routes[key]);
                    break;
                }
            }
        }

        if (!r.url) {
            throw new Error('Unknown route');
        }

        if (routeIsName) {
           var  destinationUrl = formDestinationUrl(r.url, paramsObject, r, true);
        } else {
            destinationUrl = formDestinationUrl(route, paramsObject, r);
        }

        return destinationUrl;
    }

    /**
     * Get regExp fot the route
     *
     * @param currentRoute   object of route
     */
    function getRegExpForRoute(currentRoute)
    {
        var url = '';

        // Here we create full url considering parents routes
        while(true) {
            var r1 = currentRoute.url.replace(/^\//, '');
            if (currentRoute.url && !url && !r1) {
                r1 = currentRoute.url;
            }
            var r2 = url.replace(/^\//, '');
            url = url ? r1 + '/' + r2 : r1;
            if (currentRoute.parent) {
                currentRoute = routes[currentRoute.parent];
            } else {
                break;
            }
        }

        // Normalize url
        url = url.replace(/\/\//gi, '\/');
        var urlParts = url.split('/');
        // Remove first element from the array
        urlParts.shift();
        var newUrl = '';
        // create regExp from url parts
        for (var i = 0; i < urlParts.length; i++) {
            newUrl += '/' + urlParts[i].replace(/{.*}/, '[^/]+');
        }

        return new RegExp('^'+newUrl+'$', 'i');
    }

    /**
     * Формируем из роута урл, подставляя параметры, если это необходимо
     **/
    function formDestinationUrl(route, paramsObject, r, isRoute)
    {
        var urlParts = route.split('/');
        // Remove first element from the array
        urlParts.shift();
        var destinationUrl = '';
        for (var i = 0; i < urlParts.length; i++) {
            // Check if we need to use paramters
            if (/{/.test(urlParts[i]) || /}/.test(urlParts[i])) {
                var part = urlParts[i]
                    .replace(/{/, '')
                    .replace(/}/, '');

                if (!paramsObject[part]) {
                    throw new Error();
                }
                destinationUrl += '/' + paramsObject[part];
            } else {
                destinationUrl += '/' + urlParts[i];
            }
        }

        // If 'route' is the url of the current route,
        // we need to ask it's parrents and create final url
        // otherwise we do nothing (if we got a normal url)
        if (r.parent && isRoute) {
            destinationUrl = formDestinationUrl(routes[r.parent].url, paramsObject, routes[r.parent]) + destinationUrl;
            destinationUrl = destinationUrl.replace(/\/\//, '\/');
        }

        return destinationUrl;
    }

    /**
     * Extend ob1 with properties from ob2
     *
     * @param ob1
     * @param ob2
     *
     * @returns {*}
     */
    function extend(ob1, ob2)
    {
        for (var key in ob2) {
            if (ob2.hasOwnProperty(key)) {
                ob1[key] = ob2[key];
            }
        }
        return ob1;
    }

    /**
     * Add new route
     *
     * sample
     * {
		url: /,
		action: function (){}
	* }
     **/
    Router.add = function (name, settings) {
        settings.name = name;
        routes[name] = settings;

        return Router;
    };

    /**
     * Just go to an url
     *
     * @param route
     * @param paramsObject
     */
    Router.goUrl = function (route, paramsObject) {
        goUrl(route, paramsObject);
    };

    Router.getCurrentRoute = function() {
        if (currentRoute) {
            return currentRoute.name;
        }
    }
})(Router);

