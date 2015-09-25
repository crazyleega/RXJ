/**
 * Created by xiaoF on 15/9/2.
 */
  app.controller("drawCtrl", ["$scope",
    function ($scope) {

      $scope.$on('$destroy', function (data) {
        console.log("$destroy draw")
        // say goodbye to your controller here
        // release resources, cancel request...
      })
    }]);
