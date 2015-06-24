/**
* @brief Custom Javascript functions
* @author Prahlad Yeri
* @copyright MIT License
*/

if (window.location.href.indexOf('127.0.0.1:') >=0 ) {
	window.DEBUG = true;
}
else {
	window.DEBUG  = false;
}

$(window).load(function() {
	if (!window.DEBUG) {
		if (readCookie(".mainAlert.closed") != null) {
			console.log("alert cookie already exists!");
			$(".mainAlert").hide();
		}
		else {
			$('.mainAlert').on('closed.bs.alert',  function(){
				//alert('closed');
				createCookie(".mainAlert.closed", "true", 365);
				console.log('alert cookie created');
			})
			console.log('alert event added');
		}
	}
	
	//Objects Initialization
	tables = {}; //dict of String:Table objects
	
	//EndpointHoverStyle: {color: "blue"},
	jsPlumb.importDefaults({
		Endpoint: ["Rectangle", {width:14, height:14}] ,
		Endpoints : [ [ "Rectangle" ], [ "Rectangle" ] ],
		Connector: "Bezier",
		PaintStyle: {strokeStyle: "rgba(0,0,0,100)", lineWidth:4},
		/*HoverPaintStyle: { lineWidth:4,
			strokeStyle: 'rgba(200,0,0,100)'
		}*/
	});
	
	jsPlumb.setContainer("theCanvas");
	console.log('jsPlumb.getContainer():', jsPlumb.getContainer());
	
	//check local storage, if any build the tables.
	$("#holder").load("assets/partials/addTableDialog.html?time=" + (new Date()).getTime(), function(){
		//runAddTableDialog(tableName, "add");
	});
	
	
	loadCanvasState();
	//if (localStorage.tables) {
		//console.log("LOCAL_STORAGE found!");
		//tables = localStorage.tables;
	//}

	
/*	if (Object.keys(tables).length==0 && window.DEBUG) {
		//create a dummy table for testing
		for (i=1;i<=2;i++) {
			table = new Table("product" + i);
			table.fields['id'] = new Field({name: 'id', type: 'Integer', size: 0, primaryKey: true, defaultValue: 1});
			table.fields['name'] = new Field({name: 'name', type: 'Text', size: 255, unique: true, defaultValue: 'foo'});
			tables['product' + i] = table;
			createThePanel(table, 'add');
		}
	}*/
	
});

//jsPlumb events

jsPlumb.bind("beforeDrop", function(info) {
	var pkey = $(info.connection.source).attr('ffname').split(".");
	var fkey = $(info.connection.target).attr('ffname').split(".");
	console.log('BEFORE_DROP', pkey, fkey);
	if (pkey[0] == fkey[0]) {
		alert("Source and Target table cannot be the same");
		return false;
	}
	//console.log(pkey, fkey);
	tables[pkey[0]].fields[pkey[1]].foreign = fkey[0] + '.' + fkey[1];
	tables[fkey[0]].fields[fkey[1]].ref = pkey[0] + '.' + pkey[1];
	bsalert({text: pkey[1] + '->' + fkey[1], title:"Established: "});
	//window.tobj = info;
	return true; //return false or just quit to drop the new connection.
});

/*jsPlumb.bind("connection", function(info) {
	//console.log(info);
	//window.tobj = info;
});*/

jsPlumb.bind("connectionDetached", function(info, originalEvent) {
	console.log(info.source, info.target);
	//return;
	if ($(info.source).attr('ffname') == undefined || $(info.target).attr('ffname')==undefined)
		return;
	var pkey = $(info.source).attr('ffname').split(".");
	var fkey = $(info.target).attr('ffname').split(".");
	console.log('DETACHED', pkey, fkey);
	tables[pkey[0]].fields[pkey[1]].foreign = null;
	tables[fkey[0]].fields[fkey[1]].ref = null;
	bsalert({text: pkey[1] + '><' + fkey[1], title:"Detached: "});
	//window.tobj = info;
})


//Other misc functions

/**
* @brief: Creates a new panel from scratch for a table
* @param mode Should be 'add' or 'edit'
*/
function createThePanel(table, mode) {
	if (mode == "add") {
		$.get("assets/partials/table.html?time=" + (new Date()).getTime(), function(data) {
			$('.canvas').append(data.format(table.name));
			setThePanel(table, mode);
		});
	}
	else {
		setThePanel(table, mode);
	}
}

function setThePanel(table, mode) {
		if (mode=='edit') {
			/*jsPlumb.detachAllConnections($('#tbl' + table.name + " .table"));
			$.each(window.oldTable.fields, function(k,v) {
				console.log(v.ep);
				jsPlumb.deleteEndpoint(v.ep);
				console.log('deleted ep for',v.name);
			});*/
			
			//jsPlumb.deleteEveryEndpoint();
			//jsPlumb.removeAllEndpoints($('#tbl' + table.name + " .table"));
			//jsPlumb.remove($('#tbl' + table.name + " .table tr"));
			//jsPlumb.removeAL

			//jsPlumb.empty($('#tbl' + table.name + " .table tbody"));
			/*while ($('#tbl' + table.name +  ' .table tr').length>0) 
			{
				jsPlumb.deleteEndpoint($('#tbl' + table.name +  ' .table tr'));
			}*/
			$('#tbl' + table.name + " .table tr").remove();
			
			//jsPlumb.repaintEverything();
		}
		
		//Now lets build the new panel
		$.each(table.fields, function(key, field) {
			var html = '';
			var sprim = "";
			if (field.primaryKey) {
				//sprim+= " style='cursor:move' ";
			}
			html += "<tr>";
			//if (mode=='add') 
			html += "<td>" + (field.primaryKey ? '' : "<div ffname='" + table.name + "." + field.name +  "' class='field'></div>") + "</td>"; //virtual
			
			html += "<td>" + field.name + "</td>";
			html += "<td>" + field.type + (field.size>0 ? '(' + field.size + ')' : '') + "</td>";
			html += "<td>" + (field.primaryKey ? 'primary' : '') + (field.unique ? 'unique' : '') + "</td>";
			//if (mode=='add') 
			
			html += "<td>" + (field.primaryKey ? "<div ffname='"  + table.name + "." + field.name +   "' class='prima'></div>" : '') + "</td>"; //virtual
			html += "</tr>";
			//
			$('#tbl' + table.name + " .table").append(html);
			//
			var ep;
			if (field.primaryKey) {
				//jsPlumb.addEndpoint($('#tbl' + table.name + " div.prima"), {
				ep = jsPlumb.addEndpoint($('#tbl' + table.name + " [ffname='" + table.name + "." +  field.name + "']"), {
					isSource: true,
					paintStyle: {fillStyle:"red", outlineColor:"black", outlineWidth:1 },
					//connectorPaintStyle:{ strokeStyle:"blue", lineWidth:10 },
					connectorOverlays: [ 
						[ "Arrow", { width:10, length:15, location:1, id:"arrow" } ],
						//[ "Label", { label:"Relationship", id:"lblPrimary_" + table.name } ]
						],
				});
			}
			else {
				//jsPlumb.addEndpoint($('#tbl' + table.name + " div.field"), {isTarget: true,
				ep = jsPlumb.addEndpoint($('#tbl' + table.name + " [ffname='" + table.name + "." +  field.name + "']"), {
						isTarget: true,
						paintStyle: { fillStyle:"green", outlineColor:"black", outlineWidth:1 },
					});
					jsPlumb.draggable('tbl' + table.name, {
					   containment:true
					});
			}
			//field.ep  = ep; //TODO: [inprogress]This may no longer be required since we are not using ep anywhere.
			//
			//console.log('added field', field.name);
		});
		
		//jsPlumb.draggable($('#tbl' + table.name + " tr.prima"),{}); //containment:true
		console.log('#tbl' + table.name + " td.prima",'#tbl' + table.name + " td:not(.prima)");
		 //if (mode=='add') 
		//if (mode=='add') 
		
		//TODO: [STABLE]Rebuild connections to/from this table by looping thru tables collection.
		if (mode=='edit') {
			$.each(window.oldrefs, function(key, val) {
				console.log('rebuilding ',key,val);
				if (val.foreign != null) {
					//check outgoing
					console.log('primary key found:',key, val.foreign);
					table.fields[key].foreign = val.foreign; //restore the lost foreign
					tsa = val.foreign.split('.');
					tables[tsa[0]].fields[tsa[1]].ref = table.name + '.' + key; //restore the lost ref
					elist1 = jsPlumb.selectEndpoints({target:$("#tbl" + tsa[0] +  " div[ffname='" + tsa[0] + "." + tsa[1] +  "']")});
					elist2 = jsPlumb.selectEndpoints({source:$("#tbl" + table.name +  " div[ffname='" + table.name + "." + key +  "']")});
					//console.log(elist1.length, elist2.length);
					var el1 = null;
					var el2 = null;
					elist1.each(function(key){el1=key});
					elist2.each(function(key){el2=key});
					jsPlumb.connect({target:el1, source:el2});
				}
				else if (val.ref != null) {
					//check incoming
					console.log('foreign key found:',key, val.ref);
					table.fields[key].ref = val.ref; //restore the lost ref
					tsa = val.ref.split('.');
					tables[tsa[0]].fields[tsa[1]].foreign = table.name + '.' + key; //restore the lost foreign
					
					elist1 = jsPlumb.selectEndpoints({source:$("#tbl" + tsa[0] +  " div[ffname='" + tsa[0] + "." + tsa[1] +  "']")});
					elist2 = jsPlumb.selectEndpoints({target:$("#tbl" + table.name +  " div[ffname='" + table.name + "." + key +  "']")});
					//console.log(elist1.length, elist2.length);
					var el1 = null;
					var el2 = null;
					elist1.each(function(key){el1=key});
					elist2.each(function(key){el2=key});
					jsPlumb.connect({source:el1, target:el2});
				}
			});
		}
		
		if (mode=='add') {
			if (window.lastPos == undefined) {
				window.lastPos = {'x':0, 'y':0};
			}

			$('#tbl' + table.name).css({ 
				'left': window.lastPos.x + "px",
				'top': window.lastPos.y + "px"
			});
			
			if (window.lastPos.x >= $('.container').offset().left + $('.container').offset().width) {
				window.lastPos.x = 0;
			}
			else {
				window.lastPos.x += $('#tbl' + table.name).width() + 20;
			}
			window.lastPos.y += $('#tbl' + table.name).position().top;
			
			jsPlumb.repaintEverything();
			bsalert({text:"Table added!", type:'success'});
		}
		else 
		{
			//EDIT
			$.each(tables, function(k,v) {
				//jsPlumb.repaint(['tbl' + k]);
				//jsPlumb.draggable('tbl' + k);
				//console.log('repainted div ' + 'tbl' + k);
			});
			//jsPlumb.repaintEverything(); //all connections
			//console.log('repainted all connections');
			bsalert({text:"Table updated!", type:'success'});
		}
		
		saveCanvasState(); 
		//jsPlumb.addEndpoint($('#tbl' + table.name), {  });
		//jsPlumb.setContainer('theCanvas');
		//console.log(
		//);
		//jsPlumb.repaint('#theCanvas');
		//console.log('repaint done');
		//console.log('made draggable ;' + 'tbl' + table.name);
		//jsPlumb.addEndpoint('tbl' + table.name, {  });
}


/*function drag(ev){
	var ss  = (parseInt($(ev.target.parentNode).position().left,10) - ev.clientX) + ',' + (parseInt($(ev.target.parentNode).position().top,10) - ev.clientY);
	ev.dataTransfer.setData("text/plain", ss + ',' + $(ev.target.parentNode).attr('id'));
	//ev.dataTransfer.setDragImage(document.getElementById("draggit"), 10, 10); //NOT WORKING
}

function drop(ev) {
	var offset = ev.dataTransfer.getData("text/plain");
	var npos = offset.split(",");
	var ctrl = npos[2];
	document.getElementById(ctrl).style.left = (ev.clientX + parseInt(npos[0])) + "px";
	document.getElementById(ctrl).style.top = (ev.clientY + parseInt(npos[1])) + "px";
	console.log(ctrl);
	ev.preventDefault();
	return false;
}

function dragOver(ev) {
	ev.preventDefault();
	return false;
}*/

/**
* @brief Save current canvas state to local store
*/

function saveCanvasState() {
	if (window.localStorage) {
		console.log('saveCanvasState: LOCALSTORAGE found, saving tables!', tables);
		window.localStorage.setItem("strTables", JSON.stringify(tables));
	}
}

function loadCanvasState() {
	//var tables  = new Object();
	if (window.localStorage) {
		console.log('loadCanvasState: LOCALSTORAGE found!');
		console.log("Loading tables");
		if (localStorage.getItem("strTables") != null) {
			ttables = JSON.parse(localStorage.getItem("strTables"));
			//
			$.each(ttables, function(k,v) {
				console.log('PROCESSING: ' + k);
				tables[k] = new Table(v.name);
				tables[k].fields = {};
				$.each(v.fields, function(kk,vv) {
					tables[k].fields[kk] = new Field(vv);
				});
			});
		}
	}
	
	$.each(tables, function(k,v){
		createThePanel(v, 'add');
	});
}

function generateCode(dbname) {
	var code = 
"import sqlalchemy\n\
from sqlalchemy import create_engine\n\
from sqlalchemy.ext.declarative import declarative_base\n\
from sqlalchemy import Column, Integer, Date, String, Text, Float, ForeignKey\n\
from sqlalchemy.orm import sessionmaker, relationship, backref\n\n\
Base = declarative_base()\n\n";
	$.each(tables, function(key, val) {
		//console.log(val.name);
		code += "class " + val.name + "(Base):\n";
		code += "\t" + "__tablename__ = \"" + val.name + "\"\n";
		$.each(val.fields, function(fkey, fval){
			//embed quotes if they don't already exist
			if (fval.type=='Text' || fval.type=='String') {
				var sdef = fval.defaultValue;
				if (sdef.indexOf('"') !=0) fval.defaultValue = '"' + sdef;
				if (sdef.lastIndexOf('"') != sdef.length-1 || sdef.lastIndexOf('"')==-1) fval.defaultValue += '"';
			}
			code += "\t" + fval.name + " = Column(" + fval.type + (fval.size==0 ? '' : '(' + fval.size + ')')   
			+ (fval.primaryKey ? ", primary_key=True" : "")
			+ (fval.ref != null ? ", ForeignKey(" + fval.ref + ")" : "")
			+ (fval.unique ? ", unique=True" : "")
			+ (fval.defaultValue!=null ? ", default=" + fval.defaultValue : "")
			+ ")\n";
		});
		code += "\n\n";
	});
	//alert(code);
	//console.log(code);
	
	code += 
"if __name__ == '__main__':\n\
\tprint('running sqlalchemy ' + sqlalchemy.__version__)\n\
\tengine = create_engine(r'sqlite:///" + dbname + ".db', echo=True) #connect to database\n\
\tBase.metadata.create_all(engine) #Lets create the actual sqlite database and schema!\n\
\tprint('database created: " + dbname  + ".db')";

/*\t\n\
\tSession = sessionmaker(bind=engine) #create a session class. (alternatively, Session.configure(bind=engine)\n\
\tsession = Session() #lets create an object of this Session() class\n\
\t#ed = Student(name='Ed Jones', email='edjones@yahoo.com') #lets add some data!\n\
\t#ed = Student(name='Harry Potter', email='harrypotter@yahoo.com') #lets add some data!\n\
\t#session.add(ed)\n\
\t#session.commit()"*/
	
	return code;
}

function showResultsDialog() {
	if (!window.DEBUG && Object.keys(tables).length==0) {
		alert("There should be at least one table");
		return;
	}
	
	if ($("#resultsDialog").length==0) {
		console.log('not found in cache');
		$("#holderResults").load("assets/partials/resultsDialog.html?time=" + (new Date()).getTime(), function(){
			$('#resultsDialog').on('shown.bs.modal', function(e) {
				//console.log('just highlighted');
				//SyntaxHighlighter.highlight();
				//SyntaxHighlighter.all('pre');
				prettyPrint();
			});
			//SyntaxHighlighter.highlight();

			runResultsDialog();
		});
	}
	else {
			console.log('found in cache');
			runResultsDialog();
	}
}

function runResultsDialog() {
	dbname = 'sql00' + parseInt(Math.random() * 4000 + 9999);
	var code = generateCode(dbname);
	//remove all child elements of #theCode
	$("#resultsDialog #theCode").empty();
	//add a pre tag
	//$("#resultsDialog #theCode").append('<pre class="brush:python"></pre>');
	$("#resultsDialog #theCode").append('<pre class="prettyprint"></pre>');
	//<script src="https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js"></script>
	//prettyPrint();

	//set code
	$("#resultsDialog #theCode pre").text(code);
  	  //
	//syntax highlight
	//SyntaxHighlighter.defaults['gutter'] = false;
	//SyntaxHighlighter.defaults['smart-tabs'] = false;	
	//SyntaxHighlighter.highlight('pre');
	//console.log('code' + code);
	//$("#resultsDialog #theCode").text("def index():\n\n    print 'foo'");
	$("#resultsDialog").modal();
}


function showAddTableDialog() {
	console.log("showAddTableDialog()");
	var tableName  = window.prompt("Enter table name:", tableName);
	if (tableName==null || tableName.trim() == '') {
		alert("Not a valid table name.");
		return;
	}
	else if (tableName.indexOf(" ")>=0) {
		alert("Special chars are not allowed in the table name.");
		return;
	}
	else if (tables[tableName] != undefined) {
		alert('This table already exists.');
		return;
	}
	else {
		tableName = escape(tableName);
	}
	if ($("#addTableDialog").length==0) {
		$("#holder").load("assets/partials/addTableDialog.html?time=" + (new Date()).getTime(), function(){
			runAddTableDialog(tableName, "add");
		});
	}
	else {
			runAddTableDialog(tableName, "add");
	}
}

function runAddTableDialog(tableName, mode) 
{
	$("#addTableDialog #tableName").text(tableName);
	$("#addTableDialog #editMode").val(mode);
	$("#addTableDialog .fieldRow").remove();
	if (mode=='edit') {
		$.each(tables[tableName].fields, function(key, val){
			console.log(tableName);
			console.log(val.name);
			$("#fieldName").val(val.name);
			$("#fieldType").val(val.type);
			$("#fieldSize").val(val.size);
			$("#fieldDefault").val(val.defaultValue);
			if (val.primaryKey) {
				console.log(val.name, 'primary');
				//$("#fieldPrimary").attr("checked", "checked"); //MAGIC: Somehow prop() is working but attr() is not: Chrome 41.0 windows.
				$("#fieldPrimary").prop("checked", true);
			}
			else {
				$("#fieldPrimary").prop("checked", false);
			}
			if (val.unique) {
				console.log(val.name, 'unique');
				//$("#fieldUnique").attr("checked", "checked");
				$("#fieldUnique").prop("checked", true);
			}
			else {
				//$("#fieldUnique").removeAttr("checked");
				$("#fieldUnique").prop("checked", false);
			}
			
			addField(); //inside the addTableDialog.html
		});
	}
	//TODO: [LATER]This routine should be written each time before showing a bootstrap modal:
	$(".modal").on('shown.bs.modal', function() {
		//console.log('.modal:shown');
		$(this).find("[autofocus]:first").focus();
	});
	
	$("#addTableDialog").modal();
}


function editTable(tableName) {
	runAddTableDialog(tableName, "edit");
}

function deleteTable(tableName) {
	if (confirm("Sure you want to delete this table along with all it's relations?")) {
		//TODO: [NOT-REQUIRED]Check relations of this table
		delete tables[tableName];
		//$("#tbl" + tableName).remove();
		jsPlumb.empty("tbl" + tableName);
		//jsPlumb.repaintEverything();
	}
}

//console.log('DEFINED_ImportCanvas');
function importCanvas() {
	console.log('IMPORT_CANVAS');
	var file = $('#inputCanvasFile')[0].files[0];
	//console.log(file);
	fr = new FileReader();
	fr.readAsText(file);
	fr.onload = function(ev){
		console.log(ev.target.result);
	}
	fr.onerror = function (ev) {
        console.log("error reading file");
    }
	//console.log(fr.result);
};

function exportCanvas() {
	downloadSomeText('foo bar', 'foobar.txt');
}

/* START UTILITY/CORE FUNCTIONS */

function downloadSomeText(text, filename) {
	var content = text;
	var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
	var a = document.createElement('a');
	
	if (a.click != undefined) {
		//method-3
		a.href = uriContent;
		a.download  = filename;
		a.click();
	}
	else {
		//method-2
		location.href= uriContent;
	}
	
	//method-1
	//window.open(uriContent, "somefile.txt");
}

//depends on bootstrap
function bsalert(obj) {
	//initial config:
	cont = $('.header'); //container
	delay = 2000; //millis
	theWidth = "300px";
	
	//text, type, title
	text = obj.text;
	type = obj.type;
	title = obj.title;
	if (obj.delay!=undefined) delay = obj.delay;
	
	if (type==undefined) type='info';
	
	if ($('#bsalertPlugin').length==0) 
	{
		html = '<div id="bsalertPlugin" style="z-index:2000;position:absolute;right:0;top:0;width:' + theWidth + ';" class="alert alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><strong class="bsaTitle"></strong>&nbsp;<span class="bsaBody"></span></div>';
		$('body').append(html);
		//$('#bsalertPlugin').css( {'top': $('.header').css('height'), "left": $('.header').offset().left + $('.header').width() } );
		//} );
	}
	else {
	
	}

	tval = cont.height();
	lval = cont.offset().left + parseInt(cont.css('width')); //cont.width();
	lval -= parseInt($('#bsalertPlugin').css('width'));
	
	$('#bsalertPlugin').css( {'top': tval, 'left': lval} );
		
	$('#bsalertPlugin').addClass('alert-' + type);
	$('#bsalertPlugin .bsaBody').text(text);
	$('#bsalertPlugin .bsaTitle').text(title);
	//$('#bsalertPlugin').removeClass('hidden');
	//$('#bsalertPlugin').addClass('in');
	//var ba = $('#bsalertPlugin').alert();
	//window.setTimeout(function() { ba.alert('close') }, delay);
	if (delay==0) {
		$('#bsalertPlugin').alert();
	}
	else {
		$('#bsalertPlugin').alert().hide().fadeIn(500).delay(delay).fadeOut(1000, function() {
			$(this).alert('close');
		});
	}
}


// source: http://stackoverflow.com/a/18405800/849365
// example: "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

if (!String.prototype.capitalize) {
	String.prototype.capitalize =  function() { 
		return this.replace(/^./, function(match){return match.toUpperCase()} );
	}
}

COOKIE_ENCODER = '{|}~';
function createCookie(name, value, days) 
{
	value = value.replace(';', COOKIE_ENCODER);
	
    if (days>=0) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";


    document.cookie = name + "=" + value + expires; // + "; path=/";
}

function readCookie(name) 
{
	//name = name.replace(';',COOKIE_ENCODER);
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
        {
        	s = c.substring(nameEQ.length, c.length);
        	s = s.replace(COOKIE_ENCODER,';');
        	return s;
        }
    }
    return null;
}

function eraseCookie(name) 
{
    createCookie(name, "", -1);
}

/*END UTILITY FUNCTIONS*/