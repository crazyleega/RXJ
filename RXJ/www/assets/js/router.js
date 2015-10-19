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

      //.state('tabs', {
      //  url: "/tab",
      //  abstract: true,
      //  templateUrl: "assets/tpl/tabs/tabs.html"
      //})
      //
      //.state('tabs.dash', {
      //  url: "/dash",
      //  views: {
      //    'dash-tab': {
      //      templateUrl: "assets/tpl/dash/dash.html"
      //    }
      //  }
      //})
      //.state('tabs.home', {
      //  url: "/home",
      //  views: {
      //    'home-tab': {
      //      templateUrl: "assets/tpl/home/home.html"
      //    }
      //  }
      //})
      //.state('tabs.mine', {
      //  url: "/mine",
      //  views: {
      //    'mine-tab': {
      //      templateUrl: "assets/tpl/mine/mine.html"
      //    }
      //  }
      //})

      .state('dash', {
        url: '/dash',
        templateUrl: "assets/tpl/dash/dash.html",
        controller: 'dashCtrl'
      })

        .state('home', {
          url: '/home',
          templateUrl: "assets/tpl/home/home.html",
          controller: 'homeCtrl'

        })

      .state('mine', {
        url: '/mine',
        templateUrl: "assets/tpl/mine/mine.html",
        controller: 'mineCtrl'

      })

        .state('todoItem', {
          url: '/todoItem',
          templateUrl: "assets/tpl/todo/todoItem.html"


        })

      .state("addActivity",{
        url:'/addActivity',
        templateUrl:"assets/tpl/activity/addActivity.html",
        controller:'addActivityCtrl'
      })

    //$urlRouterProvider.otherwise('');
    $urlRouterProvider.otherwise('/login');
    //$locationProvider.html5Mode(true);
  }]);
