/**
 * Created by Mac on 15/10/17.
 */
app.controller("mineCtrl",['$scope','$state','mineService','$rootScope',function($scope,$state,mineService,$rootScope){

    $rootScope.showError = false;

    $scope.user={
        phone:'',
        code:'',
        password:''
    }

    $scope.flag = 1;

    var promise = [];
    
    $scope.getCode= function () {

       promise=mineService.getCode($scope.user.phone).then(
            function(){
                $scope.flag = 2;
                console.log("发送成功");
            },function(error){
                $scope.flag = 1;
            }

        )
    };

    $scope.confirmPassword=function () {

        promise= mineService.confirmPassword($scope.user.password,$scope.user.code).then(
            function(){
                console.log("修改成功");
                $state.go('login');
            },function(error){
                $scope.flag = 2;
            }
        )
    }



}])