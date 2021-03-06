const http = require('http');
const request = require('request');
const moment = require('moment');
const logger = console;
var SocksProxyAgent = require('socks-proxy-agent');
var agent = new SocksProxyAgent('socks://127.0.0.1:7891');
var argv = require('./argv')
var default_post_headers = {
    'content-type': 'application/json;charset=utf-8',
}

var agentOptions = {
    keepAlive: true,
    maxSockets: 256,
}

exports.get = function(url, options) {
    // console.log(`${moment().format()} HttpGet: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            method: 'get',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,
        }
        request.get(httpOptions, function(err, res, body) {
            if (err) {
                reject(err);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
}

exports.post = function(url, postdata, options) {
    // console.log(`${moment().format()} HttpPost: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            body: typeof postdata === 'object' ? JSON.stringify(postdata) : postdata,
            method: 'post',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,
        };
        request(httpOptions, function(err, res, body) {
            if (err) {
                reject(err);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
};

exports.delete = function(url, postdata, options) {
    // console.log(`${moment().format()} HttpPost: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            body: typeof postdata === 'object' ? JSON.stringify(postdata) : postdata,
            method: 'delete',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,            
        };
        request(httpOptions, function(err, res, body) {
            if (err) {
                reject(body);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
};

exports.put = function(url, postdata, options) {
    // console.log(`${moment().format()} HttpPost: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            body: typeof postdata === 'object' ? JSON.stringify(postdata) : postdata,
            method: 'put',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,            
        };
        request(httpOptions, function(err, res, body) {
            if (err) {
                reject(body);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
};

exports.form_post = function(url, postdata, options) {
    // console.log(`${moment().format()} HttpFormPost: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            form: postdata,
            method: 'post',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,            
        };
        request(httpOptions, function(err, res, body) {
            if (err) {
                reject(err);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
};

exports.form_delete = function(url, postdata, options) {
    // console.log(`${moment().format()} HttpPost: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            form: postdata,
            method: 'delete',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,            
        };
        request(httpOptions, function(err, res, body) {
            if (err) {
                reject(body);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
};

exports.form_put = function(url, postdata, options) {
    // console.log(`${moment().format()} HttpPost: ${url}`)
    return new Promise((resolve, reject) => {
        options = options || {};
        var httpOptions = {
            url: url,
            form: postdata,
            method: 'put',
            timeout: options.timeout || 30000,
            headers: options.headers || default_post_headers,
            proxy: options.proxy || '',
            agentOptions: agentOptions,
            agent: argv.noProxy ? null : agent,            
        };
        request(httpOptions, function(err, res, body) {
            if (err) {
                reject(body);
            } else {
                if (res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            }
        }).on('error', logger.error);
    });
};