# Usage

1. Install dependencies by running `npm install` in the project folder.
1. Start a Mongodb server. The project includes the shortcut `npm run-script db`.
1. Start the server by running `npm start`.

# Development

## Folders

1. **tests:** Independent test suite for the REST API. It can be run by opening a terminal in that folder, installing the project with `npm install` and then running the tests with `npm start`. Once the project is installed you can run the tests directly from root folder with `make test`.
1. **node_modules:** Any dependency automatically resolved with `npm install` will be placed here. Please, do not add any file here, this folder should be modified just by `npm`. This folder should be excluded from the Git repository as it can be create automatically by running `npm install`.
1. **docs:** Independent project where is located the REST API documentation. To browse the documentation just open the directory in a terminal window, instal the project with `npm install` and then run it with `npm start`. The log will show you the URL where you can browse the documentation.
1. **model:** This folder contains the declaration of the model, using Mongoose ODM. File `model.js` will load automatically any other `*.js` file in the folder and initialize a class for that model.
1. **controller:**  This folder contains the declaration of the controller. File `controller.js` will load automatically any other `*.js* file in the folder and hook it to the controller module.
1. **vendor:** Small utilities like regular expressions to verify emails or helpers to print messages in the log with fancy colors.

## Adding a new model

1. Check out [Mongoose](http://mongoosejs.com/) documentation.
1. Create a file `myclass.js` in folder `models`. That file will be automatically loaded so you will able to instantiate an object of your newly created class in `app.js` with just a line like this: `var my_instance = new Myclass();`
1. Check out [Mongoose documentation](http://mongoosejs.com/docs/guide.html) for more information about the structure of the model. `module.exports` will be passed directly to `new Schema()` to create the class.
1. If you need to validate a String using a regular expression take a look at `vendor/regex.js` as you may find there a regular expression to solve you problem. If there is no such regular expression, add it!

## Adding a new controller

1. Check out [Express](http://expressjs.com/api.html) documentation.
1. Create a file `mycontroller` in `controllers` folder if required. The best thing to do is to create just one controller file for each model file, as one controller file can be responsible for more than just one action.
1. If you have created a new file you'll need to access the model in the controller, so require the model with this line: `var model = require( '../models/model.js' );`. Remember that NodeJS caches any require, so you are not executing the module but getting access to the previously processed module, that means that this is very fast!
1. Add a function to handle the use case you want to implement. Remember that this function will have the following signature: `function( req, res )`, where `req` is the user's request and `res` is the server's response. You won't use `return` here, but will use `res.send();`.
1. Choose a descriptive name for you method and make it available by adding it to `module.exports`.
1. Modify `app.js` so when the proper request arrives is your new method the one called, using a line like this: `app.get( '/user', controller.User.allUsers );`.