var config = require( '../../config.js' );

module.exports = {
	baseURL: config.baseURL + ':' + config.port + '/api',
	databaseURL: config.databaseURL,
	pagesize: config.pagesize,
	projectsCollection: 'projects',
	usersCollection: 'users',
	issuesCollection: 'issues'
};