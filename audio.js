
        // Expose globally your audio_context, the recorder instance and audio_stream
        var audio_context;
        var recorder;
        var audio_stream;

        /**
         * Patch the APIs for every browser that supports them and check
         * if getUserMedia is supported on the browser. 
         * 
         */
        function Initialize() {
            try {
                // Monkeypatch for AudioContext, getUserMedia and URL
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
                window.URL = window.URL || window.webkitURL;

                // Store the instance of AudioContext globally
                audio_context = new AudioContext();
                console.log('Audio context is ready !');
                console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
            } catch (e) {
                alert('No web audio support in this browser!');
            }
        }
 
        /**
         * Starts the recording process by requesting the access to the microphone.
         * Then, if granted proceed to initialize the library and store the stream.
         *
         * It only stops when the method stopRecording is triggered.
         */
        function startRecording() {
            // Access the Microphone using the navigator.getUserMedia method to obtain a stream
            navigator.getUserMedia({ audio: true }, function (stream) {
                
                audio_context.resume().then((data) => {
                console.log('Playback resumed successfully',+data);
                });
                // Expose the stream to be accessible globally
                audio_stream = stream;
                // Create the MediaStreamSource for the Recorder library
                var input = audio_context.createMediaStreamSource(stream);
                console.log('Media stream succesfully created');

                // Initialize the Recorder Library
                recorder = new Recorder(input);
                console.log('Recorder initialised');

                // Start recording !
                recorder && recorder.record();
                console.log('Recording...');

                // Disable Record button and enable stop button !
                document.getElementById("start-btn").disabled = true;
                document.getElementById("stop-btn").disabled = false;
            }, function (e) {
                console.error('No live audio input: ' + e);
            });
        }

        /**
         * Stops the recording process. The method expects a callback as first
         * argument (function) executed once the AudioBlob is generated and it
         * receives the same Blob as first argument. The second argument is
         * optional and specifies the format to export the blob either wav or mp3
         */
        function stopRecording(callback, AudioFormat) {
            // Stop the recorder instance
            recorder && recorder.stop();
            console.log('Stopped recording.');

            // Stop the getUserMedia Audio Stream !
            audio_stream.getAudioTracks()[0].stop();

            // Disable Stop button and enable Record button !
            document.getElementById("start-btn").disabled = false;
            document.getElementById("stop-btn").disabled = true;

            // Use the Recorder Library to export the recorder Audio as a .wav file
            // The callback providen in the stop recording method receives the blob
            if(typeof(callback) == "function"){

                /**
                 * Export the AudioBLOB using the exportWAV method.
                 * Note that this method exports too with mp3 if
                 * you provide the second argument of the function
                 */
                recorder && recorder.exportWAV(function (blob) {
                    callback(blob);

                    // create WAV download link using audio data blob
                    // createDownloadLink();

                    // Clear the Recorder to start again !
                    recorder.clear();
                }, (AudioFormat || "audio/mp3"));
            }
        }

        // Initialize everything once the window loads
        window.onload = function(){
            // Prepare and check if requirements are filled
            Initialize();

            // Handle on start recording button
            document.getElementById("start-btn").addEventListener("click", function(){
                startRecording();
            }, false);

            // Handle on stop recording button
            document.getElementById("stop-btn").addEventListener("click", function(){
                // Use wav format
                var _AudioFormat = "audio/mp3";
                // You can use mp3 to using the correct mimetype
                //var AudioFormat = "audio/mpeg";

                stopRecording(function(AudioBLOB){
                    // Note:
                    // Use the AudioBLOB for whatever you need, to download
                    // directly in the browser, to upload to the server, you name it !

                    // In this case we are going to add an Audio item to the list so you
                    // can play every stored Audio
                    var url = URL.createObjectURL(AudioBLOB);
                    console.log("url is.................. ",AudioBLOB);
                    var li = document.createElement('li');
                    var au = document.createElement('audio');
                    var hf = document.createElement('a');

                    au.controls = true;
                    au.src = url;
                    hf.href = url;
                    // Important:
                    // Change the format of the file according to the mimetype
                    // e.g for audio/wav the extension is .wav 
                    //     for audio/mpeg (mp3) the extension is .mp3
                    //hf.download = new Date().toISOString() + '.mp3';
                    hf.download = 'abc'+ '.mp3';
                    hf.innerHTML = hf.download;
                    console.log("download link is",hf,url);

                    var fileData = new File([AudioBLOB], 'temp.mp3', { type: 'audio/mp3' }); 
                    postMp3(fileData);
                    li.appendChild(hf);
                    li.appendChild(au);
                    recordingslist.appendChild(li);   
                                    
                }, _AudioFormat);
            }, false);
            
            function postMp3(AudioBLOB){
                var aud = new Audio();
                var data = new FormData();
                data.append("language", "EN");
                //console.log("Audio data is.........",AudioBLOB);
                data.append("audio_file",AudioBLOB);
                
                
                var xhr = new XMLHttpRequest();
                xhr.withCredentials = false;
                
                xhr.addEventListener("readystatechange", function () {
                  if (this.readyState === 4) {
                    var o=JSON.parse(this.responseText);
                    console.log("Response is...",o);
                   // console.log("confidence_per_word ",o.transcriptions["0"].confidence_per_word);
                    console.log("confidence_score",o.transcriptions["0"].confidence_score);
                    console.log("utf_text",o.transcriptions["0"].utf_text);
                    var stt=document.getElementById("stt");
                    var voicedata=o.transcriptions["0"].utf_text;
                    if(voicedata==null || voicedata==''){
                        stt.append('Microphone is no connected correctly \n');
                    }else{
                        stt.append(voicedata);
                    }
                    
                  }
                });
                
                xhr.open("POST", "https://dev.liv.ai/liv_transcription_api/recordings/");
                xhr.setRequestHeader("authorization", "Token 21edbf43a50382e01b9b3c40e07d6d09c2776b58");
                //xhr.setRequestHeader("cache-control", "no-cache");
               // xhr.setRequestHeader("postman-token", "3df18bae-a6d7-0822-02f9-1d0647f18b22");
                xhr.send(data);
              //  console.log("Data is ............",data)
            }

        };
        