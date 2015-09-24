app.config(["$stateProvider", "$urlRouterProvider","$locationProvider",
  function ($stateProvider, $urlRouterProvider,$locationProvider) {
    $stateProvider
        //.state('chatDetail', {
        //  //cache: true,
        //  url: '/chatDetail/:personId',
        //  templateUrl: "tpl/chatDetail.html",
        //  controller:'chatDetailController',
        //  onEnter:function(){
        //  },
        //  onExit:function(){
        //  }
        //})
        .state('locker', {
          url: '/',
          templateUrl: "assets/tpl/locker/locker.html",
          controller:'lockerCtrl',
          onEnter:function(){
            //angular.element(document.querySelector('p'))
          },
          onExit:function(){
            angular.element(document.getElementById('loading-cover')).hide()
          }
        })
        .state('dash', {
            url: '/dash',
            templateUrl: "assets/tpl/dash/dash.html",
            controller:'dashCtrl'
        })
        .state('posts', {
            url: '/posts',
            templateUrl: "assets/tpl/posts/posts.html",
            controller:'postsCtrl'
        })
        .state('draw', {
            params: {nodeURL:null},
            url: '/draw',
            templateUrl: "assets/tpl/draw/draw.html",
            controller:'drawCtrl'
        })
        .state('chat', {
            url: '/chat',
            templateUrl: "assets/tpl/chat/chat.html",
            controller:'chatCtrl'
        })
      .state('user', {
        params: {user:null},
        url: '/user',
        templateUrl: "assets/tpl/chat/user.html",
        controller:'userCtrl'
      })
        .state('post', {
          params: {content:null,commentData:null},
          url: '/post',
          templateUrl: "assets/tpl/posts/post.html",
          controller:'postCtrl'
        })
    $urlRouterProvider.otherwise('/');
    //$locationProvider.html5Mode(true);
}]);
