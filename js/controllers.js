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

unilogControllers.controller('searchController',
[
  '$scope',
//  '$routeParams',
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
  'utils',
  function ($scope, $http, $document, $timeout, $q, unilogConst, environment, $rootScope, $location, $cacheFactory, serviceData, utils) {
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
      ParamValueExpressionMode: unilogConst.AndOperation, // string enum
      ParamValueConditions: []  // array of {ParamId     :0, StringValues:[] // array of strings }
    };
  
    //}
    // сохраняем параметры запроса
    $scope.queryParams = $location.$$search;
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
          }
        }
      });
    });

    $scope.source.sources[unilogConst.Environment].onchange = function () {
      $scope.FormURL();
    };

    // парсим параметры зароса
    utils.ParseSearchParams($scope);

    // типы сообщений
    $scope.messageTypes = [];
    serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/MessageType?$format=json')
			.then(function (data) {
			  data.Data.d.forEach(function (currentValue, index, array) { // обходим все элементы
			    $scope.messageTypes.push({ Enabled: true, ID: currentValue.ID, Code: currentValue.Code, Name: currentValue.Code });
			  });
        utils.ParseMessageTypes($scope);
			}, function (status) {
        utils.EndRequest();
			  console.log(status);
			});

    
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
        utils.FormURL();
    };
    
    $scope.FormURL = function(){
      utils.FormURL($scope);
    };
    // обработчик нажатия кнопки для "Поиск" и "Продолжить" с параметром какая кнопка нажата
    $scope.cmdClick = function (btn) {
      // 2016-02-15T22:29:29.3795156+03:00
      utils.StartRequest();  // показывает "колесо фортуны"
      var prepareRequestResult = false;
      if (btn == 'start'){    // новый запрос, формируем объект запроса по-новой
        $scope.TotalRecords = 0;  // сбросим общий счетчик записей
        prepareRequestResult = utils.PrepareRequest(undefined, $scope);
      }
      else
        prepareRequestResult = utils.PrepareRequest($scope.request.MessageIdTo - 1, $scope);
      if(!prepareRequestResult){
          utils.EndRequest();
          return;
      }
      // запрос к сервис сообщений

      $scope.loadingPromise = $http({
        url: environment.SearchServiceUrlPrefix + 'UnilogSearchService.svc/web/SearchMessages',
        method: 'POST',
        data: $scope.request
      })
          .then(function (response) {    // when seccess
            utils.EndRequest();
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
            utils.EndRequest();
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
        utils.EndRequest();
      }
    };
  } ]);
 
// контроллер для message
  unilogControllers.controller('messageViewController',
['$scope',
'$http',
'environment',
'$location',
'$rootScope',
'$q',
'serviceData',
'$cacheFactory',
 function ($scope, $http, environment, $location, $rootScope, $q, serviceData, $cacheFactory) {
   if ($location.$$search.messageId !== undefined) {
     if ($rootScope.cache == undefined)
       $rootScope.cache = $cacheFactory('dic');
     var batch1 = [];
     var promise1 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/Message(' + $location.$$search.messageId + ')?$format=json&$expand=MessageParamValue,MessageType,Source/Application,Source/ApplicationHost');
     var promise2 = serviceData(environment.DataServiceUrlPrefix + 'UnilogDataService.svc/Message(' + $location.$$search.messageId + ')/MessageParamValue?$format=json');
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