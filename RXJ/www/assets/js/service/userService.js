/**
 * Created by Mac on 15/10/15.
 */
app.factory('registerService',['$q','GLOBAL_CONSTANT','ngNotify',function($q,GLOBAL_CONSTANT,ngNotify){
  AV.initialize(GLOBAL_CONSTANT.AVID, GLOBAL_CONSTANT.AVKEY);
  var deferred = $q.defer();
  return {
    register:function(data){
      console.log(data.phone+' ,in service');
      var user = new AV.User();
      user.setMobilePhoneNumber(data.phone);
      user.setPassword(data.password);
      user.setUsername(data.phone);
      user.signUp(null,{
        success:function(data){
          deferred.resolve(data);
          console.log("account create is success");
        },
        error:function(user,error){
          deferred.reject(error);
          console.log(error.message);
          ngNotify.set(error.message,"error");
        }
      });
      return deferred.promise;
    },
    confirmCode:function(data){
      AV.User.verifyMobilePhone(data).then(function(){
        deferred.resolve()
      },function(error){
        console.log(error.message);
        deferred.reject();
      });

      return deferred.promise;
    }
  }
}]);
