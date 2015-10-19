/**
 * Created by xiaoF on 15/9/2.
 */
app.controller("dashCtrl", ["$scope","dashService",
    function ($scope,dashService) {

      $scope.items=[];


        dashService.todoInfo().then(function(data){
            $scope.items=data;

          console.log(data);

        },function(){
          console.log("error item");
        });


    }]);
