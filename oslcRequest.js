/*
 * Copyright 2014 IBM Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Provide a couple of useful extensions to request.js for OSLC
 * purposes. One is to handle an authenticaiton challenge on any
 * GET operation. The other is to provide some convenience functions
 * for handling cookies.
 */

var URI = require('urijs');
var request = require("superagent");
const agent = request.agent();

/* 
 * Extend GET to respond to jazz.net app authentication requests
 * using JEE FORM based authentication
 */
request.authGet = function (options, callback) {
	var _self = this;
	let uri = new URI((typeof options === "string")? options: options.uri);
	let serverURI = uri.origin() + uri.path();
	agent
    .get(options)
    .set("Accept", 'application/rdf+xml')
	.set("OSLC-Core-Version", '2.0')
	.set("Content-Type", 'application/x-www-form-urlencoded')
    .end(function(error, response) {
        if (response &&  (response.headers['x-com-ibm-team-repository-web-auth-msg'] === 'authrequired' || response.redirects.length)) {
			// JEE Form base authentication
			agent
			.post(serverURI + '/j_security_check?j_username='+_self.userId+'&j_password='+_self.password)
			.end(function(err, res) {
				callback(err, res, res.body.toString())
			});
		} else if (response && response.headers['www-authenticate']) {
			// OpenIDConnect authentication (using Jazz Authentication Server)
			agent.get(options, callback).auth(_self.userId, _self.password, false)
		} else {
			callback(error, response, response.body.toString())
		}
    });
}

/* 
 * Extend GET to respond to jazz.net app authentication requests
 * using JEE FORM based authentication
 */
request.authGetJSON = function (options, callback) {
	var _self = this;
	let uri = new URI((typeof options === "string")? options: options.uri);
	let serverURI = uri.origin() + uri.path();
	agent
    .get(options.uri)
    .set("Accept", 'application/json')
	.set("OSLC-Core-Version", '2.0')
    .end(function(error, response) {
        if (response &&  (response.headers['x-com-ibm-team-repository-web-auth-msg'] === 'authrequired' || response.redirects.length)) {
			// JEE Form base authentication
			agent
			.post(serverURI + '/j_security_check?j_username='+_self.userId+'&j_password='+_self.password)
			.end(function(err, res) {
				callback(err, res, res.body)
			});
		} else if (response && response.headers['www-authenticate']) {
			// OpenIDConnect authentication (using Jazz Authentication Server)
			agent.get(options, callback).auth(_self.userId, _self.password, false)
		} else {
			callback(error, response, response.body)
		}
    });
}

module.exports = request

