module.exports = {
	"baseURL": "http://localhost",
	"port": Number( process.env.PORT || 8002 ),
	"databaseURL": process.env.MONGOLAB_URI || "mongodb://localhost/ffstest",
	"pagesize": 25,
	"randomSeed": "cUg6looB4vot6lutH1chU3glyk7eg7Y"
};