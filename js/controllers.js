'use strict';

/* Controllers */

// /search?drm=1&ad=1&sid=-3&mt=Text&at=Add&sn=Service&mn=Method&AccountNumber=3453452v23454
// /search?drm=0&day=07.01.16&sid=-3&mt=Text&at=Add&sn=Service&mn=Method&AccountNumber=3453452v23454
// /search?drm=1&ad=0&sd=06.01.16_20.00&ed=07.01.16_20.01&sid=-3&mt=Text&at=Add&sn=Service&mn=Method&AccountNumber=3453452v23454
// /message?messageId=310643682
// drm - за день или в интервале
// day - за один день
// sd - начальная дата в формате dd.mm.yy_hh.mm
// ed - конечная дата в формате dd.mm.yy_hh.mm
// sid - источник данных
// mt - MessageText
// at - AdditionalInfo
// mn - Method Name
// AccountNumber, ApplicationUser, B2BID, CascoNumber, CashbookID, ChainID, Command, CurrentDIStatus
var unilogControllers = angular.module('unilogControllers', [])
// constant service
.constant("unilogConst", {
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

unilogControllers.controller('searchController',
[
  '$scope',
  '$routeParams',
  '$http',
  '$document',
  '$timeout',
  '$q',
  'unilogConst',
  'environment',
  '$rootScope',
  '$location',
  '$cacheFactory',
  'serviceData',
  function ($scope, $routeParams, $http, $document, $timeout, $q, unilogConst, environment, $rootScope, $location, $cacheFactory, serviceData) {
    if ($rootScope.cache == undefined)
      $rootScope.cache = $cacheFactory('dic');
    // настраиваем колонки грида
    $scope.config = {
      columnsDefinition: [
            {
              caption: 'Id сообщения',                                     // заголовок
              pinned: true,                                               // замороженный ли столбец
              width: 80,                                                // ширина
              headerVerticalAlign: unilogConst.MiddleAlign,                            // выравнивание по вертикаль заголовка
              headerHorAlign: unilogConst.CenterAlign,                            // выравниание по горизонтали загоовка
              sizable: true,                                               // может ли колонка менять размер
              valign: unilogConst.TopAlign,                               // выравниванием содержимого ячейки по вертикали
              halign: unilogConst.RightAlign,                             // выравнивание содержимого ячейки по горизонтали
              fieldName: 'Id',                                               // если не задан шаблон ячейки то выводиться это поле свойства data
              cellTemplate: '<a href="#/message?messageId={{data.Id}}">{{data.Id}}</a>'
            },
            {
              caption: 'Тип',
              pinned: false,
              width: 30,
              headerVerticalAlign: unilogConst.MiddleAlign,
              headerHorAlign: unilogConst.CenterAlign,
              sizable: true,
              valign: unilogConst.TopAlign,
              halign: unilogConst.CenterAlign,
              fieldName: 'TypeId',
              cellTemplate: '<img ng-if="data.TypeId==1" src="images/error_plain.png" alt="Ошибка" title="Ошибка" style="width:24px; height:24px;"/>' +
                            '<img ng-if="data.TypeId==2" src="images/critical_plain.png" alt="Критическая ошибка" title="Критическая ошибка" style="width:24px; height:24px;"/>' +
                            '<img ng-if="data.TypeId==3" src="images/debug_plain.png" alt="Отладочное сообщение" title="Отладочное сообщение" style="width:24px; height:24px;"/>' +
                            '<img ng-if="data.TypeId==4" src="images/info_plain.png" alt="Информационное сообщение" title="Информационное сообщение" style="width:24px; height:24px;"/>' +
                            '<img ng-if="data.TypeId==5" src="images/trace_plain.png" alt="Трасировочное сообщение" title="Трасировочное сообщение" style="width:24px; height:24px;"/>'
            },
            {
              caption: 'Дата и время',
              pinned: false,
              width: 105,
              headerVerticalAlign: unilogConst.MiddleAlign,
              headerHorAlign: unilogConst.CenterAlign,
              sizable: true,
              valign: unilogConst.TopAlign,
              halign: unilogConst.LeftAlign,
              cellTemplate: '{{data.CreationDate.replace("T"," ").substr(0, 19)}}'
            },
            {
              caption: 'Текст сообщения',
              pinned: false,
              width: 250,
              headerVerticalAlign: unilogConst.MiddleAlign,
              headerHorAlign: unilogConst.CenterAlign,
              sizable: true,
              valign: unilogConst.TopAlign,
              halign: unilogConst.LeftAlign,
              fieldName: 'MessageText'
            },
            {
              caption: 'Доп. информация',
              pinned: false,
              width: 250,
              headerVerticalAlign: unilogConst.MiddleAlign,
              headerHorAlign: unilogConst.CenterAlign,
              sizable: true,
              valign: unilogConst.TopAlign,
              halign: unilogConst.LeftAlign,
              fieldName: 'AdditionalInfo',
              cellTemplate: '<div ng-if="!data.isAdditionalInfoMultiline">{{data.AdditionalInfo}}</div>'+
            '<div ng-if="data.isAdditionalInfoMultiline" ng-repeat="line in data.AdditionalInfoMultiline">{{line}}</div>'
            },
            {
              caption: 'Параметры',
              pinned: false,
              width: 150,
              headerVerticalAlign: unilogConst.MiddleAlign,
              headerHorAlign: unilogConst.CenterAlign,
              sizable: true,
              valign: unilogConst.TopAlign,
              halign: unilogConst.LeftAlign,
              fieldName: 'ParamValues',                              // если у ячейки зада шаблон, то этот поле не учитывается
              cellTemplate: '<ul class="multiParam">' +            // в шаблон передается строка целиком из свойства data
                            ' <li ng-if="data.AccountNumber.length > 0">AccountNumber</li>' +
                            ' <li ng-if="data.PolicyNumber.length > 0">PolicyNumber</li>' +
                            ' <li ng-if="data.GUID.length > 0">GUID</li>' +
                            ' <li ng-if="data.ServiceName.length > 0">ServiceName</li>' +
                            ' <li ng-if="data.MethodName.length > 0">MethodName</li>' +
                            ' <li ng-repeat="dataElement in data.ParamValues">' +
                            '  {{::dataElement.ParamName}}' +
                            ' </li>' +
                            '</ul>'
            },
            {
              caption: 'Значения параметров',
              pinned: false,
              width: 650,
              headerVerticalAlign: unilogConst.MiddleAlign,
              headerHorAlign: unilogConst.CenterAlign,
              sizable: true,
              valign: unilogConst.TopAlign,
              halign: unilogConst.LeftAlign,
              fieldName: 'ParamValues',
              cellTemplate: '<ul class="multiParam multiPL">' +
                            ' <li ng-if="data.AccountNumber.length > 0">{{data.AccountNumber}}</li>' +
                            ' <li ng-if="data.PolicyNumber.length > 0">{{data.PolicyNumber}}</li>' +
                            ' <li ng-if="data.GUID.length > 0">{{data.GUID}}</li>' +
                            ' <li ng-if="data.ServiceName.length > 0">{{data.ServiceName}}</li>' +
                            ' <li ng-if="data.MethodName.length > 0">{{data.MethodName}}</li>' +
                            ' <li ng-repeat="dataElement in data.ParamValues">' +
                            '  {{::dataElement.TruncatedValue}}' +
                            ' </li>' +
                            '</ul>'
            }
      ],
      data: $rootScope.data == undefined ? [] : $rootScope.data
    };
    //
    if($routeParams.searchParams !== undefined && !angular.isArray($routeParams.searchParams)){
      var urlParams = $routeParams.searchParams.split('?');
      if(urlParams.length > 0 ){
        urlParams.splice(0, 1);
        var keyValues = urlParams[0].split('&');
        for(var p=0; p< keyValues.length; p++){
          var keyValue = keyValues[p].split('=');
          var param = $routeParams[keyValue[0]];
          if(param == undefined)
            $routeParams[keyValue[0]] = keyValue[1];
          else{ 
            if(!angular.isArray(param))
            {
              var aux = $routeParams[keyValue[0]];
              $routeParams[keyValue[0]] = [];
              $routeParams[keyValue[0]].push(aux);
            }
            $routeParams[keyValue[0]].push(keyValue[1]);
          }
        }
      }
    }
    // сохраняем параметры запроса
    $scope.queryParams = $routeParams;
    // загружаем название параметров
    serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/MessageParam?$format=json')
      .then(function (response) {
      //      $scope.paramNames = data.d;
      $rootScope.paramNames = response.Data.d;
      // параметры
      if ($rootScope.paramNames != undefined)
        $rootScope.paramNames.forEach(function (item, i, arr) {
          var checked = true;
          var param = $scope.queryParams[item.Code];
          if(param !== undefined && angular.isArray(param)) // это на случай param1=val1&param1=val2&param1=val3
            param.forEach(function(e, i){
              $scope.params.push({ enabled: true, paramName: item, paramValue: e, paramCaption: item.Name });
            })
          else if (param !== undefined)
            $scope.params.push({ enabled: checked, paramName: item, paramValue: param, paramCaption: item.Name });

          param = $scope.queryParams['~' + item.Code];

          if (param !== undefined && angular.isArray(param)) // это на случай ~param1=val1&~param1=val2&~param1=val3
            param.forEach(function(e, i){
              $scope.params.push({ enabled: false, paramName: item, paramValue: e, paramCaption: item.Name });
            })
          else if(param !== undefined)
            $scope.params.push({ enabled: false, paramName: item, paramValue: param, paramCaption: item.Name });
          
        });
    });

    $scope.params = [];
    $scope.appHosts = [];
    // загрузка данных
    var promises = [];
    var promise1 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/Application?$format=json', 'app');     // тут подставить URL к сервису данных
    var promise2 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/BusinessProcess?$format=json', 'bp'); // тут подставить URL к сервису данных
    var promise3 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/ApplicationHost?$format=json', 'ap'); // тут подставить URL к сервису данных
    var promise4 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/Source?$format=json', 'src');          // тут подставить URL к сервису данных

    initSources($scope);
    //var app = cache.get('Application');
    //if (app == undefined || app == null)
    promises.push(promise1);
    //var bp = cache.get('BusinessProcess');
    //if (bp == undefined && bp == null)
    promises.push(promise2);
    //var apph = cache.get('ApplicationHost');
    //if (apph == undefined || apph == null)
    promises.push(promise3);
    //var src = cache.get('Source');
    //if (src == undefined || src == null)
    promises.push(promise4);

    // собственно получение данных
    // данные надо получать так, потому что далее необходима
    // обработка параметров запроса и нам
    // гарантировано нужны все данные

    // ждем когда все promise получат ответ
    $q.all(promises).then(function (results) {
      results.forEach(function (result, resultIndex) {
        if (result.Type == 'app') {
          //applications.json
          // надо добавлять потмоу что уже есть начальные элементы
          result.Data.d.forEach(function (element, index, array) {
            $scope.source.sources[unilogConst.Application].values.push(element);
          });
        }

        if (result.Type == 'bp') {
          //businessProcesses.json
          result.Data.d.forEach(function (element, index, array) {
            $scope.source.sources[unilogConst.BusinessProcess].values.push(element);
          });
          //$scope.source.sources[unilogConst.BusinessProcess].loaded = true;
          // при выборе бизнесс-процесса запоняем кое-какие контролы из выбранного бизнесс-процесса
          $scope.source.sources[unilogConst.BusinessProcess].onchange = function () {
            var bp = $scope.source.sources[unilogConst.BusinessProcess].selected;
            $scope.messageText = bp.FilterMessageText;
            $scope.additionalInfo = bp.FilterAdditionalInfo;
            $scope.methodName = bp.FilterMethodName;
            $scope.source.setApplicationById(bp.ApplicationID);
          }
        }
        if (result.Type == 'ap') {
          //ApplicationHosts.json
          result.Data.d.forEach(function (currentValue, index, array) {
            $scope.appHosts.push({ ID: currentValue.ID, Type: currentValue.Type, Name: currentValue.Name, Description: currentValue.Description });
          });
          // при выборе приложения выбираем типы среды для него
          $scope.source.sources[unilogConst.Application].onchange = function () {
            var app = $scope.source.sources[unilogConst.Application].selected;
            // дописать и раскомментарить строку ниже
            $scope.source.sources[unilogConst.Environment].values.splice(0, $scope.source.sources[unilogConst.Environment].values.length);
            if (app.ID == -1) {
              $scope.source.sources[unilogConst.Environment].values.push({ ID: -1, Name: '- Всё -', Description: 'Все среды', Type: '' });
              $scope.source.sources[unilogConst.Environment].values.push({ ID: -2, Name: 'Dev', Description: 'Среда разработки', Type: 'Dev' });
              $scope.source.sources[unilogConst.Environment].values.push({ ID: -3, Name: 'Test', Description: 'Тестовая среда', Type: 'Test' });
              $scope.source.sources[unilogConst.Environment].values.push({ ID: -4, Name: 'Stage', Description: 'Стейджевая среда', Type: 'Stage' });
              $scope.source.sources[unilogConst.Environment].values.push({ ID: -5, Name: 'Prod', Description: 'Продовая среда', Type: 'Prod' });
              $scope.source.sources[unilogConst.Environment].selected = $scope.source.sources[unilogConst.Environment].values[0];
            }
            else {
              $scope.Sources.forEach(function (src, srcIndex) {
                if (src.ApplicationID == app.ID) {
                  var appHost = $scope.appHosts.find(function (ah, ahIndex) {
                    return ah.ID == src.ApplicationHostID;
                  });
                  if (appHost !== undefined && appHost !== null)
                    $scope.source.sources[unilogConst.Environment].values.push({ ID: src.ID, Name: appHost.Description, Description: appHost.Name, Type: appHost.Type });
                }
              });
              if ($scope.source.sources[unilogConst.Environment].values.length > 0)
              {
                $scope.source.sources[unilogConst.Environment].selected = $scope.source.sources[unilogConst.Environment].values[0];
                $scope.FormURL();
              }
            }
          }
        }
        if (result.Type == 'src') {
          //sources.json'
          $scope.Sources = result.Data.d;
          if ($scope.sid < 0) {
            $scope.source.setEnvironmentById($scope.sid);
            $scope.source.setApplicationById(-1);
            $scope.source.setBisnessProcessById(-1);
            //return;
          }
          //$rootScope.SourcesLoaded = true;
          //sources.json
          var src = result.Data.d.find(function (currentValue, index, array) {
            return currentValue.ID == $scope.sid
          });

          if (src != undefined && src != {}) {
            var appHosts = $scope.appHosts.find(function (currentValue, index, array) {
              return currentValue.ID == src.ApplicationHostID
            });
            if (appHosts != undefined) {
              $scope.source.setApplicationById(src.ApplicationID);
              $scope.source.sources[unilogConst.Application].onchange();
              $scope.source.setEnvironmentByType(appHosts.Type);
            }
            //              $scope.source[2].value = -1;
          }
        }
      });
    });
    $scope.source.sources[unilogConst.Environment].onchange = function () {
      $scope.FormURL();
    };


    // парсим параметры зароса
    $scope.dayOrInterval = unilogConst.Interval;   // значение по умолчанию
    var dayValue = new Date();                     // значение по-умолчанию
    var startDate = new Date(Date.now() - 86400000);
    var startDateValue = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getHours(), startDate.getMinutes());
    var endDateValue = new Date(dayValue.getFullYear(), dayValue.getMonth(), dayValue.getDate(), dayValue.getHours(), dayValue.getMinutes());

    // тип временного интервала
    if ($routeParams.drm != undefined && $routeParams.drm == '0') {
      $scope.dayOrInterval = unilogConst.Day;
      if ($routeParams.ad != undefined && $routeParams.ad == '0') // произвольная дата
        if ($routeParams.day != undefined) // дата назначена и её берем в качестве значения
        {
          var date = parseInt($routeParams.day.substring(0, 2));
          var month = parseInt($routeParams.day.substring(3, 5));
          var year = parseInt($routeParams.day.substring(6, 8));
          dayValue = new Date(year, month, date);
        }
    }
    $scope.day = dayValue;

    // парсим даты
    if ($routeParams.sd != undefined && $routeParams.ed != undefined && $scope.dayOrInterval == unilogConst.Interval) // парсим интервал если указан тип "интервал"
    { //    01234567890123
      // sd=06.01.16_20.00
      var curCentury = (new Date()).getFullYear().toString().substr(0, 2);
      var date = parseInt($routeParams.sd.substring(0, 2));
      var month = parseInt($routeParams.sd.substring(3, 5)) - 1;
      var year = parseInt(curCentury + $routeParams.sd.substring(6, 8));
      var hour = parseInt($routeParams.sd.substring(9, 11));
      var min = parseInt($routeParams.sd.substring(12));
      startDateValue = new Date(year, month, date, hour, min);
      //    01234567890123
      // ed=06.01.16_20.00
      date = parseInt($routeParams.ed.substring(0, 2));
      month = parseInt($routeParams.ed.substring(3, 5)) - 1;
      year = parseInt(curCentury + $routeParams.ed.substring(6, 8));
      hour = parseInt($routeParams.ed.substring(9, 11));
      min = parseInt($routeParams.ed.substring(12));
      endDateValue = new Date(year, month, date, hour, min);
    }
    // даты интервала
    $scope.start_date = startDateValue;
    $scope.end_date = endDateValue;

    // типы сообщений
    $scope.messageTypes = [];
    serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/MessageType?$format=json')
			.then(function (data) {
			  data.Data.d.forEach(function (currentValue, index, array) { // обходим все элементы
			    $scope.messageTypes.push({ Enabled: true, ID: currentValue.ID, Code: currentValue.Code, Name: currentValue.Code });
			  });
			  // парсим типы сообщений
			  if ($routeParams.types !== undefined) {
			    var mesTypes = $routeParams.types.split('.');
			    $scope.messageTypes.forEach(function (mesType, mesTypeIndex) {
			      var reqMesType = mesTypes.find(function (r, rIndex) {
			        return parseInt(r) == mesType.ID;
			      });
			      if (reqMesType == undefined)
			        mesType.Enabled = false;
			    });
			  }
			}, function (status) {
			  console.log(status);
			});
    // парсим тип операции с параметрами
    var operatonType = unilogConst.AndOperation; // по-умолчанию
    if($routeParams.po !== undefined && $routeParams.po == '2')
      operatonType = unilogConst.OrOperation;
    // объект для запроса к сервису сообщений
    $scope.request = {
      OperationId: "",      // на каждый новый запрос ставим новый GUID = Math.uuid
      Count: 50,
      MessageIdFrom: null,
      MessageIdTo: null,
      SourceIdValues: [], // array of int
      CreationDateFrom: "",
      CreationDateTo: "",
      MessageTypeValues: [], // array of strings
      MesageTextValues: [], // array of strings
      AdditionalInfoValues: [], // array of strings
      ServiceNameValues: [], // array of strings
      MethodNameValues: [], // array of strings
      ParamValueExpressionMode: operatonType, // string enum
      ParamValueConditions: []  // array of {ParamId     :0, StringValues:[] // array of strings }
    };
    // тип источника      
    $scope.sid = $routeParams.sid != undefined ? $routeParams.sid : -1;
    $scope.messageText = $routeParams.mt != undefined ? $routeParams.mt : '';
    $scope.additionalInfo = $routeParams.at != undefined ? $routeParams.at : '';
    $scope.methodName = $routeParams.mn != undefined ? $routeParams.mn : '';

    // парсит строку  в массив если в ней есть ";" иначе помещает в массив саму строку в массив
    $scope.parseStringIntoArray = function (inputStr) {
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
    };
    // затеняет кнопки и показывает "колесо фортуны"
    $scope.StartRequest = function () {
      var img = angular.element(document.getElementById('wait'));
      var cmdFind = angular.element(document.getElementById('cmdFind'));
      var cmdContinue = angular.element(document.getElementById('cmdContinue'));
      var cmdCancel = angular.element(document.getElementById('cmdCancel'));

      cmdFind.attr('disabled', 'disabled');
      cmdContinue.attr('disabled', 'disabled');
      cmdCancel.removeAttr('disabled');
      img.css('display', 'block');
    };
    // активизирует кнопки, скрывает "колесо фортуны"
    $scope.EndRequest = function () {
      var img = angular.element(document.getElementById('wait'));
      var cmdFind = angular.element(document.getElementById('cmdFind'));
      var cmdContinue = angular.element(document.getElementById('cmdContinue'));
      var cmdCancel = angular.element(document.getElementById('cmdCancel'));

      img.css('display', 'none');
      cmdFind.removeAttr('disabled');
      cmdContinue.removeAttr('disabled');
      cmdCancel.attr('disabled', 'disabled');
    };
    // формирует URL
    $scope.FormURL = function () {
      // начинаем с типа интервала
      var urlParts = [];
      urlParts.push('drm=' + ($scope.dayOrInterval == unilogConst.Day ? '0' : '1'));
      if ($scope.dayOrInterval == unilogConst.Day)
        urlParts.push('day=' + Math.IntToStrNN($scope.day.getDate(), 2) + '.' + Math.IntToStrNN($scope.day.getMonth() + 1, 2) + '.' + Math.IntToStrNN($scope.day.getFullYear(), 2).substr(2, 2));

      else {
        urlParts.push('sd=' + Math.IntToStrNN($scope.start_date.getDate(), 2) + '.' + Math.IntToStrNN($scope.start_date.getMonth() + 1, 2) + '.' + Math.IntToStrNN($scope.start_date.getFullYear(), 2).substr(2, 2) + '_' + Math.IntToStrNN($scope.start_date.getHours(), 2) + '.' + Math.IntToStrNN($scope.start_date.getMinutes(), 2));
        urlParts.push('ed=' + Math.IntToStrNN($scope.end_date.getDate(), 2) + '.' + Math.IntToStrNN($scope.end_date.getMonth() + 1, 2) + '.' + Math.IntToStrNN($scope.end_date.getFullYear(), 2).substr(2, 2) + '_' + Math.IntToStrNN($scope.end_date.getHours(), 2) + '.' + Math.IntToStrNN($scope.end_date.getMinutes(), 2));
        urlParts.push('ad=0');
      }
      // источник данных
      urlParts.push('sid=' + $scope.source.sources[0].selected.ID);
      // тип операции предиката
      if($scope.request.ParamValueExpressionMode == unilogConst.OrOperation)
        urlParts.push('po=2')
      // параметры
      var isAllValid = true;
      $scope.params.forEach(function (param, paramIndex) {
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
      $scope.messageTypes.forEach(function (mType, mTypeIndex) {
        allSelected = allSelected && mType.Enabled;
        if (mType.Enabled)
          selectedTypes = selectedTypes + ((selectedTypes.length > 0) ? '.' : '') + mType.ID;
      });
      if (!allSelected) {
        urlParts.push('types=' + selectedTypes);
      }
      if ($scope.messageText.length > 0)
        urlParts.push('mt=' + $scope.messageText);
      if ($scope.additionalInfo.length > 0)
        urlParts.push('at=' + $scope.additionalInfo);
      if ($scope.methodName.length > 0)
        urlParts.push('mn=' + $scope.methodName);
      //$rootScope.reload = false;
      //window.history.pushState({},'','#/search?' + urlParts.join('&'));
      $location.url('search?' + urlParts.join('&'), false);
    };
    
    // формирует объект запроса
    $scope.PrepareRequest = function (messageIdTo) {
      // это надо для режима Продолжить. Так сервис поиска работает
      if (messageIdTo !== undefined)
        $scope.request.MessageIdTo = messageIdTo;
      else
        $scope.request.MessageIdTo = null;
      
      $scope.request.OperationId = Math.uuid(); // на каждый запрос нужен новый GUID
      // начальная дата
      if($scope.dayOrInterval == unilogConst.Interval){
        $scope.request.CreationDateFrom = $scope.start_date.getCorrectedDateByTimeZone(); //Странно, правда ? Это потому что javascript хранит дату в UTC и также её сериализует и вместо 2016-01-02T12:13:45 получим 2016-01-02T09:13:45
        $scope.request.CreationDateTo = $scope.end_date.getCorrectedDateByTimeZone();    // конечная дата
      }
      else{
        var year = $scope.day.getFullYear();
        var month = $scope.day.getMonth();
        var day = $scope.day.getDate();
        $scope.request.CreationDateFrom = new Date(year, month, day, 0,0,0).getCorrectedDateByTimeZone();
        $scope.request.CreationDateTo = new Date(year, month, day+1,0,0,0).getCorrectedDateByTimeZone();
      }
      // формируем массив ИД источников
      $scope.request.SourceIdValues.splice(0, $scope.request.SourceIdValues.length);              // очищаем массив
      // надо пройтись по хостам приложений и выбрать все записи у которых тип среды = выбранной среде,
      var hosts = $scope.appHosts.filter(function (app, appIndex) {
        return $scope.source.sources[0].selected.Type.length == 0 || $scope.source.sources[0].selected.Type == app.Type;
      });
      // затем из таблицы Source надо выбрать все записи у которых ИдХоста входит в выбранные ранее список,
      // а приложения = выбранное приложение
      // если прилождение не выбрано. то надо выбрать все записи ИдХоста у которых входит в выбранные ранее список
      var application = $scope.source.sources[1].selected;
      if($scope.Sources == undefined || !angular.isArray($scope.Sources)){
        alert('Справочник источников еще не загружен. Дождитесь загрузки и повторите попытку');
        return false;
      }
      $scope.Sources.forEach(function (src, srcIndex) {
        hosts.forEach(function (h, hIndex) {
          if (src.ApplicationHostID == h.ID &&
               ((application !== undefined && application.ID == src.ApplicationID) ||
                 application !== undefined && application.ID == -1) ||
                 application == undefined)
            $scope.request.SourceIdValues.push(src.ID);
        });
      });
      // типы сообщений 
      $scope.request.MessageTypeValues.splice(0, $scope.request.MessageTypeValues.length);        // очищаем массив
      //выбираем только те, что отмечены галкой на фронте
      $scope.messageTypes.forEach(function (mesType, mesTypeIndex) {
        if (mesType.Enabled)
          $scope.request.MessageTypeValues.push(mesType.ID);
      });

      // messageText
      $scope.request.MesageTextValues.splice(0, $scope.request.MesageTextValues.length);         //clear array
      $scope.request.MesageTextValues = $scope.parseStringIntoArray($scope.messageText);
      // additionalInfo
      $scope.request.AdditionalInfoValues.splice(0, $scope.request.AdditionalInfoValues.length); // clear array
      $scope.request.AdditionalInfoValues = $scope.parseStringIntoArray($scope.additionalInfo);
      // methodName
      $scope.request.MethodNameValues.splice(0, $scope.request.MethodNameValues.length);        // clear array
      $scope.request.MethodNameValues = $scope.parseStringIntoArray($scope.methodName);
      // ParamValueConditions
      $scope.request.ParamValueConditions.splice(0, $scope.request.ParamValueConditions.length); // clear array
      $scope.params.forEach(function (param, paramIndex) {
        if (param.enabled) // помещаем те параметры на против который стоит галка
          $scope.request.ParamValueConditions.push({
            ParamId: param.paramName.ID,
            StringValues: $scope.parseStringIntoArray(param.paramValue)
          });
      });
      return true;
    };
    $scope.TotalRecords = 0;
    $scope.LastRecords = 0;
    $scope.AddParameter = function () {
      $scope.params.push({ enabled: true, paramName: {}, paramValue: '' });
    };
    $scope.DelParameter = function (index) {
      var needFormUrl = $scope.params[index].paramValue.length > 0 
                          && $scope.params[index].paramName !== undefined 
                          && $scope.params[index].paramName.Code.length >0;
      $scope.params.splice(index, 1);
      if (needFormUrl)
        $scope.FormURL();
    };
    // обработчик нажатия кнопки для "Поиск" и "Продолжить" с параметром какая кнопка нажата
    $scope.cmdClick = function (btn) {
      // 2016-02-15T22:29:29.3795156+03:00
      $scope.StartRequest();  // показывает "колесо фортуны"
      var prepareRequestResult = false;
      if (btn == 'start'){    // новый запрос, формируем объект запроса по-новой
        $scope.TotalRecords = 0;  // сбросим общий счетчик записей
        prepareRequestResult = $scope.PrepareRequest();
      }
      else
        prepareRequestResult = $scope.PrepareRequest($scope.request.MessageIdTo - 1);
      if(!prepareRequestResult)
          return;
      // запрос к сервис сообщений

      $scope.loadingPromise = $http({
        url: environment.SearchServiceUrlPrefix + 'UnilogSearchService.svc/web/SearchMessages',
        method: 'POST',
        data: $scope.request
      })
          .then(function (response) {    // when seccess
            $scope.EndRequest();
            if (!response.data.IsSuccess) {
              alert("Во время запроса произошла ошибка\n" + response.data.ErrorMessage);
              return;
            }
            if (btn == 'start')
              $scope.config.data.splice(0, $scope.config.data.length);  // если нажата "Поиск", то результат приваиваем модели
            $rootScope.data = [];
            if (response.data.Messages !== null) {
              $scope.TotalRecords += response.data.Messages.length;
              $scope.LastRecords = response.data.Messages.length;
              
//              $scope.request.MessageIdFrom = response.data.Messages[0].Id;
              response.data.Messages.reverse();
              if(response.data.Messages.length > 0)
                $scope.request.MessageIdTo = response.data.Messages[0].Id;
              response.data.Messages.forEach(function (mes, mesIndex) {
                // провереяем является ли AdditionInfo многострочным
                mes.isAdditionalInfoMultiline = false;
                mes.AdditionalInfoMultiline = [];
                if(mes.AdditionalInfo !== null && mes.AdditionalInfo.length >0  && mes.AdditionalInfo.indexOf('\n') >0)
                {
                  mes.isAdditionalInfoMultiline = true;
                  mes.AdditionalInfoMultiline = mes.AdditionalInfo.split('\n')
                }
                mes.ParamValues.forEach(function (p, pIndex) {
                  $scope.request.MessageIdTo = Math.min($scope.request.MessageIdTo, mes.Id);
                  var foundedParam = $rootScope.paramNames.find(function (param, paramIndex) {
                    return param.ID == p.ParamId;
                  })
                  if (foundedParam !== undefined)
                    p.ParamName = foundedParam.Code;
                });
                $scope.config.data.push(mes);
              });
              $rootScope.data = $scope.config.data;
            }
          },
          function (response) {          // when fail
            $scope.EndRequest();
            alert(
                  "Http code:" + response.status + "\n" +
                  "Http статус:" + response.statusText
                  );
          });
    };
    // обработчик кнопки "Отмена"
    $scope.CancelClick = function () {
      if ($scope.loadingPromise != undefined) {
        // TODO:  послать отмену в сервис поиска
        $timeout.cancel($scope.loadingPromise);
        $scope.loadingPromise = undefined;
        $scope.EndRequest();
      }
    };
  } ]);
 
// контроллер для message
  unilogControllers.controller('messageViewController',
['$scope',
'$http',
'environment',
'$routeParams',
'$rootScope',
'$q',
'serviceData',
'$cacheFactory',
 function ($scope, $http, environment, $routeParams, $rootScope, $q, serviceData, $cacheFactory) {
   if ($routeParams.messageId !== undefined) {
     if ($rootScope.cache == undefined)
       $rootScope.cache = $cacheFactory('dic');
     var batch1 = [];
     var promise1 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/Message(' + $routeParams.messageId + ')?$format=json&$expand=MessageParamValue,MessageType,Source/Application,Source/ApplicationHost');
     var promise2 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/Message(' + $routeParams.messageId + ')/MessageParamValue?$format=json');
     var promise3 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/MessageParam?$format=json');
     batch1.push(promise1);
     batch1.push(promise2);
     batch1.push(promise3);
     $q.all(batch1).then(function (results1) {
       var msgResponse = results1[0].Data.d;
       var msgParamResponse = results1[1].Data.d;
       var paramResp = results1[2].Data.d;
       paramResp.push({
                        ID: -1, 
                        Code: "AdditionalInfo", 
                        Name: "Доп. информация", 
                        Description: null
       });
       $rootScope.paramNames = paramResp;
       $scope.message = msgResponse;  // сообщение
       // проебразуем дату из \Date(654618761716)\ в богоугодный вид
       if(typeof $scope.message.CreationDate == 'string'){
         var localTime = $scope.message.CreationDate.match(/\d+/)[0] * 1;
         var offset = (new Date()).getTimezoneOffset()*60000;
         $scope.message.CreationDate = new Date(localTime+offset);
       } // возможно придется доп. проверять с часом ли поясом приходит дата.
       $scope.params = [];
       $scope.params.push({
          ID        : -1, 
          MessageID : 0, 
          ParamID   : -1, 
          ValueText : $scope.message.AdditionalInfo, 
          ValueXML  : null,
       });
       msgParamResponse.forEach(function(e){ $scope.params.push(e);});
       //var mesID = parseInt($routeParams.messageId);

       // сопоставляем код парамера его имени
       $scope.params.forEach(function (dataItem, dataItemIndex) {
         var foundParamName = $rootScope.paramNames.find(function (param, paramIndex) {
           return param.ID == dataItem.ParamID;
         });
         // сопоставление есть
         if (foundParamName !== undefined) {
           dataItem.ParamName = foundParamName;
           // определяем тип параметра
           if(dataItem.ValueText == null)
              dataItem.ValueText = '';
           if(dataItem.ValueXML == null)
              dataItem.ValueXML = '';
            
           dataItem.Type = dataItem.Type = (dataItem.ValueText.length == 0 && dataItem.ValueXML.length > 0) ? 1 : 0; // текст или XML
           if(dataItem.Type == 1 && dataItem.ValueXML.indexOf('\n') == -1)
             dataItem.ValueXML = vkbeautify.xml(dataItem.ValueXML,'4');

           if (dataItemIndex == 0) {
             dataItem.Selected = true; // первй парметра выделяем
             $scope.SelectedParam = dataItem;
           }
        }
       });
        var img = document.getElementById('wait');
        if (img !== undefined)
          img.style.display = 'none';
     },
    function (result) {
      alert('Неудалось получить данные:' + result);
    });

     $scope.ShowParamValue = function (param) {
       $scope.SelectedParam = undefined;
       $scope.params.forEach(function (p, pIndex) {
         p.Selected = false;
       });
       param.Selected = true;
       $scope.SelectedParam = param;
     };
   }
 } ]);