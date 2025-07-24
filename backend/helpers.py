import os
import subprocess

def generate_srt(segments, srt_path):
    with open(srt_path, "w", encoding="utf-8") as srt_file:
        for i, segment in enumerate(segments, start=1):
            start = format_time(segment['start'])
            end = format_time(segment['end'])
            text = segment['text'].strip()
            srt_file.write(f"{i}\n{start} --> {end}\n{text}\n\n")

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

def overlay_subtitles(input_path, srt_path, output_path):
    try:
        # Use absolute paths for Windows compatibility
        input_path = os.path.abspath(input_path)
        srt_path = os.path.abspath(srt_path)
        output_path = os.path.abspath(output_path)
        
        print(f"Input path: {input_path}")
        print(f"SRT path: {srt_path}")
        print(f"Output path: {output_path}")

        # Escape paths properly for Windows
        srt_path_escaped = srt_path.replace("\\", "\\\\").replace(":", "\\:")
        
        command = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-vf', f"subtitles='{srt_path_escaped}':force_style='FontSize=16,PrimaryColour=&H00ffffff,BorderStyle=1,Outline=1,Shadow=1'",
            '-c:a', 'copy',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            output_path
        ]
        
        print("Running ffmpeg command:", ' '.join(command))
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("FFmpeg completed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        error_msg = f"FFmpeg failed: {e.stderr}"
        print(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to embed subtitles: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)
