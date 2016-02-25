(function(){
  try{
    if(!Array.prototype.hasOwnProperty('find'))
      Object.defineProperty(Array.prototype, 'find', {
                                            enumerable: false,  // this will make it not iterable
                                            writable: true,
                                             value: function(callback){
                                                      for(var i = 0; i< this.length; i++){
                                                        var item = this[i];
                                                        if( callback(item, i, this))
                                                          return item;
                                                      }
                                                    }
      });
    if(!String.prototype.hasOwnProperty('repeat'))
      Object.defineProperty(String.prototype, 'repeat', {
                                            enumerable: false,  // this will make it not iterable
                                            writable: true,
                                             value: function(howMatch){
                                                      if(howMatch < 0)
                                                        return undefined;
                                                      var item = '';
                                                      for(var i = 0; i< howMatch; i++){
                                                        item += this;
                                                      }
                                                      return item
                                                    }
      });
  }
  catch(e){
    console.log(e);
  }
})();
// класс для настройки источника данных
function initSources(scope) {
  scope.source =
  {
    sources: [
              {
                caption: 'Среда',
                selected: {},
                values: [
                            { ID: -1, Name: '- Всё -', Description: 'Все среды', Type: '' },
                            { ID: -2, Name: 'Dev', Description: 'Среда разработки', Type: 'Dev' },
                            { ID: -3, Name: 'Test', Description: 'Тестовая среда', Type: 'Test' },
                            { ID: -4, Name: 'Stage', Description: 'Стейджевая среда', Type: 'Stage' },
                            { ID: -5, Name: 'Prod', Description: 'Продовая среда', Type: 'Prod' }
                          ],
                onchange: undefined,
                loaded:false
              },
              {
                caption: 'Приложение',
                selected: {},
                values: [
                            {
                              __metadata: {
                                uri: "",
                                type: ""
                              },
                              ID: -1,
                              Name: '- Все -',
                              Description: 'Все прилодения',
                              Source: {
                                __deferred: {
                                  uri: ''
                                }
                              },
                              BusinessProcess: {
                                __deferred: {
                                  uri: ''
                                }
                              }
                            }
                          ],
                onchange: undefined,
                loaded:false
              },
              {
                caption: 'Процессы',
                selected: {},
                values: [
                            {
                              __metadata: {
                                uri: '',
                                type: ''
                              },
                              ID: -1,
                              ApplicationID: -1,
                              ApplicationHostID: null,
                              Name: '- Все -',
                              Description: 'Все процессы',
                              DisplayOrder: 1,
                              FilterMessageText: null,
                              FilterAdditionalInfo: null,
                              FilterServiceName: '',
                              FilterMethodName: '',
                              FilterSourceIDs: '',
                              FilterMessageType: '',
                              Application: {
                                __deferred: {
                                  uri: 'http://localhost:45000/UnilogDataService.svc/BusinessProcess(2)/Application'
                                }
                              },
                              ApplicationHost: {
                                __deferred: {
                                  uri: 'http://localhost:45000/UnilogDataService.svc/BusinessProcess(2)/ApplicationHost'
                                }
                              }
                            }
                          ],
                onchange: undefined,
                loaded:false
              }
            ],

    // возвращает объект среды по индексу
    getEnvironmentById: function (id) {
      if (id == undefined) return {};
      var foundedItem = undefined;
      return this.sources[0].values.find(function (e, i, a) {
        return e.ID == id;
      });
    },
    // возвращает объект приложения по индексу
    getApplicationById: function (id) {
      if (id == undefined) return {};
      return this.sources[1].values.find(function (e, i, a) {
        return e.ID == id;
      });
    },
    // возвращает объект приложения по индексу
    getBusinessProcessById: function (id) {
      if (id == undefined) return {};

      return this.sources[2].values.find(function (e, i, a) {
        return e.ID == id;
      });
    },
    // возвращает объект приложение по объекту процесса
    getApplicationByProcess: function (process) {
      if (process == undefined || process.ApplicationID == undefined)
        return {};

      return this.sources[1].values.find(function (e, i, a) {
        return e.ID == process.ApplicationID;
      });
    },
    // устанавливает объект приложения по ид в выбранное
    setApplicationById: function (id) {
      this.sources[1].selected = this.getApplicationById(id);
    },
    // устанавливает объект среда по ид в выбранное
    setEnvironmentById: function (id) {
      this.sources[0].selected = this.getEnvironmentById(id);
    },
    // устанавливает объект среда по типу в выбранное
    setEnvironmentByType: function (t) {
      if (t == undefined || typeof t !== 'string')
        return;
      var env = this.sources[0].values.find(function (e, i, a) {
        return e.Type == t;
      });
      if (env != undefined)
        this.sources[0].selected = env;
    },
    // устанавливает объект бизнесс-процесс по ид в выбранное
    setBisnessProcessById: function (id) {
      this.sources[2].selected = this.getEnvironmentById(id);
    }
  }
  scope.source.setEnvironmentById(-1);
  scope.source.setApplicationById(-1);
  scope.source.setBisnessProcessById(-1);

}

// чудо программисткой мысли - генератор псевдо-GUID 

/*
* Generate a random uuid.
*
* USAGE: Math.uuid(length, radix)
*   length - the desired number of characters
*   radix  - the number of allowable values for each character.
*
* EXAMPLES:
*   // No arguments  - returns RFC4122, version 4 ID
*   >>> Math.uuid()
*   "92329D39-6F5C-4520-ABFC-AAB64544E172"
* 
*   // One argument - returns ID of the specified length
*   >>> Math.uuid(15)     // 15 character ID (default base=62)
*   "VcydxgltxrVZSTV"
*
*   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
*   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
*   "01001010"
*   >>> Math.uuid(8, 10) // 8 character ID (base=10)
*   "47473046"
*   >>> Math.uuid(8, 16) // 8 character ID (base=16)
*   "098F4D35"
*/
Math.uuid = (function () {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  return function (len, radix) {
    var chars = CHARS, uuid = [], rnd = Math.random;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | rnd() * radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | rnd() * 16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
        }
      }
    }

    return uuid.join('');
  };
})();
Math.IntToStrNN = function (arg, width) {
  var aux = arg.toString();
  return ((width >= aux.length) ? '0'.repeat(width - aux.length) : '') + aux;
};