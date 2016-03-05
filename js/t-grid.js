(function () {
  'use strict';
  angular.module('t.grid', [])
  .directive('tGrid', ['$timeout', function ($timeout) {
    var controller = ['$scope', function ($scope) {
      $scope.pinnedColumns = [];
      $scope.gridColumnsHeaders = [];
      // ********************************************
      // *  заполняет
      // ********************************************
      $scope.InitializePinnedColumns = function (initialIndex) {
        $scope.pinnedColumns.forEach(function (pCol, pColindex) {
          var table = document.getElementById('fct'+pCol);
          if (pCol.cells == undefined)
            pCol.cells = [];
          var delta = $scope.config.data.length - pCol.cells.length;
          if (delta > 0)
            for (; pCol.cells.length < $scope.config.data.length; )
              pCol.cells.push({ data: undefined, rowHeight: undefined });
          else
            pCol.cells.splice($scope.config.data.length - 1, delta * -1);
        });
      };

      // ********************************
      // *     binds event handlers     *
      // ********************************
      $scope.bindingEvents = function () {
        var tbodycontainer = document.getElementById($scope.controlId + "tbody_container");
        $scope.prevScrollLeft = 0;
        $scope.sourceScrolling = 0;
        // bind scroll event handler to the tbodycontainer
        angular.element(tbodycontainer).on('scroll', function (evt) {
          var deltaX = Math.round(evt.currentTarget.scrollLeft);
          var deltaY = Math.round(evt.currentTarget.scrollTop);
          for (var i = 0; i < $scope.pinnedColumns.length; i++)
            $scope.pinnedColumns[i].html.style.marginTop = -1 * deltaY + "px";

          $scope.theader.style.marginLeft = -1 * deltaX + 'px';
          $scope.prevScrollLeft = deltaX;
        });

        //*  bind resize column function *
        var header = document.getElementById($scope.controlId + "theader"); // get parent for all header's div
        var aHeader = {};
        var frezzedHeader = {};
        var pinnedColIndex = 0;
        var unPinnedColIndex = 0;
        
        $scope.config.columnsDefinition.forEach(function (col, colIndex) {
          if (col.sizable) {
            var rdiv = {};
            var rdivSelector;
            if (col.pinned)
              rdivSelector = "fhr" + pinnedColIndex;
            else
              rdivSelector = "thr" + unPinnedColIndex;
            rdiv = document.getElementById(rdivSelector);

            // bind mousedown event handler
            angular.element(rdiv).on('mousedown touchstart', function (e) {
              e.preventDefault();
              e.stopPropagation();
              $scope.StartClientX = e.clientX;
              $scope.EndClientX = e.clientX;
              $scope.rDiv = e.target;
              aHeader = angular.element(document.body);
              // bind mousemove event handler
              aHeader.on('mousemove touchmove', function (mouseEvent) {
                $scope.rDiv.style.marginLeft = parseInt($scope.rDiv.style.marginLeft.substr(0, $scope.rDiv.style.marginLeft.length - 2)) + (mouseEvent.clientX - $scope.EndClientX) + "px";
                $scope.EndClientX = mouseEvent.clientX;
              });

              aHeader.on('mouseup touchend', function (e) {
                aHeader.off('mousemove touchmove');
                aHeader.off('mouseup touchend');
                aHeader.off('mousedown touchstart');
                var newMarginLeft = parseInt($scope.rDiv.style.marginLeft.substr(0, $scope.rDiv.style.marginLeft.length - 2));
                var delta = $scope.EndClientX - $scope.StartClientX;
                // ширина ячейки таблицы заголовка
                $scope.rDiv.parentElement.style.width = newMarginLeft - 3  + "px";
                // устанавливаем ширину столбца таблицы
                var tableElement = $scope.rDiv.parentElement // td
                                                .parentElement // tr
                                                  .parentElement // tbody
                                                    .parentElement; //table 
                var tableElementWidth = parseInt(tableElement.style.width.substr(0, tableElement.style.width.length - 2));
                tableElement.style.width = tableElementWidth + delta + 'px';
                var prefix = $scope.rDiv.attributes['id'].nodeValue.substr(0,3);
                var index = parseInt($scope.rDiv.attributes['id'].nodeValue.substr(3,$scope.rDiv.attributes['id'].nodeValue.length-3));
                // если колонка не фиксированная, то меняем её и таблицу
                if(prefix == 'thr'){
                  $scope.gridColumnsHeaders[index].width = $scope.gridColumnsHeaders[index].width + delta;
                  // устанавливаем ширину таблицы заголовка, но сначала меняем ширину таблицы
                  var tableElement = document.getElementById($scope.controlId+'table');
                  var tableElementWidth = parseInt(tableElement.style.width.substr(0, tableElement.style.width.length - 2));
                  tableElement.style.width = tableElementWidth + delta + 'px';
                  if(tableElement.children[0].children.length > 0){
                    // а теперь ширину колонки
                    var tdElement = tableElement.children[0] // tbody
                                                  .children[0] // tr
                                                    .children[index]; // td
                    var tdElementWidth = parseInt(tdElement.style.width.substr(0, tdElement.style.width.length - 2));
                    tdElement.style.width = tdElementWidth + delta + 'px';
                    $scope.CalculateRowsHeight();
                  }
                }
                else{ // фиксированная колонка
                  var frezzDiv = document.getElementById($scope.controlId+'frezzed'+index);
                  var frezzDivWidth = parseInt(frezzDiv.style.width.substr(0, frezzDiv.style.width.length - 2));
                  frezzDiv.style.width = frezzDivWidth + delta + 'px';
                  $scope.pinnedColumns[index].width = $scope.pinnedColumns[index].width + delta;
                  // уменьшаем ширину элемента tbody_container
                  var tbody_container = document.getElementById($scope.controlId+'tbody_container');
                  var tbody_containerWidth = parseInt(tbody_container.style.width.substr(0, tbody_container.style.width.length - 2));
                  tbody_container.style.width = tbody_containerWidth - delta + 'px';
                  // устанавливаем ширины таблицы с ячеками данных фиксированной таблицы
                  var tableElement = frezzDiv.children[1];
                  // меняем ширины у самих ячеек данных фиксированной таблицы 
                  if(tableElement.children[0].children.length > 0){
                    var tdElement = tableElement.children[0].children[0].children[0];
                    var tdElementWidth = parseInt(tdElement.style.width.substr(0, tdElement.style.width.length - 2));
                    tdElement.style.width = tdElementWidth + delta + 'px';
                  }
                }
              });
              return false;
            });
          }
          if (col.pinned) pinnedColIndex++;
          else unPinnedColIndex++;
        });
      };

      //*********************************************
      //*   получает заданный стиль в виде числа    *
      //*********************************************
      $scope.css = function (element, code) {
        var htmlObj = element;
        if (typeof element == "jquery")  // это неправильно, но руки недоходят исправить. Вроде работает...
          htmlObj = element[0];
        var style = getComputedStyle(htmlObj);
        var parameter = "";
        try {
          parameter = style[code];
          if (parameter.indexOf("px") == (parameter.length - 2)) // преобразуем в число
            parameter = parseInt(parameter.substr(0, parameter.length - 2));
        }
        catch (e) {
          console.log(e);
        }
        return parameter;
      };

      //*******************************************************************
      //* вычисляет и устанавливает ширину и высоту элмента tbodycontainer 
      //*******************************************************************
      $scope.setSize = function () {
        var tbodycontainer = document.getElementById($scope.controlId + "tbody_container");
        // вычисляем суммарную ширину "замороженных" колонок
        var pinnedWidth = 0;
        // проходимся по "замороженным" колонкам
        $scope.pinnedColumns.forEach(function (pCol, pColIndex) {
          pCol.html = document.getElementById("fct" + pColIndex);    // сохраняем ссылку на контейрен "замороденного"столбца для изменения его ширины в будущем
          pinnedWidth = +$scope.css(pCol.html.parentNode, "width");
        });
        // проходимся по заголовку таблицы
        var headerWidth = 0;
        $scope.gridColumnsHeaders.forEach(function (gchCol, gchIndex) {
          gchCol.html = document.getElementById("hRow" + gchIndex);  // сохраняем ссылку на контейрен "замороденного"столбца для изменения его ширины в будущем
          var styleElement = getComputedStyle(gchCol.html);
          headerWidth += (Math.round(parseFloat(styleElement.width.substr(0, styleElement.width.length - 2)))
                          + Math.round(parseFloat(styleElement.borderLeftWidth.substr(0, styleElement.borderLeftWidth.length - 2)))
                          + Math.round(parseFloat(styleElement.borderRightWidth.substr(0, styleElement.borderRightWidth.length - 2)))
                          + Math.round(parseFloat(styleElement.paddingLeft.substr(0, styleElement.paddingLeft.length - 2)))
                          + Math.round(parseFloat(styleElement.paddingRight.substr(0, styleElement.paddingRight.length - 2))));
        });
        var table = document.getElementById($scope.controlId + "table");
        document.getElementById($scope.controlId + "theader").style.width = headerWidth + "px"; //выставляем ширину контейнера заголовка таблицы
        table.style.width = headerWidth + "px";   // и обязательно ширину самой таблицы грида

        // получаем родительский элемент, который содержит нашу таблицу, tbodycontainer и theader
        var parentContainer = document.getElementById($scope.controlId + "tab_container").parentNode;
        // устанавливаем высоту и ширну tbodycontainer
        // в tbodycontainer находится наша таблица
        tbodycontainer.style.width = parentContainer.clientWidth - pinnedWidth + "px";
        // сохраняем ссылку на theader для скроллинга
        if (!$scope.theader)
          $scope.theader = document.getElementById($scope.controlId + "theader");
        // ставим высоту tbodycontainer
      };

      //***********************************************************************
      //* вычисляет высоту каждой строки таблицы и устанавливет высоту строки "замороженной" колонки
      //* а также вычисляет и устанавливает ширину таблицу и ширину заголовка таблицы
      //***********************************************************************
      $scope.CalculateRowsHeight = function () {
        var borderTopWidth = 0;
        var paddingTop = 0;
        var paddingBottom = 0;
        var borderBottomWidth = 0;
        var determCellProperties = false;
        var determHeaderWidth = false;
        // DOM элемент table
        var table = document.getElementById($scope.controlId + "table");

        // проходимся по всем строкам таблицы
        for (var rowIndex = 0; rowIndex < table.children[0].children.length; rowIndex++) {
          var row = table
                    .children[0]          // tbody
                    .children[rowIndex];  // tr
          var rowHeight = $scope.css(row, "height");  // "грязная" высота строки

          // поэтому проходимся по всем "замороженным" столбцам и выставляем высоту соответствующей строки с индексом rowIndex
          $scope.pinnedColumns.forEach(function (pinnedColumn, pinnedColumnIndex) {
              pinnedColumn.html.children[0] // tbody
                                .children[rowIndex].style.height = rowHeight + 'px';
//            pinnedColumn.cells[rowIndex].rowHeight = rowHeight - borderTopWidth - paddingTop - paddingBottom - borderBottomWidth;
          });
          //row.style.height = maxRowHeight + 'px';
        }
      };

      if ($scope.config == undefined || $scope.config.columnsDefinition == undefined) {
        console.log('No Columns definition');
        return;
      }
      var leftPosition = 0;
      // **  формируем массив "замороженных" колонок
      $scope.TableWidth = 0;
      $scope.config.columnsDefinition.forEach(function (colDef, index) {

        colDef.selector = (colDef.fieldName ? colDef.fieldName : index); // это селктор для поддержки данных в виде массива массивов и массива объектов
        colDef.index = index;                 // индекс в масиве columnsDefinition соответствующий данному стобцу. Используется для измение размеров заголовка
        leftPosition += colDef.width + 10 + 1; // вычисляет left div-элемента, у изменяемой размеры колонки 10 - это padding 5px класса hcell
        //colDef.left = leftPosition - 2;       // это середина div-элемента размером 5px. Задается в класса rdiv
        if (colDef.cellTemplate == undefined)
          colDef.cellTemplate = "{{data[column.fieldName]}}";
        if (colDef.pinned)
          $scope.pinnedColumns.push(colDef);      // "замороденные" колонки налево
        else {
          //          $scope.TableWidth += colDef.width;
          $scope.gridColumnsHeaders.push(colDef); // остальные направо ))
        }
      });
    } ];
    return {
      scope: {
        config: '=',  // атрибут config с объектом конфигурации колонок и данными
        controlId: '@'   // атрибут controlId для уникальности элементов DOM
      },
      transclude: true,    // думаю пока не надо
      restrict: 'A',
      templateUrl: 'js/t-grid.html',
      controller: controller,
      link: function (scope, element, attrs) {
        element.css("overflow", "hidden");
        // this is a trick to catch the moment when DOM rendering is over
        $timeout(function () {
          scope.$watchCollection("config.data", function (newValue, oldValue) {
            if (newValue == undefined)
              return;
            if (!angular.isArray(newValue) || !angular.isArray(oldValue)) {
              console.log("Объект не является массивом");
              return;
            }
            var deltaLength = newValue.length - oldValue.length;
            scope.InitializePinnedColumns(deltaLength);
            // this is a trick to catch the moment when DOM rendering is over
            $timeout(function () {
              scope.CalculateRowsHeight(); // calculates height of each row and fits height of pinned column's cells
            });
          });
          scope.bindingEvents();
          scope.InitializePinnedColumns(0);
          scope.setSize();             // adjust width and height of tab_container div
          scope.CalculateRowsHeight();
          scope.$apply();
          window.addResizeListener(element[0], function () {
            scope.setSize();
          });
        });
      }
    }
  } ])
  .directive('cellTemplate', function ($compile) {
    return {
      restrict: "E",
      required: "^^tGrid",
      transclude: true,
      scope: {
        column: "=",
        data: "="
      },
      link: function (scope, element, attrs, ctrl) {
        if (scope.column.cellTemplate != '') {
          element.html(scope.column.cellTemplate);
          $compile(element.contents())(scope);
        }
        else
          element[0].innerText = scope.data[scope.column.fieldName];
      }
    }
  });
})();