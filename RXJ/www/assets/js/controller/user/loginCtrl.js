///**
// * Created by Mac on 15/10/12.
// */
//

app.controller('loginCtrl',['$scope','$rootScope','loginService','$state',
  function($scope,$rootScope,loginService,$state){

    $state.go('login');

    $rootScope.showError = false;

    $scope.user={
      account:'',
      password:''
    };

    $scope.login = function () {

      console.log($scope.user.account);
      console.log($scope.user.password);

      loginService.login($scope.user.account, $scope.user.password
      )

    }}]);













