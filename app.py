from flask import Flask, render_template, request, jsonify
import numpy as np
import matplotlib
import base64
import noisereduce as nr
from pydub import AudioSegment
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.io import wavfile
from io import BytesIO
import os
from pydub import AudioSegment

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_audio', methods=['POST'])
def process_audio():
    audio_file = request.files.get('audio')
    if audio_file:
        sample_rate, audio_data = wavfile.read(audio_file) # Load the audio file
        noise = np.random.normal(0, 0.5, len(audio_data)) # Add synthetic noise (optional)
        noisy_audio = audio_data + noise 
        reduced_noise = nr.reduce_noise(y=noisy_audio, sr=sample_rate) # Apply noise reduction
        
        # Save the filtered audio with a new name
        wavfile.write('filtered_audio.wav', sample_rate, reduced_noise.astype(np.int16))
        # Encode the filtered audio to base64
        buffered = BytesIO()
        wavfile.write(buffered, sample_rate, reduced_noise.astype(np.int16))
        audio_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        buffered1 = BytesIO()
        wavfile.write(buffered1, sample_rate, audio_data.astype(np.int16))
        original_base64 = base64.b64encode(buffered1.getvalue()).decode('utf-8')


        # Plot the original, noisy, and filtered audio
        plot_data = create_plot(audio_data, noisy_audio, reduced_noise)
        return jsonify({'success': True, 'plot_data': plot_data, 'audio_data': audio_base64, 'original_data': original_base64})

    return jsonify({'success': False, 'message': 'No audio file received'})

@app.route('/record', methods=['POST'])
def record():
    try:
        if request.content_type != 'audio/wav':
            raise ValueError("Invalid content type. Expected audio/wav.")

        # Read the raw binary data from the request
        audio_binary = request.get_data()

        # Ensure the length of the binary data is even
        if len(audio_binary) % 2 != 0:
            audio_binary = audio_binary[:-1]
        
        # with open("temp.wav", "wb") as file:
        #     file.write(audio_binary)


        filename = 'temp.webm'
        with open(filename, 'wb') as webm_file:
            webm_file.write(audio_binary)
        convert_webm_to_wav(filename)

        # Load the audio data and sample rate from the binary data
        sample_rate, audio_data = wavfile.read('temp.wav') # Load the audio file

        # sample_rate, audio_data = wavfile.read('temp.wav') # Load the audio file
        noise = np.random.normal(0, 0.5, len(audio_data)) # Add synthetic noise (optional)
        noisy_audio = audio_data + noise 
        reduced_noise = nr.reduce_noise(y=noisy_audio, sr=sample_rate) # Apply noise reduction
        
        # Save the filtered audio with a new name
        wavfile.write('filtered_audio.wav', sample_rate, reduced_noise.astype(np.int16))
        # Encode the filtered audio to base64
        buffered = BytesIO()
        wavfile.write(buffered, sample_rate, reduced_noise.astype(np.int16))
        audio_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        buffered1 = BytesIO()
        wavfile.write(buffered1, sample_rate, audio_data.astype(np.int16))
        original_base64 = base64.b64encode(buffered1.getvalue()).decode('utf-8')

        os.remove('temp.wav')

        # Plot the original, noisy, and filtered audio
        plot_data = create_plot(audio_data, noisy_audio, reduced_noise)
        return jsonify({'success': True, 'plot_data': plot_data, 'audio_data': audio_base64, 'original_data': original_base64})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Error processing audio'})

def create_plot(audio_data, noisy_audio, reduced_noise):
    # Plot original, noisy, and filtered audio
    plt.figure(figsize=(12, 6))
    plt.plot(audio_data, label='Original Audio', color='blue')
    plt.plot(noisy_audio, label='Noisy Audio', color='red', alpha=0.7)
    plt.plot(reduced_noise, label='Filtered Audio', color='green')
    plt.xlabel('Time (samples)')
    plt.ylabel('Amplitude')
    plt.title('Original vs. Noisy vs. Filtered Audio')
    plt.legend()
    
    # Save the plot to a BytesIO object
    img_data = BytesIO()
    plt.savefig(img_data, format='png')
    plt.close()

    # Convert BytesIO content to base64 and decode to a string
    img_data_base64 = base64.b64encode(img_data.getvalue()).decode('utf-8')
    return img_data_base64

def convert_wav_to_mp3(wav_file_path, mp3_file_path):
    # Load the WAV file
    audio = AudioSegment.from_wav(wav_file_path)
    
    # Export as MP3
    audio.export(mp3_file_path, format="mp3")

def convert_webm_to_wav(filename):
    os.system(f"ffmpeg -y -i {filename} -ac 1 -f wav temp.wav")
    os.remove(filename)

if __name__ == '__main__':
    app.run(port=5000, debug=True)