/**
 * Created by Mac on 15/10/15.
 */
app.controller('registerCtrl',['$scope','$state','registerService',function($scope,$state,registerService){
  $scope.user = {
    phone:'',
    code:'',
    password:''
  };
  $scope.flag = 1;
  var promise = [];
  console.log('this is registerCtrl');
  $scope.registerUser = function(){
    //console.log(registerService.register($scope.user));
    promise = registerService.register($scope.user);
    promise.then(function(){
      $scope.flag = 2
      console.log("注册成功");
     // $state.go('dash')
    },function(error){
      $scope.flag = 1;
    })
  }
  $scope.confirmCode = function(){
    promise = registerService.confirmCode($scope.user.code);
    promise.then(function(){
      console.log("验证安全码成功");
    },function(){
      console.log("验证安全码失败");
    })
  }
}])
