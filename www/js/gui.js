var GUI = {
	
	config:{},
	medias:{},
	audioPlayer:null,
	init:function(){
					$(document).on("mobileinit",function() {
							$.mobile.autoInitializePage = false;
					});
					$(document).ready(function() {
							$( "[data-role='footer']" ).toolbar({ theme: "a" });
							window.location.hash = 'home';
							$.mobile.initializePage();
							
							$.getJSON( "trevoux.config", function( data ) {
									GUI.config = data;
									console.log(GUI.config);
							});
							
							$("body").pagecontainer({
								beforetransition: function( event, ui ) {
									GUI.pageChange(event,ui);
								}
							});
							
							$(window).on("navigate", function (event, data) {
								var direction = data.state.direction;
								if (direction == 'back'){ // when the back btn is pressed
									// do something
									//console.log(data);
								}
							});
							
							// remplacer par touch end
							$("#balades-download .balades-download-btn").on("click",GUI.downloadMediaList);
							
					});
					
					
	},
	onDeviceReady:function(){
		//console.log(device.platform);
			/*window.plugins.html5Video.initialize({
					"video1" : "station2.mp4" 
			});
		
			window.plugins.html5Video.play("video1");
			*/
		/*if(device.platform == "Android"){
			console.log("ready tight");
		}*/
		
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
			function(fs) {
				GUI.fileSystem = fs;
				GUI.loadMediaConfig();
			}, 
		GUI.onFileSystemError);
	},
	loadMediaConfig:function(){
		GUI.fileSystem.root.getFile('trevouxmedias.json', {}, function(fileEntry) {
			fileEntry.file(function(file) {
					console.log(file);
					var reader = new FileReader();
					reader.onloadend = function(e) {
							//var txtArea = document.createElement('textarea');
							//txtArea.value = this.result;
							console.log('yay');
							console.log(this.result);
							GUI.medias = JSON.parse(this.result);
							//document.body.appendChild(txtArea);
							GUI.initHome();
					};
					reader.readAsText(file);
			}, GUI.onFileSystemError);
		},function(error){
			console.log("there");
			console.log(JSON.stringify(error));
			if(error.code == FileError.NOT_FOUND_ERR){// code 1
				// load default trevoux.media
				// create file
				// write file
				console.log("here");
				$.getJSON( "trevouxmedias.json", function( data ) {
					//console.log(JSON.stringify(GUI.fileSystem.root));
					GUI.medias = data;
					GUI.fileSystem.root.getFile('trevouxmedias.json', {create: true, exclusive: true}, function(fileEntry) {
						//console.log(fileEntry);
						GUI.writeMediaConfig(fileEntry,function(){
							//GUI.createMediaDirStructure();	
							GUI.initHome();
						});
						
					}, GUI.onFileSystemError);
					
				});

			}
		});
	},
	writeMediaConfig:function(fileEntry,onfinish){
		// Create a FileWriter object for our FileEntry (log.txt).
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.onwriteend = function(e) {
				console.log('trevouxmedia.json Write completed.');
				onfinish();
			};
			fileWriter.onerror = function(e) {
				console.log('Write failed: ' + e.toString());
			};
			// Create a new Blob and write it to log.txt.
			console.log("gang");
			var blob = new Blob([JSON.stringify(GUI.medias)], {type: 'text/plain'});
			fileWriter.write(blob);
		}, GUI.onFileSystemError);
		
	},
	createMediaDirStructure:function(){
		var paths = [
			'EN/CIVRIEUX/',
			'EN/PORTBERNALIN/',
			'EN/SAINTBERNARD/',
			'EN/TREVOUX/',
			'FR/CIVRIEUX/',
			'FR/PORTBERNALIN/',
			'FR/SAINTBERNARD/',
			'FR/TREVOUX/'
		];
		
		function createDir(rootDirEntry, folders) {
			console.log(folders);
		  // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
		  if (folders[0] == '.' || folders[0] == '') {
			folders = folders.slice(1);
		  }
		  rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
			// Recursively add the new subfolder (if we still have another to create).
			if (folders.length) {
			  createDir(dirEntry, folders.slice(1));
			}
		  },GUI.onFileSystemError);
		};
		for(var i=0 ; i < paths.length ; i++){
			//console.log(i);
			createDir(GUI.fileSystem.root, paths[i].split('/'));
		}
		
	},
	onFileSystemError:function(e){
		var msg = '';
	
		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				msg = 'QUOTA_EXCEEDED_ERR';
				break;
			case FileError.NOT_FOUND_ERR:
				msg = 'NOT_FOUND_ERR';
				break;
			case FileError.SECURITY_ERR:
				msg = 'SECURITY_ERR';
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				msg = 'INVALID_MODIFICATION_ERR';
				break;
			case FileError.INVALID_STATE_ERR:
				msg = 'INVALID_STATE_ERR';
				break;
			default:
				msg = 'Unknown Error';
				break;
		};
	
		console.log('Error: ' + msg);
		console.log(JSON.stringify(e));
	},
	createLocalData:function(){
		// copy trevoux.medias
		// create directory structure
	},
	initHome:function(){
		//console.log(GUI.medias);
		//console.log('ok');
		$("#home #balads-list a").each(function(index){
			//console.log(index+"  "+$(this));	
			if(GUI.medias[GUI.config.lang].balads[index].downloaded){
				//$(this).attr("href", "#balade?balad-index="+index);
				$(this).attr("href", "#balades-download?downloaded=true&balad-index="+index);
			}else{
				$(this).attr("href", "#balades-download?downloaded=false&balad-index="+index);
			}
		});
	},
	downloadMediaList:function(event){
		
		var index=parseInt(this.hash.substring(this.hash.lastIndexOf("#balad-index=")+13));
		
		console.log("download !!"+index);
		$(this).addClass("ui-disabled");
		var self = this;
		
		var etapesList = GUI.medias[GUI.config.lang].balads[index].etapes.slice(0);
		
		function syncDL(etape) 
		{
			if(etape){
				console.log("download !!!!   "+etape.filepath);
				GUI.downloadMedia(etape,function(){
					return syncDL(etapesList.shift());		
				});
			}else{
				console.log("list downloaded !!");
				GUI.medias[GUI.config.lang].balads[index].downloaded = true;
				GUI.fileSystem.root.getFile('trevouxmedias.json', {}, function(fileEntry) {
							GUI.writeMediaConfig(fileEntry,function(){
								console.log("config updated !!!!!");
								GUI.initHome();
								$("#balades-download .balades-download-btn").removeClass("ui-disabled");
								$("#balades-download .balades-download-btn").addClass('hidden');
								GUI.addBDClick(index);
							});
				}, GUI.onFileSystemError);
			}
		}
		syncDL(etapesList.shift());
		
		//penser à blocker la nav pendant le téléchargement (ou rajouter un abort si btn back)
		

		
	},
	downloadMedia:function(media,onfinish){
		var ft = new FileTransfer();
		var uri = encodeURI(GUI.config.mediasUrl+media.filepath);
		var downloadPath = cordova.file.dataDirectory + media.filepath;
		//console.log(downloadPath);
		ft.onprogress = function(progressEvent) {
			if (progressEvent.lengthComputable) {
				var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
				console.log(perc + "% loaded...");
			} else {
				console.log("Loading");
			}
		};
							
		ft.download(uri, downloadPath, 
		function(entry) {
			onfinish();
			//var media = new Media(entry.fullPath, null, function(e) { alert(JSON.stringify(e));});
			//media.play();
			
		}, 
		function(error) {
			alert('Crap something went wrong...');	
		});		
	},
	addBDClick:function(index){
		$("#balades-download-container").append('<a id="balad-btn" href="#balade?balad-index='+index+'" data-transition="slide">GO !</a>');
	},
	removeBDClick:function(){
		$("#balades-download-container #balad-btn").remove();
	},
	pageChange:function(event,ui){
		// FROM PAGE
		if(ui.prevPage !== undefined)
		switch(ui.prevPage[0].id){
			case "home":break;
			case "balades-download":
			break;
			case "balade":
			break;
			case "etape":
				GUI.audioPlayer.stop();
				GUI.audioPlayer.release();
			break;
			case "settings":break;
		}

		// TO PAGE
		//console.log(ui.toPage);
		switch(ui.toPage[0].id){
			case "home":break;
			case "balades-download":
				var baladIndex = parseInt(GetURLParameters(ui.absUrl)["balad-index"]);
				var downloaded = (GetURLParameters(ui.absUrl)["downloaded"] === 'true');
				console.log("downloaded  "+downloaded+"  "+GetURLParameters(ui.absUrl)["downloaded"]);
				if(!isNaN(baladIndex)){
					$("#balades-download .balades-title").text(GUI.config.balads[baladIndex].baladTitle);
					$("#balades-download .balades-sub-title").text(GUI.config.balads[baladIndex].baladSubtitle);
					
					$("#balades-download .balades-download-btn").attr("href", "#balad-index="+baladIndex)
					
					GUI.removeBDClick();
					if(downloaded){
						$("#balades-download .balades-download-btn").addClass('hidden');
						GUI.addBDClick(baladIndex);
					}else{
						$("#balades-download .balades-download-btn").removeClass('hidden');
					}
				}
			break;
			case "balade":
				var baladIndex = parseInt(GetURLParameters(ui.absUrl)["balad-index"]);
				if(!isNaN(baladIndex)){
					
					$("#balade #etapes-list").empty();
					
					$("#balade #balade-header .title").text(GUI.config.balads[baladIndex].baladTitle);
					$("#balade #balade-header .sub-title").text(GUI.config.balads[baladIndex].baladSubtitle);
					for(var k=0;k <= GUI.config.balads[baladIndex].etapes[GUI.config.lang].length-1;k++){
						$("#balade #etapes-list").append('<li data-icon="carat-r"><a href="#etape?balad-index='+baladIndex+'&etape-index='+k+'" data-transition="slide"><div class="etape-li-text">'+GUI.config.balads[baladIndex].etapes[GUI.config.lang][k]+'</div></a></li>');					
					}
				}				
				
				
			break;
			case "etape":
				console.log("etape");
				var baladIndex = parseInt(GetURLParameters(ui.absUrl)["balad-index"]);
				var etapeIndex = parseInt(GetURLParameters(ui.absUrl)["etape-index"]);
				/*if(device.platform != "Android"){
					console.log("not android");
					$('video')[0].src = "medias/FR/CIVRIEUX/station2.mp4";
					$('video')[0].play();
				}else{
					VideoPlayer.play("file:///android_asset/www/medias/FR/CIVRIEUX/station2.mp4",
						{
							volume: 0.5,
							scalingMode: VideoPlayer.SCALE_TO_FIT
						},
						function () {
							console.log("video completed");
						},
						function (err) {
							console.log(err);
						});
				}*/
				
				//var my_media = new Media("file:///android_asset/www/medias/FR/PORT\ BERNALIN/S1\ Ile\ Beyne.mp3",
				//var my_media = new Media("medias/FR/PORT\ BERNALIN/S1\ Ile\ Beyne.mp3",
				console.log("ok");
				window.resolveLocalFileSystemURL(cordova.file.dataDirectory+GUI.medias[GUI.config.lang].balads[baladIndex].etapes[etapeIndex].filepath,
					function(entry){
						console.log(entry);		
						GUI.audioPlayer = new Media(entry.toInternalURL(),
							// success callback
							function () {
									console.log("playAudio():Audio Success");
							},
							// error callback
							function (err) {
									console.log("playAudio():Audio Error: " + JSON.stringify(err));
							}
						);
						// Play audio
						GUI.audioPlayer.play();
					},function(err){
						console.log(JSON.stringify(err));	
					});

				
			break;
			case "settings":break;
			default:
				console.error("unknown page");
			break;
			
		}
	}
	
};


function GetURLParameters(inputString){
		if(typeof inputString === 'undefined')
			return console.error('input string undefined');
		
		var result = {};
		
		var inputArray = inputString.split('?')
		if(inputArray.length<=1){
			console.log('no parameters');
			return result;
		}else
			parameterString = inputArray[1];
		var sURLVariables = parameterString.split('&');
		
		
		for (var i = 0; i < sURLVariables.length; i++)
		{
				var parameter = sURLVariables[i].split('=');
				result[parameter[0]] = parameter[1];
		}
		
		return result;
}

GUI.init();