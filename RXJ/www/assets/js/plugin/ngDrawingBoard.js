angular.module('ngDrawingBoard', []).
  provider('boardFactory', function () {


    // expose to provider
    this.$get = ['$timeout', function ($timeout) {

      var asyncAngularify = function (Board, callback) {
        return callback ? function () {
          var args = arguments;
          $timeout(function () {
            callback.apply(Board, args);
          }, 0);
        } : angular.noop;
      };

      return function boardFactory (options) {
        options = options || {};
        //var socket = options.ioSocket || io.connect();
        //var prefix = options.prefix === undefined ? defaultPrefix : options.prefix ;
        //var defaultScope = options.scope || $rootScope;

        var drawingBoard = new DrawingBoard.Board(options.element, {
          controls: [
            'Color', {
              Size: {
                type: 'dropdown'
              }
            }, {
              DrawingMode: {
                filler: false
              }
            },
            'Navigation'
          ],
          size: 1,
          webStorage: 'session',
          enlargeYourContainer: true,
          droppable: true, //try dropping an image on the canvas!
          stretchImg: true //the dropped image can be automatically ugly resized to to take the canvas size
        });

        var wrappedBoard = {
          setWebStorage:function(data){
            drawingBoard.setWebStorage(data);
          },
          bind: function (eventName, callback) {
            drawingBoard.ev.bind(eventName, asyncAngularify(drawingBoard, callback));
          }
        };

        return wrappedBoard;
      };
    }];
  });
