var xmlController = angular.module("xmlViewer",['ngSanitize'])
.directive("xmlViewer",function(){
  var recurScan = function(dom, curRowNum, lines, level, parent){
    curRowNum ++;
    var linesElement = {
                        StartDomNode: dom,
                        StartRownumber: curRowNum, 
                        EndRowNumber:undefined, 
                        HasChildren: dom.children.length > 0,
                        EndDomNode:dom.children.length > 0 ? undefined : dom,
                        Level :level,
                        Tab   :level > 0?"&nbsp;".repeat(level):"",
                        LeafClosed:false,
                        RowVisible:true,
                        Parent : parent
                       };
    for(var i=0; i< dom.children.length; i++)
    {
      curRowNum = recurScan(dom.children[i], curRowNum, lines, level+1, linesElement);
    }
    linesElement.EndRowNumber = curRowNum;
    lines.push(linesElement);
    if(linesElement.HasChildren)
    {
      curRowNum ++;
      lines[lines.length-1].EndRowNumber = curRowNum;
      lines.push({
                  StartDomNode: undefined,
                  StartRownumber: curRowNum, 
                  EndRowNumber:curRowNum, 
                  HasChildren: false,
                  EndDomNode:dom,
                  Level:level,
                  Tab   :linesElement.Tab,
                  LeafClosed:false,
                  RowVisible:true,
                  Parent : linesElement
                });
    }
    return curRowNum;
  };
/*  var recurBuild = function(dom, ){
    
  };*/
  dObject = {
    restrict:"E",
    scope:{
      xml:"=",
      dom:"="
    },
    templateUrl:'views/xmlViewer.html',
    link: function(scope, element, attrs, controller){
      
    },
    controller:['$scope', function($scope){
      // проверяем все ли на месте
      if($scope.dom == undefined && $scope.xml == undefined){
        console.log("There is no data. Check xml and dom attributes");
        return;
      }
      // парсим строку в DOM
      if($scope.dom == undefined && $scope.xml !== undefined && $scope.xml.length > 0){
        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString($scope.xml, "text/xml");
        $scope.dom = oDOM.documentElement;
      }
      $scope.onNodeClick = function(node, lines){
        node.LeafClosed = !node.LeafClosed
        for(var i = node.StartRownumber ; i < node.EndRowNumber; i++)
        {
          if(node.$$hashKey == lines[i].Parent.$$hashKey)
            lines[i].RowVisible = !node.LeafClosed;
          else
            if(!node.LeafClosed && !lines[i].Parent.LeafClosed)
              lines[i].RowVisible = !node.LeafClosed;
            else
              if(node.LeafClosed)
                lines[i].RowVisible = !node.LeafClosed;
        }
      };
      // инициализируем массив для сворачивания строк
      $scope.Lines = [];
      recurScan($scope.dom, 0, $scope.Lines, 1);
      $scope.Lines = $scope.Lines.sort(function(a,b){
        return a.StartRownumber > b.StartRownumber ? 1 : (a.StartRownumber < b.StartRownumber ? -1 : 0);
      });
    }]
  };
  return dObject;
});