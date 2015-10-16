/**
 * Created by Mac on 15/10/13.
 */

  app.factory("loginService",['$rootScope','$timeout','$state','$q','ngNotify',function($rootScope,$timeout,$state,$q,ngNotify){

//  //初始化数据库
    AV.initialize("PROuGIplobnLW5GnyR8CFXhc",

      "9JEyolOHOAGPJlaeh1JAmau9");//相当于连接数据库

    return {
      login: function (user, pw) {

        var deferred = $q.defer();
        var promise = deferred.promise;

        AV.User.logIn(user, pw, {
          success: function (data) {
            // 成功了，现在可以做其他事情了.

            deferred.resolve(data);
            console.log("login is success");

            console.log('login in successfully: %j', AV.User.current());

            var currentUser=AV.User.current();
            console.log(currentUser._serverData.username);

          },
          error: function (data, error) {
            // 失败了.
            console.log("error");

            console.log(error.message);
            ngNotify.set(error.message,"error");




          }
        });
        return promise;
      }
    }
  }]);














