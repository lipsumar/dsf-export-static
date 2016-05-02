var fsExtra = require('fs-extra'),
    async = require('async'),
    path = require('path'),
    request = require('request'),
    fs = require('fs');

module.exports = function(dsf, done){
    'use strict';

    dsf.start();

    var to = dsf.util.path.absolute.bind(dsf.util.path),
        from = path.join.bind(path, dsf.dirname),
        url = function(p){
            return 'http://localhost:'+dsf.server.port + p;
        },
        log = function(m){
            return function(cb){
                dsf.log(dsf.log.chalk.green('[export-static] ') + m, true);
                if(cb){ cb(); }
            };
        },
        rm = function(p){
            return fsExtra.remove.bind(fsExtra, p);
        },
        mkdirp = function(p){
            return fsExtra.mkdirp.bind(fsExtra, p);
        },
        copy = function(f, t){
            return fsExtra.copy.bind(fsExtra, f, t);
        },
        urlToFile = function(url, file){
            return function(callback){
                request(url, function (err, response, body) {
                    fs.writeFile(file, body, callback);
                });
            };
        },

        buildComponent = function(component, callback){
            log('Render '+component.id+'...')();
            async.series([
                // create component build dir
                mkdirp(to('out/export-static/build/'+component.id)),

                // index.html
                urlToFile(url('/build/'+component.id), to('out/export-static/build/'+component.id+'/index.html')),

                // css
                urlToFile(url('/build/'+component.id+'/css'), to('out/export-static/build/'+component.id+'/css.css')),

                // js
                urlToFile(url('/build/'+component.id+'/js'), to('out/export-static/build/'+component.id+'/js')),

                // doc
                urlToFile(url('/build/'+component.id+'/doc'), to('out/export-static/build/'+component.id+'/doc')),


            ], callback);

        };

    dsf.registerCliPlugin('dsf-export-static', function(options, callback){

        require(path.join(dsf.dirname,'lib/server.js'))(dsf); // start server ourselves


        async.series([
            log('Clear out/export-static'),
            rm(to('out/export-static')),

            log('Create out directory'),
            mkdirp(to('out/export-static')),

            log('Copy static UI files'),
            copy(from('public/index.html'), to('out/export-static/index.html')),
            copy(from('public/css'), to('out/export-static/css')),

            log('Build components'),
            function(callback){
                async.eachSeries(dsf.getComponents(), buildComponent, callback);
            },

            log('Build DSF resources'),
            urlToFile(url('/components'), to('out/export-static/components')),
            urlToFile(url('/plugins'), to('out/export-static/plugins')),

            log('Done !')

        ], callback);
    });

    done();
};
