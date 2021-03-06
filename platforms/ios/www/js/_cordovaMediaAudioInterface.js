var AudioInterface = {
	isPlaying:false,
	progressTimerHandler:null,
	progressInterval:200,
	init:function(){
		
		$("#pButton").on("click",function(event){
			
			if(AudioInterface.isPlaying === false){
				$("#pButton").toggleClass("play pause");
				GUI.audioPlayer.play();
				AudioInterface.progressTimerHandler = setInterval(AudioInterface.onProgress,AudioInterface.progressInterval);
				GUI.nowPlaying = "sound";
				AudioInterface.isPlaying = true;
			}else{
				$("#pButton").toggleClass("play pause");
				clearInterval(AudioInterface.progressTimerHandler);
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
			clearInterval(AudioInterface.progressTimerHandler);
		});
		// a corriger
		$("#timeline").on("touchmove",function(event){
			//console.log("touchmove");
			AudioInterface.movePlayHead(event);
		});
		$("#timeline").on("touchend",function(event){
			//console.log("touchend");
			var duration = GUI.audioPlayer.getDuration()*1000;
			var clickpercent = (event.originalEvent.changedTouches[0].pageX - $("#timeline").offset().left) / $("#timeline").width();
			console.log(clickpercent);
			GUI.audioPlayer.seekTo(duration * clickpercent);
			//GUI.audioPlayer.seekTo(5000);
			
			AudioInterface.progressTimerHandler = setInterval(AudioInterface.onProgress,AudioInterface.progressInterval);
			
			
		});
	},
	stop:function(){
		GUI.audioPlayer.stop();
		GUI.audioPlayer.release();	
		
		$("#playhead").css("margin-left",0 + "%");
		clearInterval(AudioInterface.progressTimerHandler);
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
					console.log(progress);
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
		
		var tsec = Math.round(position);
		var minutes = Math.floor(tsec / 60);
		var seconds = tsec - minutes * 60;
		var secondsS = seconds < 10 ? "0"+seconds.toString() : seconds.toString();
		$("#audio-player-time-current").text(minutes+":"+secondsS);
	},
	displayDuration:function(duration){
		var tsec = Math.round(duration);
		var minutes = Math.floor(tsec / 60);
		var seconds = tsec - minutes * 60;
		var secondsS = seconds < 10 ? "0"+seconds.toString() : seconds.toString();
		$("#audio-player-time-total").text(minutes+":"+secondsS);
	}
	
	
}