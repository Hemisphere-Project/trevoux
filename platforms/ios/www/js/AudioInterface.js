var AudioInterface = {
	isPlaying:false,
	//progressTimerHandler:null,
	progressInterval:200,
	duration:0,
	progress:0,
	progressInfo:{
		tsec:0,
		minutes:0,
		seconds:0,
		secondsS:""
	},
	durationInfo:{
		tsec:0,
		minutes:0,
		seconds:0,
		secondsS:""
	},
	init:function(){
		
		GUI.audioPlayer = document.getElementById('html-audio');
		
		$(GUI.audioPlayer).bind("ended",AudioInterface.reinit);
		$(GUI.audioPlayer).bind("loadedmetadata durationchange",AudioInterface.onmetaloaded);
		
		
		
		$("#pButton").on("click",function(event){
			
			if(AudioInterface.isPlaying === false){
				$("#pButton").toggleClass("play pause");
				GUI.audioPlayer.play();
				$(GUI.audioPlayer).bind("timeupdate",AudioInterface.onTimeUpdate);
				GUI.nowPlaying = "sound";
				AudioInterface.isPlaying = true;
				//AudioInterface.displayDuration(GUI.audioPlayer.duration);
			}else{
				$("#pButton").toggleClass("play pause");
				$(GUI.audioPlayer).unbind("timeupdate",AudioInterface.onTimeUpdate);
				GUI.audioPlayer.pause();
				GUI.nowPlaying = "none";
				AudioInterface.isPlaying = false;
			}
		});
		$("#timeline").on("touchstart",function(event){
			//console.log("touchstart");
			// android touchmove event bug patch
			if(device.platform == "Android") {
				event.preventDefault();
			}
			$(GUI.audioPlayer).unbind("timeupdate",AudioInterface.onTimeUpdate);
		});
		// a corriger
		$("#timeline").on("touchmove",function(event){
			//console.log("touchmove");
			AudioInterface.movePlayHead(event);
		});
		$("#timeline").on("touchend",function(event){
			//console.log("touchend");
			var duration = GUI.audioPlayer.duration;
			var clickpercent = (event.originalEvent.changedTouches[0].pageX - $("#timeline").offset().left) / $("#timeline").width();
			//console.log(clickpercent);
			GUI.audioPlayer.currentTime = duration*clickpercent;
			$(GUI.audioPlayer).bind("timeupdate",AudioInterface.onTimeUpdate);
			
			
		});
	},
	onmetaloaded:function(){
		AudioInterface.displayDuration(GUI.audioPlayer.duration);
	},
	stop:function(){
		//GUI.audioPlayer.stop();
		GUI.audioPlayer.pause();
		GUI.audioPlayer.currentTime = 0;
		
		//GUI.audioPlayer.release();	
		
		$("#playhead").css("margin-left",0 + "%");
		$("#pButton").removeClass("play pause");
		$("#pButton").addClass("play");
		
		$(GUI.audioPlayer).unbind("timeupdate",AudioInterface.onTimeUpdate);
		
		$("#audio-player-time-current").text("0:00");
		
		AudioInterface.isPlaying = false;
		
		// TODO release object or memory leaks !!
		//GUI.audioPlayer = null;
		//delete GUI.audioPlayer;
	},
	reinit:function(){
		$("#pButton").removeClass("play pause");
		$("#pButton").addClass("play");
		$("#playhead").css("margin-left",0 + "%");
		$("#audio-player-time-current").text("0:00");
		GUI.nowPlaying = "none";
		AudioInterface.isPlaying = false;
	},
	onProgress:function(){
		GUI.audioPlayer.getCurrentPosition(
			// success callback
			function (position) {
				if (position > -1) {
					var duration = GUI.audioPlayer.getDuration();
					var progress = (position/duration);
					//console.log(progress);
					var newpos = progress * ($("#timeline").width() - $("#playhead").width());
					$("#playhead").css("margin-left",newpos + "px");
					AudioInterface.displayProgress(position);
				}
			},
			// error callback
			function (e) {
				console.log("Error getting pos=" + e);
			}
		);
	},
	onTimeUpdate:function(e){
/*		var duration = GUI.audioPlayer.duration;
		var progress = GUI.audioPlayer.currentTime/duration;
		console.log(progress);
		var newpos = progress * ($("#timeline").width() - $("#playhead").width());
		$("#playhead").css("margin-left",newpos + "px");
		AudioInterface.displayProgress(GUI.audioPlayer.currentTime);*/
		AudioInterface.duration = GUI.audioPlayer.duration;
		AudioInterface.progress = GUI.audioPlayer.currentTime/AudioInterface.duration;
		//console.log(AudioInterface.progress);
		//var newpos = ;
		$("#playhead").css("margin-left",AudioInterface.progress * ($("#timeline").width() - $("#playhead").width()) + "px");
		AudioInterface.displayProgress(GUI.audioPlayer.currentTime);
		
	},
	movePlayHead:function(e){
		var newMargLeft = e.originalEvent.touches[0].pageX - $("#timeline").offset().left;
		var tlwidth = $("#timeline").width() - $("#playhead").width()
			
		if (newMargLeft > 0 && newMargLeft < tlwidth) {
			$("#playhead").css("margin-left",newMargLeft + "px");
		}
		if (newMargLeft == 0) {
			$("#playhead").css("margin-left","0px");
		}
		if (newMargLeft >= tlwidth) {
			$("#playhead").css("margin-left",tlwidth + "px");
		}	
	},
	displayProgress:function(position){
		
		AudioInterface.progressInfo.tsec = Math.round(position);
		AudioInterface.progressInfo.minutes = Math.floor(AudioInterface.progressInfo.tsec / 60);
		AudioInterface.progressInfo.seconds = AudioInterface.progressInfo.tsec - AudioInterface.progressInfo.minutes * 60;
		AudioInterface.progressInfo.secondsS = AudioInterface.progressInfo.seconds < 10 ? "0"+AudioInterface.progressInfo.seconds.toString() : AudioInterface.progressInfo.seconds.toString();
		$("#audio-player-time-current").text(AudioInterface.progressInfo.minutes+":"+AudioInterface.progressInfo.secondsS);

	},
	displayDuration:function(duration){
		AudioInterface.durationInfo.tsec = Math.round(duration);
		//console.log("AudioInterface.durationInfo.tsec = "+AudioInterface.durationInfo.tsec);
		AudioInterface.durationInfo.minutes = Math.floor(AudioInterface.durationInfo.tsec / 60);
		AudioInterface.durationInfo.seconds = AudioInterface.durationInfo.tsec - AudioInterface.durationInfo.minutes * 60;
		AudioInterface.durationInfo.secondsS = AudioInterface.durationInfo.seconds < 10 ? "0"+AudioInterface.durationInfo.seconds.toString() : AudioInterface.durationInfo.seconds.toString();
		$("#audio-player-time-total").text(AudioInterface.durationInfo.minutes+":"+AudioInterface.durationInfo.secondsS);
	}
	
	
}