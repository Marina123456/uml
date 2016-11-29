var express = require('express');
var app = express();
var server = require('http').createServer(app);
//var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});
app.use(express.static('public'));

var fs = require('fs'),
    xml2js = require('xml2js'),
    multiparty = require('multiparty'),
    crypto = require('crypto');

app.post('/deletefile/:name', function(req, res, next) {
    fs.unlink('public/code_js/'+req.params.name+'.js', (err) => {
        if (err) {res.send({status: 'bad', text: 'Error'}); throw err;}
    console.log('successfully deleted /tmp/hello');
    res.send({status: 'ok', text: 'Success'});
    });
});
app.get('/', function(req, res, next) {

}
app.post('/', function(req, res, next) {
    // создаем форму
    var form = new multiparty.Form();
    //здесь будет храниться путь с загружаемому файлу, его тип и размер
    var uploadFile = {uploadPath: '', type: '', size: 0};
    //максимальный размер файла
    var maxSize = 5 * 1024 * 1024; //5MB

    //массив с ошибками произошедшими в ходе загрузки файла
    var errors = [];

    //если произошла ошибка
    form.on('error', function (err) {
        if (fs.existsSync(uploadFile.path)) {
            //если загружаемый файл существует удаляем его
            fs.unlinkSync(uploadFile.path);
            console.log('error');
        }
    });

    form.on('close', function() {
        //если нет ошибок и все хорошо
        var filename=getRandom(1000000,10000000);

        generation_JS(uploadFile.path,filename);

        if(errors.length == 0) {
            //сообщаем что все хорошо
            res.send({status: 'ok', text: 'Success',filename: filename+'.js'});
        }

        else {
            if(fs.existsSync(uploadFile.path)) {
                //если загружаемый файл существует удаляем его
                fs.unlinkSync(uploadFile.path);
            }
            //сообщаем что все плохо и какие произошли ошибки
            res.send({status: 'bad', errors: errors});
        }
    });

    // при поступление файла
    form.on('part', function(part) {
        //читаем его размер в байтах

        uploadFile.size = part.byteCount;
        //читаем его тип
        uploadFile.type = part.headers['content-type'];
        //путь для сохранения файла
        uploadFile.path = __dirname+'\\private_xmi\\' + part.filename;

        //проверяем размер файла, он не должен быть больше максимального размера
        if(uploadFile.size > maxSize) {
            errors.push('File size is ' + uploadFile.size + '. Limit is' + (maxSize / 1024 / 1024) + 'MB.');
        }
        console.log(uploadFile);
        //проверяем является ли тип поддерживаемым
        var exp_n = part.filename.lastIndexOf('.') + 1;
        var exp = part.filename.slice(exp_n);
        if(exp != 'xmi') {
           errors.push('Not xmi!');
        }

        //если нет ошибок то создаем поток для записи файла
        if(errors.length == 0) {
            var out = fs.createWriteStream(uploadFile.path);
            part.pipe(out);
        }
        else {
            //пропускаем
            //вообще здесь нужно как-то остановить загрузку и перейти к onclose
            part.resume();
        }
    });

    // парсим форму
    form.parse(req);

});

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var parser = new xml2js.Parser();
var xpath = require("xml2js-xpath");


function generation_JS(fileUML,fileJS){
    fs.readFile(fileUML, function(err, data) {
        parser.parseString(data, function (err, result) {
            var xmiContent=result.XMI['XMI.content'];
            var umlModel=xmiContent[0]['UML:Model'][0]['UML:Namespace.ownedElement'][0]['UML:Model'][0]['UML:Namespace.ownedElement'];
            var arrClass=umlModel[0]['UML:Class'];
            var arrGenerals=umlModel[0]['UML:Generalization'];
            var generatedStr="'use strinct';\n";
             for (var i=0;i<arrClass.length;i++){
                var paramClass=arrClass[i]['$'];
                var nameClass=paramClass['name'];//имя класса из xmi файла

                var parentClass='';//есть ли родитель

                var isExistGeneral=arrClass[i]['UML:GeneralizableElement.generalization'];
                if (isExistGeneral){//существует наследование
                    var relationInfo=isExistGeneral[0]['UML:Generalization'][0]['$'];
                    var hrefRelation=relationInfo['xmi.idref'];

                    for (var rel=0; rel<arrGenerals.length; rel++){
                        var idGeneral=arrGenerals[rel]['$']['xmi.id'];
                        var idParentGeneral=arrGenerals[rel]['$']['parent'];
                        if (idGeneral==hrefRelation){

                            for(var pc=0; pc<arrClass.length; pc++){
                                var idClass=arrClass[pc]['$']['xmi.id'];

                                if (idClass==idParentGeneral)
                                    parentClass=arrClass[pc]['$']['name'];
                            }
                        }
                    }
                }

                parentClass=='' ?  generatedStr+="class "+nameClass+" {\n" : generatedStr+="class "+nameClass+" extends "+parentClass+" {\n"

                var arrAttribute=arrClass[i]['UML:Classifier.feature'][0]['UML:Attribute'];
                var constructorStrHead='\tconstructor(';
                var constructorStrBody='';

                for (var j=0;j<arrAttribute.length;j++){
                    var attributeName=arrAttribute[j]['$']['name'];
                    j!=arrAttribute.length-1 ? constructorStrHead+=attributeName+',' : constructorStrHead+=attributeName;
                    constructorStrBody+="\t\tthis."+attributeName+"="+attributeName+";\n";
                }

                parentClass=='' ?  generatedStr+=constructorStrHead+'){\n'+constructorStrBody+'\t}\n'
                    : generatedStr+=constructorStrHead+'){\n\t\tsuper();\n'+constructorStrBody+'\t}\n';

                generatedStr+="}\n";


            }
            fs.writeFile('public/code_js/'+fileJS+'.js', generatedStr, (err) => {
                if (err) throw err;
            console.log('It\'s saved!');
        });
        });
    });
}

