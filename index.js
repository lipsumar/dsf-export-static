var fsExtra = require('fs-extra'),
    async = require('async'),
    path = require('path'),
    request = require('request'),
    fs = require('fs');

module.exports = function(dsf, done){
    'use strict';

    var options = {};

    // Register a custom type to define a custom rendering of html
    dsf.registerResourceType('export-static-html', function(component, callback){

        var doc = dsf.createPreviewDocument();
        doc.addComponent(component);
        doc.render({}, function(err, html){
            if(err){
                throw err;
            }

            if(options.basehref){
                html = html
                    // add base href
                    .split('<head>').join('<head>\n\t<base href="'+options.basehref+'">\n')

                    // make "root urls" relatives
                    .split('href="/').join('href="')
                    .split('src="/').join('src="');
            }


            callback(err, html);
        });

    });


    ///@TODO find quickly a way to do this in a cleaner way. Maybe at the same time as registerResourceType
    dsf.getDefaultConfig().glob['export-static-html'] = dsf.getConfig().glob.html;
    dsf.getConfig().glob['export-static-html'] = dsf.getConfig().glob.html;
    console.log(dsf.getConfig().glob);


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
                    if(err){
                        throw err;
                    }
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
                urlToFile(url('/build/'+component.id+'/export-static-html'), to('out/export-static/build/'+component.id+'/index.html')),

                // css
                urlToFile(url('/build/'+component.id+'/css'), to('out/export-static/build/'+component.id+'/css.css')),

                // js
                urlToFile(url('/build/'+component.id+'/js'), to('out/export-static/build/'+component.id+'/js.js')),

                // doc
                urlToFile(url('/build/'+component.id+'/doc'), to('out/export-static/build/'+component.id+'/doc')),


            ], callback);

        };

    var cliOpts = [
        {
            name: 'basehref',
            type: String
        }
    ];
    dsf.registerCliPlugin('dsf-export-static', cliOpts, function(opts, callback){
        options = opts;

         // start server ourselves
        require(path.join(dsf.dirname,'lib/server.js'))(dsf, function(){

            async.series([
                log('Clear out/export-static'),
                rm(to('out/export-static')),

                log('Create out directory'),
                mkdirp(to('out/export-static')),

                log('Copy UI document'),
                urlToFile(url('/build/_plugin/ui/export-static-html'), to('out/export-static/index.html')),

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


    });

    done();
};
