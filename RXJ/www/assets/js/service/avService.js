/**
 * Created by xiaoF on 15/9/25.
 */



app.factory("avService", ["GLOBAL_CONSTANT",
  function (GLOBAL_CONSTANT) {

    AV.initialize(GLOBAL_CONSTANT.AVID, GLOBAL_CONSTANT.AVKEY);

  return {
    login: function(account,password) {
      AV.User.logInWithMobilePhone(account, password).then(function(user){
        //登录成功
      }, function(err){
        //登录失败
      });
    },
    remove: function(users) {
      users.splice(users.indexOf(users), 1);
    },
    get: function(id) {
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === parseInt(id)) {
          return users[i];
        }
      }
      return null;
    }
  };
}]);
