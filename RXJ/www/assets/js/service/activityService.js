/**
 * Created by Mac on 15/10/16.
 */
app.factory("activityService",["$q","ngNotify",function($q,ngNotify){
  var Activity = AV.Object.extend("Activity");
  var activity = new Activity();
  var deferred = $q.defer();
  return {
    addActivity:function(activityInfo){
      activity.set("topic",activityInfo.topic);
      activity.set("address",activityInfo.address);
      activity.set("activityDate",activityInfo.activityDate);
      activity.set("guests",activityInfo.guests);
      activity.set("memo",activityInfo.memo)
      activity.save(null,{
        success:function(post){
          console.log("this is data id is "+post.id);
          ngNotify.set("activity add is success","success");
          deferred.resolve(post);
        },
        error:function(post,error){
          ngNotify.set(error.message,"error");
          deferred.reject(error);
        }
      });
      return deferred.promise;
    }
  }
}]);
