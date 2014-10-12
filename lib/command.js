var exec = require('child_process').exec,
    Promise = require('promise'),
    concurrentCommands = 0,
    jobQueue = [],
    options = {
        maxConcurrentCommands: 0,
        maxBuffer: 100 * 1024 * 1024
    };

function run(command) {
    return new Promise(function (resolve, reject) {
        if (canRunJob()) {
            execCommand(command, resolve, reject);
        } else {
            jobQueue.push([command, resolve, reject]);
        }
    });
}

function execCommand(command, resolve, reject) {
    concurrentCommands += 1;
    exec(command, { maxBuffer: options.maxBuffer }, function (error, stdout, stderr) {
        concurrentCommands -= 1;

        if (error) {
            error.command = command;
            reject(error + stdout + stderr);
        } else {
            resolve(stdout + stderr);
        }

        while (jobQueue.length && canRunJob()) {
            execCommand.apply(execCommand, jobQueue.shift());
        }
    });
}

function canRunJob() {
    return !options.maxConcurrentCommands || concurrentCommands < options.maxConcurrentCommands;
}

function setOptions(newOptions) {
    Object.keys(newOptions).forEach(function (key) {
        options[key] = newOptions[key];
    });
}

module.exports.run = run;
module.exports.setOptions = setOptions;