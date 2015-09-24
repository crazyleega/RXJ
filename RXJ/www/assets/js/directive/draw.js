/**
 * Created by xiaoF on 15/9/15.
 */


app.directive('draw', ["socketService","boardFactory", function(socketService, boardFactory){
  return {
    restrict: 'AE',
    template: '<div class="row" style="height: 350px;" data-draw-tag="dak"></div>',
    replace: true,
    link: function (scope, element, attrs) {
      var board = boardFactory({
        element:element
      })
      board.bind("board:saveSessionStorage",function(data){
        socketService.emit("board:send",data)
      })
      socketService.on('board:message', function (data) {
        console.log("board:message");
        board.setWebStorage(data);
      })
    }
  }
}]);
