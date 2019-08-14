"use strict";

module.exports = function(){
	const Md5File = require('md5-file/promise');
	const Md5 = require('md5');		
	const Path = require('path');
	const AppDir = Path.dirname(require.main.filename);	
	const Logger = require('./Logger.js');
	const Config = require('../config.json');
	const winston = new Logger('Toolbox');

	this.getWorkSetHash = async MFalcon => {
		var DbAndMFalconConfigHash = await Md5File(MFalcon.routes_db);
		DbAndMFalconConfigHash = Md5(DbAndMFalconConfigHash+JSON.stringify([MFalcon.departure, MFalcon.arrival, MFalcon.autonomy]));
		return DbAndMFalconConfigHash;
	}

	this.getAppParams = () => {
		var params = {};
		params.Port = (parseInt(process.env.PORT, 10) || process.env.PORT) || Config.Port || 3000;
		params.MaxSimultaneousComputation = (parseInt(process.env.MAX_SIMULTANEOUS_COMPUTATION, 10) || process.env.MAX_SIMULTANEOUS_COMPUTATION) || Config.MaxSimultaneousComputation || 10;
		params.AllowAllAccessControlOrigins = (parseInt(process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN, 10) || process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN) || Config.AllowAllAccessControlOrigins || false;
		params.MaxSentRouteToClient = (parseInt(process.env.MAX_SENT_ROUTE_TO_CLIENT, 10) || process.env.MAX_SENT_ROUTE_TO_CLIENT) || Config.MaxSentRouteToClient || 10;
		params.HardTimeoutSec = (parseInt(process.env.HARD_TIMEOUT_SEC, 10) || process.env.HARD_TIMEOUT_SEC) || Config.HardTimeoutSec || 60;
		params.SoftTimeoutSec = (parseInt(process.env.SOFT_TIMEOUT_SEC, 10) || process.env.SOFT_TIMEOUT_SEC) || Config.SoftTimeoutSec || 30;
		params.MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/millenium-falcon.json';
		params.BufferDbPath = process.env.BUFFER_DB_PATH || Config.BufferDbPath || './dataset/buffer.db';	
		return params;
	}

	this.sleep = ms => (new Promise((resolve, reject) => setTimeout(resolve, ms)));

	this.displayMFalcon = () => console.log(`
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWXklcdXMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNKko:'.   ,xXMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWXOdc,.         .oNMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWN0xol;.             'dXWMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMWKko:'.                'dXMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMWXOdc,.                   'dXWMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMWX0xl;.                      'dXMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMN0xl;..                        'dXWMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMW0l,.                           'dXMMMMMMMMMMMMMMMMMMMMMMWWMMMM
MMMMMMMMMMMMO'                            'oXWMMWXkONMMMMMMMMMMMMMMNk:;xXMM
MMMMMMMMMMMWd.                          'oXMMMWXd' .;kNMMMMMMMMMMNk;    ,kW
MMMMMMMMMWO:.                         'dXWMMMXd'      ;OWMMMMMMNk;       :X
MMMMWXKKk:.                        'dOXMMMMXd'        .dNMMMMNk;        .kW
MMMKc...                         'dXWMMMMXd'        .c0WMMMNk;         .dWM
MM0;                           'dXMMMMWXd'        .c0WMMMNk;          .oNMM
MK;                      .';:lxXWMMMXOd'        .c0WMMMNk;            cXMMM
Xc                    .:x0NWMMMMMMMMKkl.      .c0WMMMNk;             :KMMMM
d.                  .lKWMMMMWNNNWMMMMMWXo.  .c0WMMMNk;              ,0MMMMM
,                  ,OWMMMNkl;,'';lxXWMMMW0ll0WMMMNk;               'OMMMMMM
.                 '0MMMWk,         'xKNMMMWWMMMNk;                .kNKOkOXW
                 .dWMMWk.           .'dWMMMMMNk;                 .lx:.   .o
                 .OMMMN:              ;KMMMWO;                   .'        
                 .kMMMNl              :XMMM0'                             .
                  lNMMMK;           ,lOMMMWo.                           .;O
.                 .dNMMMXd,.      'oKWWMMWk.                          .;kNM
c                  .lXMMMMN0xooox0NMMMMMXd.                         .;kNMMM
O.                   'oKWMMMMMMMMMMMWNKd,                    .....':kNMMMMM
Wd.                    .;lxOKXXXK0xo;'.                     lXNNNXNWMMMMMMM
MNo.                        .....                          cXMMMMMMMMMMMMMM
MMNo.                                                    .lXMMMMMMMMMMMMMMM
MMMNx'                                               '::ckNMMMMMMMMMMMMMMMM
MMMMWKc.                                           ,xXMMMMMMMMMMMMMMMMMMMMM
MMMMMMNk;                                        'xXMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMNk:.                                    .xWMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMW0o,.                                .;0MMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMN0d:..                         .;oONMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMWX0xl:,..           ...';ldOXWMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMWNKOxolc:::cloxO0KNWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM`);

}