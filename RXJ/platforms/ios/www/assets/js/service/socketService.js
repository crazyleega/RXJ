app.factory('socketService',  ["socketFactory","GLOBAL_CONSTANT",
  function (socketFactory,GLOBAL_CONSTANT) {
  return socketFactory({
    ioSocket: io.connect(GLOBAL_CONSTANT.SOCKETIO.HOST)
  });
}])

