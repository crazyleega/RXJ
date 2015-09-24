angular.module('ngStomp', []).
  provider('stompFactory', function () {

    // expose to provider
    this.$get = ['$timeout','GLOBAL_CONSTANT','chatService','utils', function ($timeout,GLOBAL_CONSTANT,chatService,utils) {

      var asyncAngularify = function (stomp, callback) {
        return callback ? function () {
          var args = arguments;
          $timeout(function () {
            callback.apply(stomp, args);
          }, 0);
        } : angular.noop;
      };

      return function stompFactory() {
        var client = Stomp.client(GLOBAL_CONSTANT.MQ.HOST)
  client.connect(GLOBAL_CONSTANT.MQ.USERNAME, GLOBAL_CONSTANT.MQ.PASSWORD, function(frame) {

    angular.forEach(GLOBAL_CONSTANT.MQ.SUBSCRIBE, function (subject) {

      client.subscribe(subject, function(message) {
        chatService.set(JSON.parse(utils.bin2String(message.body)))
      });

    });

});

        var wrappedStomp = {
          send: function (id,msg) {
            client.send(GLOBAL_CONSTANT.MQ.SUBSCRIBE[0],{}, utils.string2Bin('{"id":'+id+',"msg":{"body":"'+msg+'"}}'));
          }
        };

        return wrappedStomp;
      };
    }];
  });
