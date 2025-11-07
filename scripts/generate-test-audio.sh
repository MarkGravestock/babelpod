#!/bin/bash

# Generate test audio file for integration tests
# This creates a 30-second audio file with a simple tone

OUTPUT_DIR="public/test-audio"
OUTPUT_FILE="$OUTPUT_DIR/test-podcast.mp3"

mkdir -p "$OUTPUT_DIR"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: download from https://ffmpeg.org/download.html"
    exit 1
fi

# Generate 30 seconds of audio:
# - 440 Hz tone (musical note A)
# - Fade in/out for smooth playback
# - Low volume for testing
ffmpeg -f lavfi -i "sine=frequency=440:duration=30" \
    -af "afade=t=in:st=0:d=1,afade=t=out:st=29:d=1,volume=0.3" \
    -y "$OUTPUT_FILE"

echo "✅ Test audio file generated: $OUTPUT_FILE"
echo "Duration: 30 seconds"
echo "Format: MP3"
echo "Use this file for integration testing"
