app.config(["$stateProvider", "$urlRouterProvider",
  function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: "assets/tpl/user/login.html",
        controller: 'loginCtrl'
      })

      .state('register', {
        url: '/register',
        templateUrl: "assets/tpl/user/register.html",
        controller: 'registerCtrl'
      })
      .state('dash', {
        url: '/dash',
        templateUrl: "assets/tpl/dash/dash.html",
        controller: 'dashCtrl'
      });


    $urlRouterProvider.otherwise('/login');
    //$locationProvider.html5Mode(true);
  }]);
