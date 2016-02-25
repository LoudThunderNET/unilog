var unilogServices = angular.module('unilogServices', [])
.factory('serviceData', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
  return function (url, type) {
    var d = $q.defer();
    var needHttp = true;
    if ($rootScope.cache !== undefined) {
      var cachedData = $rootScope.cache.get(url);
      if (cachedData !== undefined && cachedData !== null) {
        d.resolve({ Type: type, Data: cachedData });
        needHttp = false;
      }
    }
    if (needHttp)
      $http
        .get(url)
          .success(function (data, status, headers, config) {
            $rootScope.cache.put(url, data);
            d.resolve({ Type: type, Data: data });
          })
            .error(function (data, status, headers, config) {
              d.reject(status);
            });
    return d.promise;
  };
} ]);