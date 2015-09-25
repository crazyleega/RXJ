/**
 * Created by xiaoF on 15/9/15.
 */


app.directive('locker', ["lockerFactory", function(lockerFactory){
  return {
    restrict: 'AE',
    template: '<div class="pattern-holder"></div>',
    replace: true,
    link: function (scope, element, attrs) {

      var locker = lockerFactory({
        element:element,
        settings:{
          margin: 15
        }
      })
    }
  }
}]);
