/**
 * Created by Mac on 15/10/18.
 */
app.factory("dashService",["$q","ngNotify",function($q,ngNotify){



    var deferred = $q.defer();
    var  promise=deferred.promise;

    return {
        todoInfo:function(){

            var query = new AV.Query("Activity");
            query.find({
                success: function(results) {
                   // alert("Successfully retrieved " + results.length + " Activity.");

                    ngNotify.set("activity list is success","success");
                    deferred.resolve(results);

                },
                error: function(results,error) {
                    //alert("Error: " + error.code + " " + error.message);
                    ngNotify.set(error.message,"error");
                    deferred.reject(error);
                }


            });

             return promise;

        }}


}])