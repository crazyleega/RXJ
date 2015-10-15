/**
 * Created by Mac on 15/10/13.
 */

  app.factory("loginService",['$rootScope','$timeout','$state',function($rootScope,$timeout,$state){

//  //初始化数据库
    AV.initialize("PROuGIplobnLW5GnyR8CFXhc",

      "9JEyolOHOAGPJlaeh1JAmau9");//相当于连接数据库

    return {
      login: function (user, pw) {

        AV.User.logIn(user, pw, {
          success: function (user) {
            // 成功了，现在可以做其他事情了.

            console.log('login in successfully: %j', AV.User.current());
            $state.go('dash');

            var currentUser=AV.User.current();
            console.log(currentUser._serverData.username);

          },
          error: function (user, error) {
            // 失败了.
            console.log("error");

            $timeout(function () {
              $rootScope.showError = true;
            }, 1000);
            //
            $state.go('login');


          }
        });
      },
      remove: function (users) {
        users.splice(users.indexOf(users), 1);
      },
      get: function (id) {
        for (var i = 0; i < users.length; i++) {
          if (users[i].id === parseInt(id)) {
            return users[i];
          }
        }
        return null;
      }
    }
  }]);














