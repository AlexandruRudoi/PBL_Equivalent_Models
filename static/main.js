document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const resultDiv = document.getElementById('result');
    const audioPlayer = document.getElementById('audioPlayer2');
    const audioPlayer1 = document.getElementById('audioPlayer1');
    const backButton = document.getElementById('backButton');
    const startRecordingButton = document.getElementById('startRecording');
    const stopRecordingButton = document.getElementById('stopRecording');
    const professions = ['Musician', 'Journalist', 'Podcaster', 'Educator', 'Interviewer', 'Vlogger'];
    const professionElement = document.getElementById('profession');
    const recordingContainer = document.getElementById('recording-container');
    const uploadTitle = document.getElementById('upload-title');
    const customButton = document.getElementById('customButton');
    const filteredTitle = document.getElementById('filtered-audio-title');
    const filteredTitle2 = document.getElementById('filtered-audio-title2');
    const soundLoader = document.getElementById('sound-loading');
    const audioContainer = document.getElementById('audio-container');
    let mediaRecorder;
    let audioBlob;
    let chunks = [];

    // Ensure audioPlayer is hidden initially
    audioContainer.style.display = 'none';
    audioPlayer.style.display = 'none';
    audioPlayer1.style.display = 'none';
    stopRecordingButton.style.display = 'none';

    // Open file input when custom button is clicked
    customButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Function to update the profession text with animation
    function updateProfession() {
        const currentProfession = professionElement.textContent;
        
        // Create a random index for the next profession
        let nextIndex = Math.floor(Math.random() * professions.length);
        while (professions[nextIndex] === currentProfession) {
            // Ensure the next profession is different from the current one
            nextIndex = Math.floor(Math.random() * professions.length);
        }
        const nextProfession = professions[nextIndex];
        
        // Animate the profession change (move down)
        professionElement.style.animation = 'moveDown 0.5s ease';
        setTimeout(() => {
            // Update the profession text
            professionElement.textContent = nextProfession;
            // Reset animation (move back to original position)
            professionElement.style.animation = 'none';
        }, 500); // Wait for the animation to complete (0.5s)
    }

    // Initial update
    updateProfession();

    // Update the profession text every 5 seconds
    setInterval(updateProfession, 2000);

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('active');
        const files = e.dataTransfer.files;
        fileInput.files = files;
        processAudio();
    });

    fileInput.addEventListener('change', processAudio);

    startRecordingButton.addEventListener('click', () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                mediaRecorder = new MediaRecorder(stream);
    
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };
    
                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(chunks, { type: 'audio/webm' });
    
                    // Directly send the Blob to the server
                    fetch('/record', {
                        method: 'POST',
                        body: audioBlob,  // Send Blob directly
                        headers: {
                            'Content-Type': 'audio/wav',  // Adjust content type accordingly
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            displayResult(data.plot_data);
                            // Set the audio source to the uploaded file
                            // audioPlayer.src = URL.createObjectURL(audioBlob);
                            audioPlayer.src = 'data:audio/wav;base64,' + data.audio_data;
                            audioPlayer1.src = 'data:audio/wav;base64,' + data.original_data;
                            // Show the audio player
                            audioContainer.style.display = 'block';
                            audioPlayer.style.display = 'block';
                            audioPlayer1.style.display = 'block';
                        } else {
                            resultDiv.innerHTML = `<p>${data.message}</p>`;
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                };
    
                mediaRecorder.start();
                // Hide start button and show stop button
                startRecordingButton.style.display = 'none';
                stopRecordingButton.style.display = 'block';
            })
            .catch((error) => {
                console.error('Error accessing microphone:', error);
            });
    });

    stopRecordingButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            chunks = [];
            // Hide stop button and show start button
            stopRecordingButton.style.display = 'none';
            startRecordingButton.style.display = 'block';
        }
    });

    backButton.addEventListener('click', () => {
        fileInput.value = null;
        const event = new Event('change');
        fileInput.dispatchEvent(event);
        resultDiv.innerHTML = '';
        dropArea.style.display = 'block';
        startRecordingButton.style.display = 'block';
        stopRecordingButton.style.display = 'none'; // Ensure stop button is hidden
        backButton.style.display = 'none';
        recordingContainer.style.display = 'block';
        uploadTitle.style.display = 'block';
        soundLoader.style.display = 'block';
        filteredTitle.style.display = 'none';
        filteredTitle2.style.display = 'none';
        // Hide the audio player when going back to the main page
        audioContainer.style.display = 'none';
        audioPlayer.style.display = 'none';
        audioPlayer.src = ''; // Clear the audio source
        audioPlayer1.style.display = 'none';
        audioPlayer1.src = ''; // Clear the audio source
    });

    function processAudio() {
        const formData = new FormData();

        if (fileInput.files.length > 0) {
            formData.append('audio', fileInput.files[0]);

            fetch('/process_audio', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayResult(data.plot_data);
                        // Set the audio source to the uploaded file
                        // audioPlayer.src = URL.createObjectURL(fileInput.files[0]);
                        audioPlayer.src = 'data:audio/wav;base64,' + data.audio_data;
                        audioPlayer1.src = 'data:audio/wav;base64,' + data.original_data;
                        // Show the audio player
                        audioContainer.style.display = 'block';
                        audioPlayer.style.display = 'block';
                        audioPlayer1.style.display = 'block';
                        // Start the audio visualizer
                        startAudioVisualizer(audioPlayer, 'canvas2');
                        startAudioVisualizer(audioPlayer1, 'canvas1');
                    } else {
                        resultDiv.innerHTML = `<p>${data.message}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        } else {
            resultDiv.innerHTML = '<p>No audio file selected.</p>';
        }
    }

    function displayResult(plotData) {
        dropArea.style.display = 'none';
        startRecordingButton.style.display = 'none';
        stopRecordingButton.style.display = 'none';
        recordingContainer.style.display = 'none';
        uploadTitle.style.display = 'none';
        soundLoader.style.display = 'none';
        backButton.style.display = 'block';
        filteredTitle.style.display = 'block';
        filteredTitle2.style.display = 'block';
        resultDiv.innerHTML = `<div class="image-container"><img id="plot-graph" src="data:image/png;base64,${plotData}" alt="FFT Plot"></div>`;
    }

    function startAudioVisualizer(audioElement, canvasId) {
        const canvas = document.getElementById(canvasId);
        const canvasCtx = canvas.getContext('2d');
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(audioElement);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
    
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    
        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            // Clear the canvas
            // canvasCtx.fillStyle = 'rgb(255, 255, 255)'; // Set background color to white
            // canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            canvasCtx.beginPath();
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
            // // Limit canvas size based on maximum dimensions
            // const computedStyle = getComputedStyle(canvas.parentElement);
            // const maxWidth = parseFloat(computedStyle.getPropertyValue('width'));
            // const maxHeight = parseFloat(computedStyle.getPropertyValue('height'));
            // const aspectRatio = canvas.width / canvas.height;
            // if (canvas.width > maxWidth || canvas.height > maxHeight) {
            //     if (aspectRatio > maxWidth / maxHeight) {
            //         canvas.width = maxWidth;
            //         canvas.height = maxWidth / aspectRatio;
            //     } else {
            //         canvas.height = maxHeight;
            //         canvas.width = maxHeight * aspectRatio;
            //     }
            // }
        }
        draw();

        // Stretch canvas width to fit parent container and center it
        function resizeCanvas() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }

        // Call resizeCanvas when the window is resized
        window.addEventListener('resize', resizeCanvas);

        // Call resizeCanvas initially to set the canvas size
        resizeCanvas();
    }
    
});