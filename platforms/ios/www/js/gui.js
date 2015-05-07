var GUI = {
	
	config:{},
	medias:{},
	nowPlaying:"none",
	audioPlayer:null,
	androidVideoFilePath:null,
	etapesDLList:[],
	currentFileTransfert:null,
	init:function(){
					$(document).on("mobileinit",function() {
							$.mobile.autoInitializePage = false;
					});
					$(document).ready(function() {
							
							// for faster click on ios
							FastClick.attach(document.body);
							
							$( "[data-role='footer']" ).toolbar({ theme: "a" });
							window.location.hash = 'splash2';
							$.mobile.initializePage();
							
							$.getJSON( "trevoux.config", function( data ) {
									GUI.config = data;
									//console.log(GUI.config);
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
									//console.log("back");
								}
							});
							
							AudioInterface.init();
							
							// remplacer par touch end
							$("#balades-download .balades-download-btn").on("click",GUI.downloadBtnClick);
							
							$("#lng-select-fr").on("click",function(event){
								GUI.config.lang = "fr";
								$("body").pagecontainer("change","#home");
								$("#nav-foot").show();
							});
							$("#lng-select-en").on("click",function(event){
								GUI.config.lang = "en";
								$("body").pagecontainer("change","#home");
								$("#nav-foot").show();
							});
							
							$("#android-video-btn").on("click",GUI.onAndroidVideoBtn);
							
							$("#nf-back-btn").on("click",GUI.onBackButton);
							$("#nf-home-btn").on("click",GUI.onHomeButton);
							$("#nf-settings-btn").on("click",GUI.onSettingsButton);
							
							$(".settings-btn").on("click",GUI.onSettingsAction);
							
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
		
		//navigator.splashscreen.show();
		
		document.addEventListener("backbutton", GUI.onHardBackButton, false);
		document.addEventListener("pause", GUI.onAppPause, false);
		
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
			function(fs) {
				GUI.fileSystem = fs;
				GUI.loadMediaConfig();
			}, 
		GUI.onFileSystemError);
		
		
		// splash 2 timeout
		setTimeout(function(){
			$("body").pagecontainer("change","#lng-select");
		},3000);
		
	},
	loadMediaConfig:function(){
		GUI.fileSystem.root.getFile('trevouxmedias.json', {}, function(fileEntry) {
			fileEntry.file(function(file) {
					//console.log(file);
					//console.log('yay');
					var reader = new FileReader();
					reader.onloadend = function(e) {
							//var txtArea = document.createElement('textarea');
							//txtArea.value = this.result;
							//console.log(this.result);
							GUI.medias = JSON.parse(this.result);
							//document.body.appendChild(txtArea);
							//GUI.initHome();
					};
					reader.readAsText(file);
			}, GUI.onFileSystemError);
		},function(error){
			//console.log("there");
			//console.log(JSON.stringify(error));
			if(error.code == FileError.NOT_FOUND_ERR){// code 1
				// load default trevoux.media
				// create file
				// write file
				//console.log("here");
				$.getJSON( "trevouxmedias.json", function( data ) {
					//console.log(JSON.stringify(GUI.fileSystem.root));
					GUI.medias = data;
					GUI.fileSystem.root.getFile('trevouxmedias.json', {create: true, exclusive: true}, function(fileEntry) {
						//console.log(fileEntry);
						GUI.writeMediaConfig(fileEntry,function(){
							//GUI.createMediaDirStructure();	
							//GUI.initHome();
						});
						
					}, GUI.onFileSystemError);
					
				});

			}
		});
	},
	writeMediaConfig:function(fileEntry,onfinish){
		// Create a FileWriter object for our FileEntry
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.onwriteend = function(e) {
				console.log('trevouxmedia.json Write completed.');
				onfinish();
			};
			fileWriter.onerror = function(e) {
				console.log('Write failed: ' + e.toString());
			};
			// Create a new Blob and write it to log.txt.
			//console.log("gang");
			
			/* patch for Blob incompatible webviews *******************/
			try{
				var blob = new Blob([JSON.stringify(GUI.medias)], {type: 'text/plain'});
			}
			catch(e){
				window.BlobBuilder = window.BlobBuilder || 
							 window.WebKitBlobBuilder || 
							 window.MozBlobBuilder || 
							 window.MSBlobBuilder;
				
				if(window.BlobBuilder){
					var bb = new BlobBuilder();
					bb.append([JSON.stringify(GUI.medias)]);
					var blob = bb.getBlob("text/plain");
				}else{
					throw "No Blob or BlobBuilder constructor.";
				}
			}
			
			fileWriter.write(blob);
			
			/************************************************/
			//var blob = new Blob([JSON.stringify(GUI.medias)], {type: 'text/plain'});
			//fileWriter.write(blob);
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
			//console.log(folders);
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
		$("#home #balads-list a").each(function(index){
			if(GUI.medias[GUI.config.lang].balads[index].downloaded){
				$(this).attr("href", "#balades-download?downloaded=true&balad-index="+index);
			}else{
				$(this).attr("href", "#balades-download?downloaded=false&balad-index="+index);
			}
		});
	},
	downloadBtnClick:function(event){
		var index=parseInt(this.hash.substring(this.hash.lastIndexOf("#balad-index=")+13));
		$(this).addClass("hidden");
		$("#balades-download .spinner").removeClass("hidden");
		$("#balades-download .dl-progress").removeClass("hidden");
		$("#balades-download .dl-progress").text(0);
		GUI.downloadMediaList(index,function(){
			$("#balades-download .spinner").addClass('hidden');
			$("#balades-download .dl-progress").addClass('hidden');
			GUI.addBDClick(index);
		});
	},
	downloadMediaList:function(index,callback){
		
		
		
		//console.log("download !!"+index);
		//$(this).addClass("hidden");
		//$("#balades-download .spinner").removeClass("hidden");
		//$("#balades-download .dl-progress").removeClass("hidden");
		//$("#balades-download .dl-progress").text(0);
		//var self = this;
		
		GUI.etapesDLList = GUI.medias[GUI.config.lang].balads[index].etapes.slice(0);
		var etapesnbr = GUI.etapesDLList.length;
		
		function syncDL(etape) 
		{
			if(etape){
				//console.log("download !!!!   "+etape.filepath);
				GUI.downloadMedia(etape,(etapesnbr - GUI.etapesDLList.length -1),etapesnbr,function(){
					return syncDL(GUI.etapesDLList.shift());		
				});
			}else{
				//console.log("list downloaded !!");
				GUI.medias[GUI.config.lang].balads[index].downloaded = true;
				GUI.fileSystem.root.getFile('trevouxmedias.json', {}, function(fileEntry) {
							GUI.writeMediaConfig(fileEntry,function(){
								//console.log("config updated !!!!!");
								//$("#balades-download .spinner").addClass('hidden');
								//$("#balades-download .dl-progress").addClass('hidden');

								callback();
							});
				}, GUI.onFileSystemError);
			}
		}
		syncDL(GUI.etapesDLList.shift());
		
		//penser à blocker la nav pendant le téléchargement (ou rajouter un abort si btn back)
		

		
	},
	downloadMedia:function(media,ei,en,onfinish){
		GUI.currentFileTransfert = new FileTransfer();
		var uri = encodeURI(GUI.config.mediasUrl+media.filepath);
		var downloadPath = cordova.file.dataDirectory + media.filepath;
		//console.log(downloadPath);
		GUI.currentFileTransfert.onprogress = function(progressEvent) {
			if (progressEvent.lengthComputable) {
				//console.log("local progress  "+progressEvent.loaded);
				var perc = Math.floor(((progressEvent.loaded / progressEvent.total)/en + ei/en)*100);
				//console.log(perc + "% loaded...");
				$("#balades-download .dl-progress").text(perc);
			} else {
				//console.log("Loading");
			}
		};
							
		GUI.currentFileTransfert.download(uri, downloadPath, 
		function(entry) {
			onfinish();
			//var media = new Media(entry.fullPath, null, function(e) { alert(JSON.stringify(e));});
			//media.play();
			
		}, 
		function(error) {
			if(error.code == FileTransferError.ABORT_ERR){
				GUI.resetDownload();
			}else{
				alert('No Data connection');
				GUI.resetDownload();
			}
		});		
	},
	abortMediaDownload:function(callback){
		if(GUI.currentFileTransfert){
			GUI.currentFileTransfert.abort();
			GUI.etapesDLList = [];
			GUI.currentFileTransfert = null;
		}
	},
	resetDownload:function(){
		// balades-dowload
		$("#balades-download .balades-download-btn").removeClass('hidden');
		$("#balades-download .spinner").addClass('hidden');
		$("#balades-download .dl-progress").addClass('hidden');
		//settings
		$(".settings-btn").each(function() {
			$(this).removeClass("ui-disabled");	
			
			if($(this).hasClass("spinner")){
				$(this).removeClass("spinner");
				$(this).addClass("trevouxicon-download");
			}
		});
		
	},
	deleteMediaList:function(index,callback){
		//console.log('hay');
		var etapesList = GUI.medias[GUI.config.lang].balads[index].etapes.slice(0);
		var etapesnbr = etapesList.length;
		
		function sync(etape) 
		{
			if(etape){
				//console.log("delete !!!!   "+etape.filepath);
				GUI.deleteMedia(etape,function(){
					return sync(etapesList.shift());		
				});
			}else{
				//console.log("list deleted !!");
				GUI.medias[GUI.config.lang].balads[index].downloaded = false;
				GUI.fileSystem.root.getFile('trevouxmedias.json', {}, function(fileEntry) {
							GUI.writeMediaConfig(fileEntry,function(){
								//console.log("config updated !!!!!");
								//$("#balades-download .spinner").addClass('hidden');
								//$("#balades-download .dl-progress").addClass('hidden');

								callback();
							});
				}, GUI.onFileSystemError);
			}
		}
		sync(etapesList.shift());
	},
	deleteMedia:function(media,finish){
		//console.log("thing");
		window.resolveLocalFileSystemURL(cordova.file.dataDirectory+media.filepath,
			function(fileEntry){
				//console.log("thay");
				
				fileEntry.remove(function() {
						//console.log('File removed.');
						finish();
				}, GUI.onFileSystemError);
				
			},GUI.onFileSystemError);
	},
	addBDClick:function(index){
		//$("#balades-download-container").append('<a id="balad-btn" href="#balade?balad-index='+index+'" data-transition="slide">GO !</a>');
		$("#balades-download .forward").attr("href", "#balade?balad-index="+index);
		$("#balades-download .forward").removeClass("hidden");
	},
	removeBDClick:function(){
		//$("#balades-download-container #balad-btn").remove();
		$("#balades-download .forward").addClass("hidden");
	},
	showHTMLVideo:function(){
		$(".video-container").removeClass("hidden");
		//$("#etape #myvideo").addClass(".hidden");
	},
	hideHTMLVideo:function(){
		$(".video-container").addClass("hidden");
	},
	showAudioInterface:function(){
		$(".audio-player-container").removeClass("hidden");
	},
	hideAudioInterface:function(){
		$(".audio-player-container").addClass("hidden");
	},
	showAndroidVideo:function(){
		$(".android-video-container").removeClass("hidden");
	},
	hideAndroidVideo:function(){
		$(".android-video-container").addClass("hidden");
	},
	stopAll:function(){
		//console.log(GUI.nowPlaying);
		if(GUI.nowPlaying == "sound"){
			AudioInterface.stop();
		}else if(GUI.nowPlaying == "androidVideo"){
			//console.log(JSON.stringify(VideoPlayer));
			VideoPlayer.close();
		}else if(GUI.nowPlaying == "iOSVideo"){
			$('video')[0].pause();	
		}
		GUI.nowPlaying = "none";
	},
	onAndroidVideoBtn:function(event){
		screen.lockOrientation('landscape');
		VideoPlayer.play(GUI.androidVideoFilePath,
			{
				volume: 0.5,
				scalingMode: VideoPlayer.SCALING_MODE.SCALE_TO_FIT
			},
			function () {
				//console.log("video completed");
				screen.unlockOrientation();
			},
			function (err) {
				console.log(err);
			});
		GUI.nowPlaying = "androidVideo";
	},
	onSettingsButton:function(event){
		$("body").pagecontainer("change","#settings");
	},
	onHomeButton:function(event){
		$("body").pagecontainer("change","#home");
	},
	onBackButton:function(event){
		var currentPageId = $("body").pagecontainer( "getActivePage" )[0].id;
		switch(currentPageId){
			case "home":
				$("body").pagecontainer("change","#lng-select");
			break;
			case "balades-download":
				window.history.back();
			break;
			case "balade":
				//window.history.back();
				$("body").pagecontainer("change","#home");
			break;
			case "etape":
				window.history.back();
			break;
			case "settings":
				$("body").pagecontainer("change","#home");
			break;
		}
	},
	onHardBackButton:function(){
		//console.log('hard back btn');
	},
	onAppPause:function(){
		//console.log("pause");
		GUI.stopAll();
	},
	onSettingsAction:function(event){
		//console.log(event);
		if($(this).hasClass("spinner")){// the only case where the button is enabled but has no effect
			return;
		}
		
		var self = this;
		function removeAllDisabled(){
			$(".settings-btn").each(function() {
					$(this).removeClass("ui-disabled");
			});
		}	
		function addAllDisabled(){
			$(".settings-btn").each(function() {
					$(this).addClass("ui-disabled");
			});
		}
		
		addAllDisabled();
		
		var id=event.currentTarget.id;
		switch(id){
			case "balad-0":
				if(GUI.medias[GUI.config.lang].balads[0].downloaded){
					
					GUI.deleteMediaList(0,function(){
						$(self).removeClass("trevouxicon-trash");
						$(self).addClass("trevouxicon-download");
						$(self).removeClass("ui-disabled");
						removeAllDisabled();
					});
				}else{
					$(this).removeClass("trevouxicon-download");
					$(this).addClass("spinner");
					$(this).removeClass("ui-disabled");
					
					GUI.downloadMediaList(0,function(){
						$(self).removeClass("spinner");
						$(self).addClass("trevouxicon-trash");
						removeAllDisabled();
					});
				}
			break;
			case "balad-1":
				if(GUI.medias[GUI.config.lang].balads[1].downloaded){
					GUI.deleteMediaList(1,function(){
						$(self).removeClass("trevouxicon-trash");
						$(self).addClass("trevouxicon-download");
						$(self).removeClass("ui-disabled");
						removeAllDisabled();
					});
				}else{
					$(this).removeClass("trevouxicon-download");
					$(this).addClass("spinner");
					$(this).removeClass("ui-disabled");
					
					GUI.downloadMediaList(1,function(){
						$(self).removeClass("spinner");
						$(self).addClass("trevouxicon-trash");
						removeAllDisabled();
					});
				}
			break;
			case "balad-2":
				if(GUI.medias[GUI.config.lang].balads[2].downloaded){
					GUI.deleteMediaList(2,function(){
						$(self).removeClass("trevouxicon-trash");
						$(self).addClass("trevouxicon-download");
						$(self).removeClass("ui-disabled");
						removeAllDisabled();
					});
				}else{
					$(this).removeClass("trevouxicon-download");
					$(this).addClass("spinner");
					$(this).removeClass("ui-disabled");
					
					GUI.downloadMediaList(2,function(){
						$(self).removeClass("spinner");
						$(self).addClass("trevouxicon-trash");
						removeAllDisabled();
					});
				}
			break;
			case "balad-3":
				if(GUI.medias[GUI.config.lang].balads[3].downloaded){
					GUI.deleteMediaList(3,function(){
						$(self).removeClass("trevouxicon-trash");
						$(self).addClass("trevouxicon-download");
						$(self).removeClass("ui-disabled");
						removeAllDisabled();
					});
				}else{
					$(this).removeClass("trevouxicon-download");
					$(this).addClass("spinner");
					$(this).removeClass("ui-disabled");
					
					GUI.downloadMediaList(3,function(){
						$(self).removeClass("spinner");
						$(self).addClass("trevouxicon-trash");
						removeAllDisabled();
					});
				}
			break;
			
		}
	},
	pageChange:function(event,ui){
		// FROM PAGE
		if(ui.prevPage !== undefined)
		switch(ui.prevPage[0].id){
			case "splash2":break;
			case "home":break;
			case "balades-download":
				if(GUI.currentFileTransfert)
					GUI.abortMediaDownload();
			break;
			case "balade":
			break;
			case "etape":
				GUI.hideHTMLVideo();
				GUI.hideAudioInterface();
				GUI.hideAndroidVideo();
				GUI.stopAll();
				AudioInterface.reinit();
			break;
			case "settings":
				if(GUI.currentFileTransfert)
						GUI.abortMediaDownload();	
				$("#nf-settings-btn").show();
			break;
		}

		// TO PAGE
		//console.log(ui.toPage);
		switch(ui.toPage[0].id){
			case "splash2":
				$("#nav-foot").hide();	
			break;
			case "lng-select":
				$("#nav-foot").hide();
			break;
			case "home":
				$("#home .balades-li-title").each(function(index){
						$(this).text(GUI.config.balads[index].baladTitle[GUI.config.lang]);
				});
				$("#home .balades-li-text").each(function(index){
						$(this).text(GUI.config.balads[index].baladSubtitle[GUI.config.lang]);
				});
				
				
				
				
			break;
			case "balades-download":
				var baladIndex = parseInt(GetURLParameters(ui.absUrl)["balad-index"]);
				//var downloaded = (GetURLParameters(ui.absUrl)["downloaded"] === 'true');
				//console.log(GUI.medias[GUI.config.lang]);
				//console.log(baladIndex);
				var downloaded = GUI.medias[GUI.config.lang].balads[baladIndex].downloaded;
				//console.log(GUI.config.lang);
				//console.log(GUI.medias[GUI.config.lang].balads[baladIndex]);
				//console.log(downloaded);
				
				//console.log("downloaded  "+downloaded+"  "+GetURLParameters(ui.absUrl)["downloaded"]);
				if(!isNaN(baladIndex)){
					$("#balades-download .balades-title").text(GUI.config.balads[baladIndex].baladTitle[GUI.config.lang]);
					$("#balades-download .balades-sub-title").text(GUI.config.balads[baladIndex].baladSubtitle[GUI.config.lang]);
					
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
					
					$("#balade #balade-header .title").text(GUI.config.balads[baladIndex].baladTitle[GUI.config.lang]);
					$("#balade #balade-header .sub-title").text(GUI.config.balads[baladIndex].baladSubtitle[GUI.config.lang]);
					for(var k=0;k <= GUI.config.balads[baladIndex].etapes[GUI.config.lang].length-1;k++){
						$("#balade #etapes-list").append('<li><a href="#etape?balad-index='+baladIndex+'&etape-index='+k+'" data-transition="fade"><div class="etape-li-text">'+GUI.config.balads[baladIndex].etapes[GUI.config.lang][k]+'</div></a></li>');					
					}
				}				
				
				
			break;
			case "etape":
				//console.log("etape");
				var baladIndex = parseInt(GetURLParameters(ui.absUrl)["balad-index"]);
				var etapeIndex = parseInt(GetURLParameters(ui.absUrl)["etape-index"]);
				if(baladIndex == 1){//video balad
					window.resolveLocalFileSystemURL(cordova.file.dataDirectory+GUI.medias[GUI.config.lang].balads[baladIndex].etapes[etapeIndex].filepath,
						function(entry){
							if(device.platform != "Android"){
								//console.log("not android");
								//$('video')[0].src = entry.toURL();
								///$(".video-container").removeClass("hidden");
								GUI.showHTMLVideo();
								$('video')[0].src = entry.toURL();
								//console.log($('video')[0].src);
								$('video')[0].play();
								GUI.nowPlaying = "iOSVideo";
							}else{
								
								GUI.showAndroidVideo();
								//VideoPlayer.play("file:///android_asset/www/medias/FR/CIVRIEUX/station2.mp4",
								GUI.androidVideoFilePath = entry.toURL();

							}		
						},function(err){
							console.log(JSON.stringify(err));
						});
				}else{ // all other balads - audio
					window.resolveLocalFileSystemURL(cordova.file.dataDirectory+GUI.medias[GUI.config.lang].balads[baladIndex].etapes[etapeIndex].filepath,
						function(entry){
							//console.log(entry);	
							//$('audio')[0].src = entry.toURL();
							document.getElementById('html-audio').src = entry.toURL();
							
							/* Method with cordova.media plugin */
							/*
							GUI.audioPlayer = new Media(entry.toInternalURL(),
							//GUI.audioPlayer = new Media("http://trevoux.hmsphr.com/medias/FR/TREVOUX/S1Passerelle.mp3",
								
								// success callback
								function () {
										console.log("playAudio():Audio Success");
										
										AudioInterface.reinit();
								},
								// error callback
								function (err) {
										console.log("playAudio():Audio Error: " + JSON.stringify(err));
								},
								//status callback
								function(status){
									AudioInterface.displayDuration(GUI.audioPlayer.getDuration());
								}
							);
							
							// quick patch for status to be called and therefore duration to be updated before user play
							GUI.audioPlayer.play();
							GUI.audioPlayer.stop();
							*/
							GUI.showAudioInterface();
						},function(err){
							console.log(JSON.stringify(err));	
					});
				}

				
			break;
			case "settings":
				$("#nf-settings-btn").hide();
				
				$( "#settings .settings-btn" ).each(function( index ) {
					$(this).removeClass("trevouxicon-trash trevouxicon-download ui-disabled");
					if(GUI.medias[GUI.config.lang].balads[index].downloaded){
						$(this).addClass("trevouxicon-trash");
					}else{
						$(this).addClass("trevouxicon-download");
					}
				});
			break;
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
			//console.log('no parameters');
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