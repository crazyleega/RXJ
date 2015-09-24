angular.module('ngChat', []).
  provider('chatFactory', function () {

    // expose to provider
    this.$get = ['$timeout', 'GLOBAL_CONSTANT', 'ngNotify', '$rootScope','userService','$state','ngNotify','$q','$ionicScrollDelegate',
      function ($timeout, GLOBAL_CONSTANT, ngNotify, $rootScope,userService,$state,ngNotify,$q,$ionicScrollDelegate) {

      var self = this;
      self._initUser = function (data) {
        $rootScope.chatCache[data.id] = {}
        var userinfo= self._getUserInfo(data.id)
        $rootScope.chatCache[data.id]["id"] = data.id;
        $rootScope.chatCache[data.id]["name"] = userinfo.name;
        $rootScope.chatCache[data.id]["face"] = userinfo.face;
        $rootScope.chatCache[data.id]["records"] = [];
        $rootScope.chatCache[data.id]["badge"] = 0;

      }
      self._notify = function (currentID,data) {
        if(currentID != data.id){
          $rootScope.safeApply(function(){
            ++$rootScope.chatCache[data.id]["badge"];
            ++$rootScope.chatBadge;
          })
          ngNotify.set($rootScope.chatCache[data.id]["name"]+":"+data.msg.body, 'info');
        }else{
          $ionicScrollDelegate.$getByHandle('userScroll').scrollBottom()
        }
      },
      self._getUserInfo = function (userID) {
        return userService.get(userID)
      },
      self._getChatCache = function (data) {
      $rootScope.chatCache = {
        "0": {
          "id": 0,
          "name": "Ben Sparrow",
          "face": "https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png",
          "records": [{
            "body": "吃了没?"
          }, {
            "body": "还没呢!"
          }],
          "badge": 1
        },
        "1": {
          "id": 1,
          "name": "Max Lynx",
          "face": "https://avatars3.githubusercontent.com/u/11214?v=3&s=460",
          "records": [{
            "body": "在不在?"
          }],
          "badge": 0
        },
        "2": {
          "id": 2,
          "name": "Adam Bradleyson",
          "face": "https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg",
          "records": [{
            "body": "什么时候回家?"
          }, {
            "body": "什么时候回家?"
          }],
          "badge": 0
        },
        "3": {
          "id": 3,
          "name": "Perry Governor",
          "face": "https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png",
          "records": [{
            "body": "Stomp/Websocket/ActiveMQ"
          }],
          "badge": 0
        },
        "4": {
          "id": 4,
          "name": "Mike Harrington",
          "face": "https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png",
          "records": [{
            "body": "我是小付!!"
          }],
          "badge": 0
        }
      }
      },
      self._pushMsg = function (data) {
        $rootScope.safeApply(function() {
          $rootScope.chatCache[data.id]["records"].push(data.msg);
          //$rootScope.chatCache[data.id]["records"].unshift(data.msg);
        })
      },
      self._clearBadge = function (userID) {
        $rootScope.safeApply(function() {
          $rootScope.chatBadge-=$rootScope.chatCache[userID]["badge"];
          $rootScope.chatCache[userID]["badge"] = 0;
        })
      }

      $rootScope.chatCache = {};
      $rootScope.chatBadge = 1;
        self._getChatCache()

      return function chatFactory() {

        var wrappedChat = {
          set: function (data) {
              if (typeof $rootScope.chatCache[data.id] == "undefined") {
                self._initUser(data)
              }
              self._pushMsg(data);
              self._notify($state.params.user,data)
          },
          clearBadge: function (userID) {
            self._clearBadge(userID)
          }
        };

        return wrappedChat;
      };
    }];
  });
