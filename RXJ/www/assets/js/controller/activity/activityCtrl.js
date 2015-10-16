/**
 * Created by Mac on 15/10/16.
 */
app.controller("addActivityCtrl",["$scope","activityService","$state","ngNotify",function($scope,activityService,$state,ngNotify){
  $scope.activity = {
    topic:"",
    address:"",
    activityDate:"",
    guests:"",
    memo:""

  };
  console.log("this is in addActivityCtrl");
  $scope.addActivity = function(){
    if($scope.activity.topic == ""){
      ngNotify.set("topic is null","warn");
      return ;
    }
    if($scope.activity.address == ""){
      ngNotify.set("address is null","warn");
      return ;
    }
    if($scope.activity.activityDate == ""){
      ngNotify.set("activityDate is null","warn");
      return ;
    }
    if($scope.activity.guests == ""){
      ngNotify.set("guests is null","warn");
      return ;
    }

    var promise  = activityService.addActivity($scope.activity);
    promise.then(function(data){
      console.log("add success,data is"+angular.fromJson(data));
      $state.go("dash");
    },function(){
      console.log("error add");
    })
  }


}]);
