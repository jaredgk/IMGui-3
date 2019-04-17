/*global alert, $, jQuery, FileReader*/

/*IMgui 2016- Jared Knoblauch, Arun Sethuraman, and Jody Hey*/

"use strict";

var windowManager = require('electron').remote.require('electron-window-manager');
var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;

var pwd = remote.getGlobal('sharedObj').pwd.replace(/[ ]/g,'%20');
var homedir = remote.getGlobal('sharedObj').homedir.replace(/[ ]/g,'%20');
var sep = remote.getGlobal('sharedObj').sep;

//Adds error below element with erraneous value
function addError(er,el) {
    var s = '<p class="err-add" style="color:red">'+er+'</p>';
    var p = $(s);
    p.appendTo(el.parent());
}

//Removes old errors, checks that args are valid and highlights errors
//Returns args list if valid command line, nothing if invalid
function createCmdLine() {
    var fl = 0;
    var ro = {};
    var args = [];
    $('.err-add').remove();
    var cc = $('#input-file').val();
    if(cc.length !== 0) {
        if(cc[0] == '~') {
            var t = cc.replace('~',homedir);
            cc = t;
        }
        args.push('-i'+cc.replace(/[ ]/,'%20'));
    } else {
        fl = 1;
        addError('Input filename is not present', $('#input-file'));
    }
    cc = $('#output-file').val();
    if(cc.length !== 0) {
        args.push('-o'+pwd+sep+cc);
        ro.prefix = cc;
    } else {
        ro.prefix = 'im_fig_file';
        args.push('-o'+pwd+sep+'im_fig_file');
    }
    cc = $('#font-type').val();
    if(cc.length !== 0) {
        args.push('-f'+cc);
    }
    cc = $('#pop-file').val();
    if(cc.length !== 0) {
        if(cc[0] == '~') {
            var t = cc.replace('~',homedir);
            cc = t;
        }
        args.push('-n'+cc.replace(/[ ]/,'%20'));
        //Add check for file?
    }
    cc = $('#b-width').val();
    if(cc.length !== 0) {
        if(cc > 0) {
            args.push('-b'+cc);
        } else {
            fl = 1;
            addError('Box width must be greater than 0',$('#b-width'));
        }
    }
    cc = $('#g-scale').val();
    if(cc.length !== 0) {
        if(cc > 0 && cc <= 1) {
            args.push('-g'+cc);
        } else {
            fl = 1;
            addError('Scale must be in range (0,1]',$('#g-scale'));
        }
    }
    cc = $('#j-arrow').val();
    if(cc.length !== 0) {
        if(cc > 0) {
            args.push('-j'+cc);
        } else {
            fl = 1;
            addError('Arrow width must be positive',$('#h-arrow'));
        }
    }
    cc = $('#p-font').val();
    if(cc.length !== 0) {
        if(cc > 0) {
            args.push('-p'+cc);
        } else {
            fl = 1;
            addError('Font size must be positive',$('#p-font'));
        }
    }
    cc = $('#t-height').val();
    if(cc.length !== 0) {
        if(cc >= 0 && cc <= 1) {
            args.push('-t'+cc);
        } else {
            fl = 1;
            addError('Height must be in range (0,1)',$('#t-height'));
        }
    }
    cc = $('#w-width').val();
    if(cc.length !== 0) {
        if(cc >= 1) {
            args.push('-w'+cc)
        } else {
            fl = 1;
            addError('Image scale must be greater than one',$('#w-width'));
        }
    }
    cc = $('#x-width').val();
    if(cc.length !== 0) {
        if(cc > 0) {
            args.push('-x'+cc);
        } else {
            fl = 1;
            addError('Width factor must be greater than 0',$('#x-width'));
        }
    }
    cc = $('#y-height').val();
    if(cc.length !== 0) {
        if(cc > 0 && cc <= 1) {
            args.push('-y'+cc);
        } else {
            fl = 1;
            addError('Height must be in range (0,1]',$('#y-height'));
        }
    }
    //var mval = $('input[name="m-flag"]:checked').val();
    var mval = $('#arrowid option:selected').val();
    if(mval === '0') {
        args.push('-ms');
    } else if(mval === '1') {
        args.push('-mS');
    } else if(mval === '2') {
        args.push('-ma');
    } else if(mval === '3') {
        args.push('-mx');
    } else {
        if($('#m-number').val().length !== 0) {
            args.push('-m'+$('#m-number').val());
        } else {
            fl = 1;
            addError('Must provide cutoff value',$('#m-number'));
        }
    }
    if($('#a-check').is(':checked')) { args.push('-a'); }
    if($('#e-check').is(':checked')) { args.push('-e'); }
    if($('#d-check').is(':checked')) { args.push('-d'); }
    if($('#k-check').is(':checked')) { args.push('-k'); }
    if($('#q-check').is(':checked')) { args.push('-q'); }
    if($('#r-check').is(':checked')) { args.push('-r'); }
    if($('#s-check').is(':checked')) { args.push('-s'); }
    if($('#u-check').is(':checked')) { args.push('-u'); }
    if($('#v-check').is(':checked')) { args.push('-v'); }
    args.push('-cj');
    if(fl === 0) { ro.args = args; }
    return ro;
}

//Assuming args are valid, submits job to server
//If successful, img tag will have src changed to target image
//If unsuccessful, error will be displayed under run button
function submitFigRequest(cp) {
    ipcRenderer.send('imfig',{
        args: cp.args,
        prefix: cp.prefix
    });
}

$('#arrowid').change(function() {
    $('#m-div').hide();
    var idx = $('#arrowid option:selected').val();
    if (idx === '4') {
        $('#m-div').show();
    }
});

ipcRenderer.on('imfig_response',function(e,data) {
    console.log(data.fail);
    if(data.fail === 0) {
        $('#image-div').show();
        var epstext = 'The .eps file for this figure is located at '+data.path;
        $('#eps-path').text(epstext);
        $('#server_image').attr("src",data.prefix+'.jpg');
        $('#server_image').attr("height",540);
        $('#server_image').attr("width",720);
        $('#server_image').attr("style","border: 1px black solid");
        var captiontext = data.caption;
        $('#caption').text(captiontext);
    } else if (data.fail === 1) {
        addError('An error has occured: '+JSON.stringify(data.msg.replace(/\n/g,'<br>')),$('#submit-button'));
    } else {
        $('#image-div').show();
        var epstext = 'JPG was unable to be created, .eps file is located at '+data.path;
        $('#eps-path').text(epstext);
    }
});

//Verifies args are valid, and if so, sends job to server
$('#submit-button').click(function () {
    var cmdline_params = createCmdLine();
    if(cmdline_params.args.length !== 0) {
        submitFigRequest(cmdline_params);
    }
});
