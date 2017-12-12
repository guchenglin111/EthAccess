'use strict';
const config = require('config');
const fs = require('fs');
const Q = require('q');
const logger = require('../lib/common/winstonlog.js');
const web3 = require('../lib/common/ethweb.js');
const util = require('../lib/common/util.js');

logger.info('web3 init-ed');

var walletapi = {};

walletapi.getBalance = (address) => {
    logger.debug('walletapi.getBalance: try to getBalance, address =', address);  
    return web3.eth.getBalance(address);
};

logger.info('walletapi finished loading');

module.exports = walletapi;
