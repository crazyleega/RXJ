/**
 * Created by mac on 15-9-10.
 */
app.factory('stompService',  ["stompFactory",
  function (stompFactory) {
    return stompFactory();
  }])
