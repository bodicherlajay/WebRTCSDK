var fs = require('fs');

var param = 'DHSResource';
var newValue = 'http://localhost:9001';
var sourceFile = 'js/APIConfigs.js';

var updatedData = '';

(function() {
   var util = {};

   util.updateConfigParameter = function(param, newValue, sourceFile) {
      data = fs.readFileSync(sourceFile, {
         encoding: 'utf8',
         mode: 'rw'
      })

      // console.log('data: ' + data);
      var lines = data.split('\n');
      for (var line in lines) {
         var theLine = lines[line].trim();
         if (theLine.indexOf(param) === 0) {
            var lastChar = theLine.charAt(theLine.length - 1);
            lines[line] = '\t' + param + ':\t\'' + newValue + '\'' + lastChar;
            console.log('found the line: ' + lines[line]);
         }

      }

      fs.writeFileSync(sourceFile, lines.join('\n'));
   };

   return util;
}());