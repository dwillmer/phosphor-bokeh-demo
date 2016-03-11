var fs = require('fs-extra');
fs.copySync('data/', 'lib/', { filter: /\.css$/ });
