var file;
function getFileName(){
    if ( $('#myfile').val().lastIndexOf('\\') ) {
        var n = $('#myfile').val().lastIndexOf('\\') + 1;
     } else {
        var n = $('#myfile').val().lastIndexOf('/') + 1;
     }
     var fileName = $('#myfile').val().slice(n);

    var exp_n = $('#myfile').val().lastIndexOf('.') + 1;
    var exp = $('#myfile').val().slice(exp_n);
    $('#my-display-filename').val('');
    if (exp!='xmi'){
        alert('Для генерации необходим файл с расширением xmi');

    } else {
        $('#my-display-filename').val(fileName);
        //file = $('#myfile').files;

        var file = $('#myfile')[0].files[0];

        file.type='xmi';
        console.log(file);
        fileLoad(file);
    }
}
function deleteFile(fileName){

    $.ajax({
        url: '/deletefile/'+fileName,
        type: 'POST',
        data: fileName,
        dataType: 'json',
        success: function( respond, textStatus, jqXHR ){
            if( typeof respond.error === 'undefined' ){
                console.log(respond);
            }
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('Ошибка запроса: ' + textStatus );
        }
    });
}
function fileLoad(file){
    var data = new FormData();
    //console.log(file);
    data.append('file', file,file.name);

    // Отправляем запрос

    $.ajax({
        url: '/',
        type: 'POST',
        data: data,
        processData: false,
        contentType: false,
        success: function( respond, textStatus, jqXHR ){
            if( typeof respond.error === 'undefined' ){
                console.log(respond);
            }
            if (respond.status==='ok'){
                var newWin=window.open('http://'+window.location.host+'/code_js/'+respond.filename);
                newWin.onload = function (){
                    var n = respond.filename.lastIndexOf('.');
                    var nameFile = respond.filename.slice(0,n);
                    deleteFile(nameFile);
                }



            }
        },
        error: function( jqXHR, textStatus, errorThrown ){
            console.log('Ошибка запроса: ' + textStatus );
        }
    });

}
var downloadURL = function downloadURL(url) {
    var hiddenIFrameID = 'hiddenDownloader',
        iframe = document.getElementById(hiddenIFrameID);
    if (iframe === null) {
        iframe = document.createElement('iframe');
        iframe.id = hiddenIFrameID;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    iframe.src = url;
};


