var express = require('express');
var app = express();
var server = require('http').createServer(app);
//var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('Server listening at port %d', port);
});
var fs = require('fs'),
    xml2js = require('xml2js');

var parser = new xml2js.Parser();
var xpath = require("xml2js-xpath");

fs.readFile(__dirname + '/xmi/Users.xmi', function(err, data) {
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
        fs.writeFile('Clases.js', generatedStr, (err) => {
            if (err) throw err;
        console.log('It\'s saved!');
    });
    });
});
