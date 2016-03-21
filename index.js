/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

/**
 * Application imports.
 */
var phosphide = require('phosphide/lib/core/application');
var commands = require('phosphide/lib/extensions/commandpalette');
var data = require('data/index');


/**
 * Create the application.
 */
var app = new phosphide.Application({
  extensions: [
    commands.commandPaletteExtension,
    data.dataExtension
  ]
});


/**
 * Post-creation setup.
 */
window.onload = () => {

  app.run().then(() => {

    app.shortcuts.add([
      {
        command: 'command-palette:toggle',
        sequence: ['Accel Shift P'],
        selector: '*'
      },
      {
        command: 'command-palette:hide',
        sequence: ['Escape'],
        selector: '[data-left-area="command-palette"]'
      }
    ]);

  });

 }
