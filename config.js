module.exports = {
	"baseURL": "http://localhost",
	"port": Number( process.env.PORT || 8002 ),
	"databaseURL": process.env.MONGOHQ_URL || "mongodb://localhost/ffstest",
	"pagesize": 25
};