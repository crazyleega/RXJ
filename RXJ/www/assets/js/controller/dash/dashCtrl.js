/**
 * Created by xiaoF on 15/9/2.
 */
app.controller("dashCtrl", ["$scope",
    function ($scope) {
      $scope.$on('$destroy', function (data) {
        console.log("$destroy dash")
        // say goodbye to your controller here
        // release resources, cancel request...
      })
    }]);
