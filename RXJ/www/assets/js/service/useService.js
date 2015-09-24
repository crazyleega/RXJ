app.factory('userService', function() {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var users = [{
      id: 0,
      name: 'Ben Sparrow',
      face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
    }, {
      id: 1,
      name: 'Max Lynx',
      face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
    }, {
      id: 2,
      name: 'Adam Bradleyson',
      face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
    }, {
      id: 3,
      name: 'Perry Governor',
      face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
    }, {
      id: 4,
      name: 'Mike Harrington',
      face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
    }];

    return {
      all: function() {
        return users;
      },
      remove: function(users) {
        users.splice(users.indexOf(users), 1);
      },
      get: function(id) {
        for (var i = 0; i < users.length; i++) {
          if (users[i].id === parseInt(id)) {
            return users[i];
          }
        }
        return null;
      }
    };
  });
