/**
 * Created by Mac on 15/10/18.
 */

app.factory("mineService",['$rootScope','$state','$q','ngNotify',function($rootScope,$state,$q,ngNotify) {

    var deferred = $q.defer();

    return {

        getCode: function (phone) {

            AV.User.requestPasswordResetBySmsCode(phone, {
                success: function (data) {

                    console.log(phone);

                    deferred.resolve(data);
                    console.log("code is success");

                },
                error: function (data, error) {
                    // Show the error message somewhere
                    //alert("Error: " + error.code + " " + error.message);

                    console.log("error");

                    console.log(error.message);
                    ngNotify.set(error.message, "error");
                }
            });
            return deferred.promise;
        },

        confirmPassword: function (NewPassword, code) {

            AV.User.resetPasswordBySmsCode(NewPassword, code, {
                success: function (data) {

                    console.log(NewPassword);
                    console.log(code);

                    deferred.resolve(data);
                    console.log("success");

                },
                error: function (data, error) {
                    // Show the error message somewhere
                    //alert("Error: " + error.code + " " + error.message);

                    console.log("error");

                    console.log(error.message);
                    ngNotify.set(error.message, "error");
                }
            });
            return deferred.promise;
        }
    }


}]);
