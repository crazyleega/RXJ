/**
 * Created by xiaoF on 15/9/2.
 */
app.controller("chatCtrl", ["$scope","stompService","$state","chatService",
    function ($scope,stompService,$state,chatService) {
      $scope.goChat=function(user){
        chatService.clearBadge(user)
        $state.go('user',{user:user});
      }
      $scope.$on('$destroy', function (data) {
        console.log("$destroy chat")
        // say goodbye to your controller here
        // release resources, cancel request...
      })
    }]);
