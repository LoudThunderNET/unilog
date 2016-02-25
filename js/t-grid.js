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
        // bind scroll event handler to the tbodycontainer
        angular.element(tbodycontainer).on('scroll', function (evt) {
          var deltaX = Math.round(evt.currentTarget.scrollLeft);
          var deltaY = Math.round(evt.currentTarget.scrollTop);
          for (var i = 0; i < $scope.pinnedColumns.length; i++)
            $scope.pinnedColumns[i].html.style.marginTop = -1 * deltaY + "px";

          $scope.theader.style.marginLeft = -1 * deltaX + 'px';
          $scope.gridColumnsHeaders.forEach(function (gchCol, gchIndex) {
            if (gchCol.sizable) {
              gchCol.html.style.left = $scope.css(gchCol.html, "left") + ($scope.prevScrollLeft - deltaX) + "px";
              gchCol.left += $scope.prevScrollLeft - deltaX;
            }
          });
          $scope.prevScrollLeft = deltaX;
        });

        //*  bind resize column function *
        var header = document.getElementById($scope.controlId + "theader"); // get parent for all header's div
        var aHeader = {};
        var frezzedHeader = {};
        var pinnedColIndex = 0;
        var unPinnedColIndex = 0;
        /*
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
              $scope.rDiv = e.target;
              $scope.oldRDivHeight = $scope.css(e.target, "height");
              $scope.oldRDivLeft = $scope.css(e.target, "left");
              $scope.isPinnedColumn = e.target.id.substr(0, 3) == "fhr";
              $scope.resizingColumnIndex = parseInt(e.target.id.substr(3, e.target.id.length));

              var main_container;
              if ($scope.isPinnedColumn) {
                main_container = e.target.parentNode.parentNode;
                $scope.masterIndex = $scope.pinnedColumns[$scope.resizingColumnIndex].index;
              }
              else {
                main_container = e.target.parentNode.parentNode.parentNode;
                $scope.masterIndex = $scope.gridColumnsHeaders[$scope.resizingColumnIndex].index;
              }
              e.target.style.height = $scope.css(main_container, "height") + "px";


              aHeader = angular.element(document.body);
              // bind mousemove event handler
              aHeader.on('mousemove touchmove', function (mouseEvent) {
                $scope.rDiv.style.left = parseInt($scope.rDiv.style.left.substr(0, $scope.rDiv.style.left.length - 2)) + (mouseEvent.clientX - $scope.StartClientX) + "px";
                $scope.StartClientX = mouseEvent.clientX;
                //console.log(mouseEvent.clientX + ":" + $scope.rDiv.style.left);
                //console.log(mouseEvent.movementX);
              });

              aHeader.on('mouseup touchend', function (e) {
                aHeader.off('mousemove touchmove');
                aHeader.off('mouseup touchend');
                aHeader.off('mousedown touchstart');

                $scope.rDiv.style.height = $scope.oldRDivHeight + "px";

                var widthDelta = $scope.oldRDivLeft - $scope.css($scope.rDiv, "left");
                var newWidth = $scope.config.columnsDefinition[$scope.masterIndex].width - widthDelta;

                var table = $scope.isPinnedColumn ?
                              document.getElementById("fct" + $scope.resizingColumnIndex) :
                              document.getElementById($scope.controlId + "table");
                table.style.width = $scope.css(table, "width") - widthDelta + "px";
                var tableCells = table
                                  .children[0] // tbody
                                  .children[0]; // tr
                if (tableCells !== undefined)
                  tableCells.children[$scope.resizingColumnIndex].style.width = newWidth + "px";
                $scope.config.columnsDefinition[$scope.masterIndex].width = newWidth;

                if ($scope.isPinnedColumn) {
                  $scope.pinnedColumns.forEach(function (pCol, pColIndex) {
                    if (pColIndex >= $scope.resizingColumnIndex)
                      pCol.left -= widthDelta;
                  });
                  $scope.resizingColumnIndex = -1;
                }
                $scope.gridColumnsHeaders.forEach(function (gchCol, gchIndex) {
                  if (gchIndex >= $scope.resizingColumnIndex)
                    gchCol.left -= widthDelta;
                });
                var w = $scope.css($scope.rDiv.parentElement, "width");
                $scope.rDiv.parentElement.style.width = w - widthDelta + 'px';
                $scope.CalculateRowsHeight();
                $scope.$apply();
                //$scope.setSize()
              });
              return false;
            });
          }
          if (col.pinned) pinnedColIndex++;
          else unPinnedColIndex++;
        });*/
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
      //* вычисляет и устанавливает ширину {{controlId}}theader
      //*******************************************************************
      $scope.SetHeaderSize = function () {
        var width = 0;
        $scope.gridColumnsHeaders.forEach(function(col, colIndex){
          var tdStyle = getComputedStyle(document.getElementById("thr"+colIndex));
          width += (Math.round(parseFloat(tdStyle.width.substr(0, tdStyle.width.length - 2)))
                          + Math.round(parseFloat(tdStyle.borderLeftWidth.substr(0, tdStyle.borderLeftWidth.length - 2)))
                          + Math.round(parseFloat(tdStyle.borderRightWidth.substr(0, tdStyle.borderRightWidth.length - 2)))
                          + Math.round(parseFloat(tdStyle.paddingLeft.substr(0, tdStyle.paddingLeft.length - 2)))
                          + Math.round(parseFloat(tdStyle.paddingRight.substr(0, tdStyle.paddingRight.length - 2))));
        });
        // получаем родительский элемент, который содержит нашу таблицу, theader и theader
        if (!$scope.theader)
          $scope.theader = document.getElementById($scope.controlId + "theader");
        $scope.theader.width = width+"px";
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
        var borderLeftWidth = 0;
        var borderRightWidth = 0;
        var paddingLeft = 0;
        var paddingRight = 0;
        var headerWidth = 0;
        // DOM элемент table
        // вычисляем ширину заголовков, таблицы
        var pinnedIndex, conIndex = 0;
        var table = document.getElementById($scope.controlId + "table");
        table.style.width = $scope.theader.style.width;   // и обязательно ширину самой таблицы грида

        // проходимся по всем строкам таблицы
        for (var rowIndex = 0; rowIndex < table.children[0].children.length; rowIndex++) {
          var row = table
                    .children[0]          // tbody
                    .children[rowIndex];  // tr
          var rowHeight = $scope.css(row, "height");  // "грязная" высота строки

          if (!determHeaderWidth && row.cells.length > 0)  // этот кусок надо выполнить 1 раз для самой первой строки грида
          {
            // определим все параметры для точного определения размеров ячейки грида
            borderTopWidth = $scope.css(row.cells[0], "borderTopWidth");    // надо для вычислени полной высоты
            paddingTop = $scope.css(row.cells[0], "paddingTop");        // надо для вычислени полной высоты
            paddingBottom = $scope.css(row.cells[0], "paddingBottom");     // надо для вычислени полной высоты
            borderBottomWidth = $scope.css(row.cells[0], "borderBottomWidth"); // надо для вычислени полной высоты
            //$scope.TableWidth = headerWidth;
            determHeaderWidth = true; // флаг, что для остальных строк ничего этого делать уже не надо
          }
          // к этомум моменту у нас есть все данные для вычисления полной высоты текущей строки
          // пожтому проходимся по всем "замороженным" столбцам и выставляем высоту соответствующей строки с индексом rowIndex
          $scope.pinnedColumns.forEach(function (pinnedColumn, pinnedColumnIndex) {
            pinnedColumn.cells[rowIndex].rowHeight = rowHeight - borderTopWidth - paddingTop - paddingBottom - borderBottomWidth;
          });
        }
      };

      if ($scope.config == undefined || $scope.config.columnsDefinition == undefined) {
        console.log('No Columns definition');
        return;
      }
      var leftPosition = 0;
      // **  формируем массив "замороженных" колонок
      $scope.TableWidth = 0;
      var pinnedIndex = 0;
      var headerIndex = 0;
      var elementName = 
      $scope.config.columnsDefinition.forEach(function (colDef, index) {
        
        colDef.selector = (colDef.fieldName ? colDef.fieldName : index); // это селктор для поддержки данных в виде массива массивов и массива объектов
        colDef.index = index;                 // индекс в масиве columnsDefinition соответствующий данному стобцу. Используется для измение размеров заголовка
        leftPosition += colDef.width + 10 + 1; // вычисляет left div-элемента, у изменяемой размеры колонки 10 - это padding 5px класса hcell
        colDef.left = leftPosition - 2;       // это середина div-элемента размером 5px. Задается в класса rdiv
        if (colDef.cellTemplate == undefined)
          colDef.cellTemplate = "{{data[column.fieldName]}}";
        if (colDef.pinned){
          elementName = "fct" + pinnedIndex;
          $scope.pinnedColumns.push(colDef);      // "замороденные" колонки налево
          pinnedIndex++;
        }
        else {
          elementName = "thr" + headerIndex;
          $scope.gridColumnsHeaders.push(colDef); // остальные направо ))
          headerIndex++;
        }
        colDef.html = document.getElementById("thr" + headerIndex);  // сохраняем ссылку на ячейку заголовка для изменения его ширины в будущем
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
          scope.InitializePinnedColumns(0); // заполняет свойство cells у pinned колонки
          scope.SetHeaderSize();             // adjust width and height of tab_container div
          scope.CalculateRowsHeight();
          scope.$apply();
/*          window.addResizeListener(element[0], function () {
            scope.setSize();
          });*/
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