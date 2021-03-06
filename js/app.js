'use strict';

/* App Module */

var unilogApp = angular.module('unilogApp', [
  'ngRoute',
  'unilogControllers',
  'unilogServices',
  'ngSanitize',
  'ui.select',
  'ui.layout',
  'ngTouch',
  't.grid',
  'environment',
  'xmlViewer',
]).config(['$routeProvider', '$httpProvider',
  function ($routeProvider, $httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $routeProvider.
      when('/search', {
        templateUrl: 'views/search-view.html',
        controller: 'searchController'
      }).
      when('/message', {
        templateUrl: 'views/message-view.html',
        controller: 'messageViewController'
      }).
      when('/search:searchParams', {
        templateUrl: 'views/search-view.html',
        controller: 'searchController'
      }).
      otherwise({
        redirectTo: '/search?drm'
      });
  } ]).filter('propsFilter', function () {
    return function (items, props) {
      var out = [];

      if (angular.isArray(items)) {
        items.forEach(function (item) {
          var itemMatches = false;

          var keys = Object.keys(props);
          for (var i = 0; i < keys.length; i++) {
            var prop = keys[i];
            var text = props[prop].toLowerCase();
            if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
              itemMatches = true;
              break;
            }
          }

          if (itemMatches) {
            out.push(item);
          }
        });
      } else {
        // Let the output be the input untouched
        out = items;
      }

      return out;
    }
  })
  .run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
    // http://joelsaupe.com/programming/angularjs-change-path-without-reloading/
    var original = $location.url;
    $location.url = function (url, reload) {
        if (reload !== undefined &&  reload === false) {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }
        return original.apply($location, [url]);
    };
}]);