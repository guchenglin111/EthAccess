'use strict';
const config = require('config');
const fs = require('fs');
const Q = require('q');
const logger = require('../lib/common/winstonlog.js');
const web3 = require('../lib/common/ethweb.js');
const util = require('../lib/common/util.js');
const Tx = require('ethereumjs-tx');

logger.info('web3 init-ed');

var walletapi = {};

walletapi.getBalance = (address) => {
    logger.debug('walletapi.getBalance: try to getBalance, address =', address);  
    return web3.eth.getBalance(address);
};

walletapi.newAccount = (pwd) => {
    logger.debug('walletapi.newAccount: try to newAccount, pwd =', pwd);  
    return web3.eth.personal.newAccount(pwd);
};

walletapi.importRawKey = (pri, pwd) => {
    logger.debug('walletapi.importRawKey: try to importRawKey');
    return web3.eth.personal.importRawKey(pri, pwd);
};

walletapi.privateKeyToAccount = (pri) => {
    logger.debug('walletapi.privateKeyToAccount');
    if (pri[0] != '0' || pri[1] != 'x') {
    	pri = '0x' + pri;
    }
    var address = web3.eth.accounts.privateKeyToAccount(pri);

    return address['address'];
};

walletapi.sendRawTransaction = (pri, to, value, data) => {
    logger.debug('walletapi.sendRawTransaction: try to sendRawTransaction');

    var privateKey = new Buffer(pri,'hex');
    var Gas, GasPrice, Number;

    return web3.eth.estimateGas({
        to: to,
        data: data
    }).then((gas) => {
        logger.debug('gas: ' + gas);
        Gas = gas;

        return web3.eth.getGasPrice();    
    }).then((gasPrice) => {
        logger.debug('gasPrice: ' + gasPrice);
        GasPrice = gasPrice;

        var address = web3.eth.accounts.privateKeyToAccount('0x' + pri);
        logger.debug('from: ' + address.address);
        return web3.eth.getTransactionCount(address.address);
    }).then((number) => {
        var rawTx = {
            nonce: '0x' + (number+1).toString(16),
            gasPrice: '0x' + GasPrice.toString(16), 
            gasLimit: '0x' + Gas.toString(16),
            to: '0x' + to.toString(16), 
            value: '0x' + value.toString(16), 
            data: data
            // nonce: '0x00',
            // gasPrice: '0x09184e72a000',
            // gasLimit: '0x27100',
            // to: '0xd485ae28690aa37edc0a509e370580e24f3f947b',
            // value: '0x10',
            // data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057'
        }

	    logger.debug('gas: ' + Gas.toString(16) + '; gasPrice: ' + GasPrice.toString(16) + '; nonce: ' + number.toString(16) ) 
    
        var tx = new Tx(rawTx);
        tx.sign(privateKey);
    
        var serializedTx = tx.serialize();
        //console.log(serializedTx.toString('hex'));
    
        var deferred = Q.defer()

        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(error, hash) {
            if (error) 
                deferred.reject(error);
            else
                deferred.resolve(hash);
        });

        return deferred.promise;
    }).fail((err) => {
        logger.error('Failed to sendRawTransaction err=', err);
    });
};

walletapi.sendTransaction = (from, to, value, pwd) => {
    logger.debug('walletapi.sendTransaction: try to sendTransaction');
    logger.debug('from: ' + from + ',  to: ' + to + ',  value: ' + value + ',  pwd: ' + pwd);

    return web3.eth.personal.unlockAccount(from, pwd).then((result) => {
        logger.debug('walletapi.sendTransaction: unlockAccount ' + result);

        var deferred = Q.defer();
        web3.eth.sendTransaction({
            from: from,
            to: to,
            value: value
        }, function(error, hash){
            if (error) 
                deferred.reject(error);
            else
                deferred.resolve(hash);
        });

        return deferred.promise;
    });
};

logger.info('walletapi finished loading');

module.exports = walletapi;
