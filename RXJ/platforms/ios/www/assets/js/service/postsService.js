app.factory("postsService", ["GLOBAL_CONSTANT", "$q", "$http","$ionicLoading","ngNotify",
  function (GLOBAL_CONSTANT, $q, $http,$ionicLoading,ngNotify) {
    var _posts =[]
    return {
      all: function () {
        if(_posts.length===0){
          $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-positive"></ion-spinner>'
          });
        var promises = [];
        var workDone = false;
        angular.forEach(GLOBAL_CONSTANT.POSTS, function (post) {

          var promise = $http.jsonp(GLOBAL_CONSTANT.GITHUBAPIHOST + 'repos/' + post.NAME + '/' + post.REPO + '/issues?callback=JSON_CALLBACK', {
            params: {}
          })
          promises.push(promise);
        });
        return $q.all(promises).then(function (data) {
          var posts = []
          if (posts.length === 0) {
            for (var i = 0; i < data.length; i++) {
              if (data[i].data.meta.status == 200) {
                posts.push(data[i].data.data[0]);
                data[i].data.data.shift();
                break;
              }
            }
          }
          angular.forEach(data, function (postArray) {
            if (postArray.data.meta.status == 200) {
              angular.forEach(postArray.data.data, function (postObj) {
                for (var i = 0; i < posts.length; i++) {
                  if ((new Date(postObj.created_at).getTime()) >= (new Date(posts[i].created_at).getTime())) {
                    posts.splice(i, 0, postObj);
                    workDone = true
                    break;
                  }
                }
                if (!workDone) {
                  posts.push(postObj);
                }
              })
            }
          });
          $ionicLoading.hide();
          _posts = posts
          return posts
        }).catch(function(error){
          ngNotify.set("GitHub API 好像请求不到数据哟..","error")
          $ionicLoading.hide();
        });
        }else{ return $q.when(_posts)}
      }
    }
  }]);
