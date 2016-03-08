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
// constant service
unilogServices.constant("unilogConst", {
  AndOperation    : "LogicalAnd", 
  OrOperation     : "LogicalOr", 
  NoneOperation   : "None",
  RightAlign      : 'right',
  LeftAlign       : 'left',
  CenterAlign     : 'center',
  TopAlign        : 'top',
  MiddleAlign     : 'middle',
  BottomAlign     : 'bottom',
  Interval        : 'interval',
  Day             : 'day',
  Environment     : 0,
  Application     : 1,
  BusinessProcess : 2  
});

unilogServices.factory('utils', ['$location', 'unilogConst', function($location, unilogConst){
  var s = {
    // парсит строку  в массив если в ней есть ";" иначе помещает в массив саму строку в массив
    parseStringIntoArray:function (inputStr) {
      var resultArray = [];
      if (!angular.isString(inputStr)) // если не строка, вернуть пустой массив
        return resultArray;

      if (inputStr.length == 0)       // если строка, но пустая - вернуть пустой массив
        return resultArray;

      if (inputStr.indexOf(';') > 0) {  // разбить строку по ; и запухнуть в массив, который вернуть
        inputStr.split(';').forEach(function (e, i) {
          resultArray.push(e);
        });
      }
      else
        resultArray.push(inputStr);   // в строке нет ; и она не пустая, поэтому просто вернм её как элемент массива
      return resultArray;
    },
    // формирует объект запроса
    PrepareRequest : function (messageIdTo, scope) {
      // это надо для режима Продолжить. Так сервис поиска работает
      if (messageIdTo !== undefined)
        scope.request.MessageIdTo = messageIdTo;
      else
        scope.request.MessageIdTo = null;
      
      scope.request.OperationId = Math.uuid(); // на каждый запрос нужен новый GUID
      // начальная дата
      if(scope.dayOrInterval == unilogConst.Interval){
        scope.request.CreationDateFrom = scope.start_date.getCorrectedDateByTimeZone(); //Странно, правда ? Это потому что javascript хранит дату в UTC и также её сериализует и вместо 2016-01-02T12:13:45 получим 2016-01-02T09:13:45
        scope.request.CreationDateTo = scope.end_date.getCorrectedDateByTimeZone();    // конечная дата
      }
      else{
        var year = scope.day.getFullYear();
        var month = scope.day.getMonth();
        var day = scope.day.getDate();
        scope.request.CreationDateFrom = new Date(year, month, day, 0,0,0).getCorrectedDateByTimeZone();
        scope.request.CreationDateTo = new Date(year, month, day+1,0,0,0).getCorrectedDateByTimeZone();
      }
      // формируем массив ИД источников
      scope.request.SourceIdValues.splice(0, scope.request.SourceIdValues.length);              // очищаем массив
      // надо пройтись по хостам приложений и выбрать все записи у которых тип среды = выбранной среде,
      var hosts = scope.appHosts.filter(function (app, appIndex) {
        return scope.source.sources[0].selected.Type.length == 0 || scope.source.sources[0].selected.Type == app.Type;
      });
      // затем из таблицы Source надо выбрать все записи у которых ИдХоста входит в выбранные ранее список,
      // а приложения = выбранное приложение
      // если прилождение не выбрано. то надо выбрать все записи ИдХоста у которых входит в выбранные ранее список
      var application = scope.source.sources[1].selected;
      if(scope.Sources == undefined || !angular.isArray(scope.Sources)){
        alert('Справочник источников еще не загружен. Дождитесь загрузки и повторите попытку');
        return false;
      }
      scope.Sources.forEach(function (src, srcIndex) {
        hosts.forEach(function (h, hIndex) {
          if (src.ApplicationHostID == h.ID &&
               ((application !== undefined && application.ID == src.ApplicationID) ||
                 application !== undefined && application.ID == -1) ||
                 application == undefined)
            scope.request.SourceIdValues.push(src.ID);
        });
      });
      // типы сообщений 
      scope.request.MessageTypeValues.splice(0, scope.request.MessageTypeValues.length);        // очищаем массив
      //выбираем только те, что отмечены галкой на фронте
      scope.messageTypes.forEach(function (mesType, mesTypeIndex) {
        if (mesType.Enabled)
          scope.request.MessageTypeValues.push(mesType.ID);
      });

      // messageText
      scope.request.MesageTextValues.splice(0, scope.request.MesageTextValues.length);         //clear array
      scope.request.MesageTextValues = this.parseStringIntoArray(scope.messageText);
      // additionalInfo
      scope.request.AdditionalInfoValues.splice(0, scope.request.AdditionalInfoValues.length); // clear array
      scope.request.AdditionalInfoValues = this.parseStringIntoArray(scope.additionalInfo);
      // methodName
      scope.request.MethodNameValues.splice(0, scope.request.MethodNameValues.length);        // clear array
      scope.request.MethodNameValues = this.parseStringIntoArray(scope.methodName);
      // ParamValueConditions
      scope.request.ParamValueConditions.splice(0, scope.request.ParamValueConditions.length); // clear array
      scope.params.forEach(function (param, paramIndex) {
        if (param.enabled) // помещаем те параметры на против который стоит галка
          scope.request.ParamValueConditions.push({
            ParamId: param.paramName.ID,
            StringValues: this.parseStringIntoArray(param.paramValue)
          });
      });
      return true;
    },
    // формирует URL
    FormURL : function (scope) {
      // начинаем с типа интервала
      var urlParts = [];
      urlParts.push('drm=' + (scope.dayOrInterval == unilogConst.Day ? '0' : '1'));
      if (scope.dayOrInterval == unilogConst.Day)
        urlParts.push('day=' + Math.IntToStrNN(scope.day.getDate(), 2) + '.' + Math.IntToStrNN(scope.day.getMonth() + 1, 2) + '.' + Math.IntToStrNN(scope.day.getFullYear(), 2).substr(2, 2));

      else {
        urlParts.push('sd=' + Math.IntToStrNN(scope.start_date.getDate(), 2) + '.' + Math.IntToStrNN(scope.start_date.getMonth() + 1, 2) + '.' + Math.IntToStrNN(scope.start_date.getFullYear(), 2).substr(2, 2) + '_' + Math.IntToStrNN(scope.start_date.getHours(), 2) + '.' + Math.IntToStrNN(scope.start_date.getMinutes(), 2));
        urlParts.push('ed=' + Math.IntToStrNN(scope.end_date.getDate(), 2) + '.' + Math.IntToStrNN(scope.end_date.getMonth() + 1, 2) + '.' + Math.IntToStrNN(scope.end_date.getFullYear(), 2).substr(2, 2) + '_' + Math.IntToStrNN(scope.end_date.getHours(), 2) + '.' + Math.IntToStrNN(scope.end_date.getMinutes(), 2));
        urlParts.push('ad=0');
      }
      // источник данных
      urlParts.push('sid=' + scope.source.sources[0].selected.ID);
      // тип операции предиката
      if(scope.request.ParamValueExpressionMode == unilogConst.OrOperation)
        urlParts.push('po=2')
      // параметры
      var isAllValid = true;
      scope.params.forEach(function (param, paramIndex) {
        if (param.paramName.Code !== undefined && param.paramValue.length > 0)
          urlParts.push((param.enabled ? '' : '~') + param.paramName.Code + '=' + param.paramValue);
        else 
          isAllValid = false;
      });
      if(!isAllValid)
        return;
      // типы сообщений
      var allSelected = true;
      var selectedTypes = '';
      scope.messageTypes.forEach(function (mType, mTypeIndex) {
        allSelected = allSelected && mType.Enabled;
        if (mType.Enabled)
          selectedTypes = selectedTypes + ((selectedTypes.length > 0) ? '.' : '') + mType.ID;
      });
      if (!allSelected) {
        urlParts.push('types=' + selectedTypes);
      }
      if (scope.messageText.length > 0)
        urlParts.push('mt=' + scope.messageText);
      if (scope.additionalInfo.length > 0)
        urlParts.push('at=' + scope.additionalInfo);
      if (scope.methodName.length > 0)
        urlParts.push('mn=' + scope.methodName);
      //$rootScope.reload = false;
      //window.history.pushState({},'','#/search?' + urlParts.join('&'));
      $location.url('search?' + urlParts.join('&'), false);
    },
    // затеняет кнопки и показывает "колесо фортуны"
    StartRequest : function () {
      var img = angular.element(document.getElementById('wait'));
      var cmdFind = angular.element(document.getElementById('cmdFind'));
      var cmdContinue = angular.element(document.getElementById('cmdContinue'));
      var cmdCancel = angular.element(document.getElementById('cmdCancel'));

      cmdFind.attr('disabled', 'disabled');
      cmdContinue.attr('disabled', 'disabled');
      cmdCancel.removeAttr('disabled');
      img.css('display', 'block');
    },
    // активизирует кнопки, скрывает "колесо фортуны"
    EndRequest : function () {
      var img = angular.element(document.getElementById('wait'));
      var cmdFind = angular.element(document.getElementById('cmdFind'));
      var cmdContinue = angular.element(document.getElementById('cmdContinue'));
      var cmdCancel = angular.element(document.getElementById('cmdCancel'));

      img.css('display', 'none');
      cmdFind.removeAttr('disabled');
      cmdContinue.removeAttr('disabled');
      cmdCancel.attr('disabled', 'disabled');
    },
    // парсим типы сообщений
    ParseMessageTypes : function(scope){
      if ($location.$$search.types !== undefined) {
        var mesTypes = $location.$$search.types.split('.');
        scope.messageTypes.forEach(function (mesType, mesTypeIndex) {
          var reqMesType = mesTypes.find(function (r, rIndex) {
            return parseInt(r) == mesType.ID;
          });
          if (reqMesType == undefined)
            mesType.Enabled = false;
        });
      }
    },
    // парсим параметры зароса
    ParseSearchParams : function(scope){
      scope.dayOrInterval = unilogConst.Interval;   // значение по умолчанию
      var dayValue = new Date();                     // значение по-умолчанию
      var startDate = new Date(Date.now() - 86400000);
      var startDateValue = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getHours(), startDate.getMinutes());
      var endDateValue = new Date(dayValue.getFullYear(), dayValue.getMonth(), dayValue.getDate(), dayValue.getHours(), dayValue.getMinutes());

      // тип временного интервала
      if ($location.$$search.drm != undefined && $location.$$search.drm == '0') {
        scope.dayOrInterval = unilogConst.Day;
        if ($location.$$search.ad != undefined && $location.$$search.ad == '0') // произвольная дата
          if ($location.$$search.day != undefined) // дата назначена и её берем в качестве значения
          {
            var date = parseInt($location.$$search.day.substring(0, 2));
            var month = parseInt($location.$$search.day.substring(3, 5));
            var year = parseInt($location.$$search.day.substring(6, 8));
            dayValue = new Date(year, month, date);
          }
      }
      scope.day = dayValue;

      // парсим даты
      if ($location.$$search.sd != undefined && $location.$$search.ed != undefined && scope.dayOrInterval == unilogConst.Interval) // парсим интервал если указан тип "интервал"
      { //    01234567890123
        // sd=06.01.16_20.00
        var curCentury = (new Date()).getFullYear().toString().substr(0, 2);
        var date = parseInt($location.$$search.sd.substring(0, 2));
        var month = parseInt($location.$$search.sd.substring(3, 5)) - 1;
        var year = parseInt(curCentury + $location.$$search.sd.substring(6, 8));
        var hour = parseInt($location.$$search.sd.substring(9, 11));
        var min = parseInt($location.$$search.sd.substring(12));
        startDateValue = new Date(year, month, date, hour, min);
        //    01234567890123
        // ed=06.01.16_20.00
        date = parseInt($location.$$search.ed.substring(0, 2));
        month = parseInt($location.$$search.ed.substring(3, 5)) - 1;
        year = parseInt(curCentury + $location.$$search.ed.substring(6, 8));
        hour = parseInt($location.$$search.ed.substring(9, 11));
        min = parseInt($location.$$search.ed.substring(12));
        endDateValue = new Date(year, month, date, hour, min);
      }
      // даты интервала
      scope.start_date = startDateValue;
      scope.end_date = endDateValue;
      // парсим тип операции с параметрами
      var operatonType = unilogConst.AndOperation; // по-умолчанию
      if($location.$$search.po !== undefined && $location.$$search.po == '2')
        operatonType = unilogConst.OrOperation;
      scope.request.ParamValueExpressionMode   = operatonType ;
      // тип источника      
      scope.sid = $location.$$search.sid != undefined ? $location.$$search.sid : -1;
      scope.messageText = $location.$$search.mt != undefined ? $location.$$search.mt : '';
      scope.additionalInfo = $location.$$search.at != undefined ? $location.$$search.at : '';
      scope.methodName = $location.$$search.mn != undefined ? $location.$$search.mn : '';
    }
  };
  return s;
}]);