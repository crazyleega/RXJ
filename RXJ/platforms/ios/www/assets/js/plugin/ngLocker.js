angular.module('ngLocker', []).
  provider('lockerFactory', function () {

    // expose to provider
    this.$get = ['$state','ngNotify',
      function ($state,ngNotify) {

      var self = this;

        self.password="123";
      return function lockerFactory(options) {

        var locker =  new PatternLock(options.element, options.settings);


        locker.checkForPattern(self.password, function() {
          locker.reset();
          $state.go("dash")
        }, function() {
          locker.reset();
              ngNotify.set("从左至右连接三个点","error")
          })

        var wrappedLocker = {
          setPassword: function (password) {
            locker.setPattern(password);
          }
        };

        return wrappedLocker;
      };
    }];
  });
