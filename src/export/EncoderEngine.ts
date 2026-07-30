/**
 * VIZ Studio - Dynamic Video & Media Export Engine
 * Checks VideoEncoder.isConfigSupported() and auto-selects codec chain:
 * AV1 -> H264 Baseline -> VP9 -> VP8 -> MediaRecorder Fallback -> GIF / PNG Sequence
 */

import JSZip from 'jszip';
import { ExportSettings, ExportProgress } from '../types';

export class EncoderEngine {
  private isCancelled: boolean = false;
  private isPaused: boolean = false;

  public async getBestSupportedCodec(width: number, height: number, fps: number, bitrateKbps: number): Promise<string | null> {
    if (typeof (window as any).VideoEncoder === 'undefined') {
      return null;
    }

    const candidateConfigs = [
      { codec: 'av01.0.04M.08', label: 'AV1' },
      { codec: 'avc1.42E01E', label: 'H264 Baseline' },
      { codec: 'avc1.4d401f', label: 'H264 Main' },
      { codec: 'vp09.00.10.08', label: 'VP9' },
      { codec: 'vp8', label: 'VP8' },
    ];

    for (const item of candidateConfigs) {
      try {
        const support = await (window as any).VideoEncoder.isConfigSupported({
          codec: item.codec,
          width,
          height,
          bitrate: bitrateKbps * 1000,
          framerate: fps,
        });

        if (support && support.supported) {
          console.log(`[VIZ Studio Encoder] Codec supported: ${item.label} (${item.codec})`);
          return item.codec;
        }
      } catch (e) {
        console.warn(`[VIZ Studio Encoder] Codec test failed for ${item.label}:`, e);
      }
    }

    return null;
  }

  public cancelExport() {
    this.isCancelled = true;
  }

  public pauseExport() {
    this.isPaused = true;
  }

  public resumeExport() {
    this.isPaused = false;
  }

  public async startExport(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (timeSec: number) => void,
    durationSec: number,
    settings: ExportSettings,
    onProgress: (progress: ExportProgress) => void,
    audioStream?: MediaStream | null,
    playAudio?: () => void,
    stopAudio?: () => void
  ): Promise<Blob> {
    this.isCancelled = false;
    this.isPaused = false;

    const totalFrames = Math.ceil(durationSec * settings.fps);
    const frameIntervalSec = 1 / settings.fps;
    const logs: string[] = [];

    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      console.log(`[Export] ${msg}`);
    };

    addLog(`Initiating export: ${settings.format.toUpperCase()} ${settings.width}x${settings.height} @ ${settings.fps} FPS`);

    // Handle PNG Sequence Export
    if (settings.format === 'png_sequence') {
      return this.exportPNGSequence(canvas, renderFrameAtTime, totalFrames, frameIntervalSec, onProgress, addLog, logs);
    }

    // MediaRecorder Primary Strategy (Fast, containerized MP4/WebM, highly reliable across all browsers)
    try {
      return await this.exportWithMediaRecorder(
        canvas,
        renderFrameAtTime,
        totalFrames,
        frameIntervalSec,
        settings,
        onProgress,
        addLog,
        logs,
        audioStream,
        playAudio,
        stopAudio
      );
    } catch (err: any) {
      addLog(`MediaRecorder failed (${err.message}). Trying WebCodecs fallback...`);
    }

    // WebCodecs Fallback Strategy
    const bestCodec = await this.getBestSupportedCodec(settings.width, settings.height, settings.fps, settings.bitrateKbps);
    if (bestCodec) {
      try {
        addLog(`Selected WebCodecs hardware codec: ${bestCodec}`);
        return await this.exportWithWebCodecs(
          canvas,
          renderFrameAtTime,
          totalFrames,
          frameIntervalSec,
          settings,
          bestCodec,
          onProgress,
          addLog,
          logs
        );
      } catch (err: any) {
        addLog(`WebCodecs failed: ${err.message}`);
      }
    }

    throw new Error(
      'Browser Anda belum mendukung konfigurasi ekspor ini. Silakan coba pilih format atau kualitas lain.'
    );
  }

  // -------------------------------------------------------------------------
  // WebCodecs Export Strategy
  // -------------------------------------------------------------------------
  private async exportWithWebCodecs(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (t: number) => void,
    totalFrames: number,
    frameIntervalSec: number,
    settings: ExportSettings,
    codec: string,
    onProgress: (p: ExportProgress) => void,
    addLog: (m: string) => void,
    logs: string[]
  ): Promise<Blob> {
    const chunks: Uint8Array[] = [];
    const startTime = Date.now();

    const videoEncoder = new (window as any).VideoEncoder({
      output: (chunk: any) => {
        const buffer = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buffer);
        chunks.push(buffer);
      },
      error: (e: any) => {
        addLog(`VideoEncoder error: ${e.message}`);
      },
    });

    videoEncoder.configure({
      codec,
      width: settings.width,
      height: settings.height,
      bitrate: settings.bitrateKbps * 1000,
      framerate: settings.fps,
    });

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        videoEncoder.close();
        throw new Error('Export cancelled by user');
      }

      while (this.isPaused) {
        await new Promise((r) => setTimeout(r, 200));
      }

      // Queue backpressure check to prevent VideoEncoder hanging/stalling
      while (videoEncoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 10));
      }

      const currentTime = frameIndex * frameIntervalSec;
      renderFrameAtTime(currentTime);

      const bitmap = await createImageBitmap(canvas);
      const videoFrame = new (window as any).VideoFrame(bitmap, {
        timestamp: Math.round(currentTime * 1000000), // microseconds
      });

      const keyFrame = frameIndex % (settings.fps * 2) === 0;
      videoEncoder.encode(videoFrame, { keyFrame });
      videoFrame.close();
      bitmap.close();

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const progressPercent = Math.min(99, Math.round(((frameIndex + 1) / totalFrames) * 100));
      const estimatedSecondsLeft = Math.max(0, Math.round((elapsedSeconds / (frameIndex + 1)) * (totalFrames - frameIndex - 1)));

      onProgress({
        status: 'rendering',
        currentFrame: frameIndex + 1,
        totalFrames,
        progressPercent,
        elapsedSeconds: Math.round(elapsedSeconds),
        estimatedSecondsLeft,
        activeCodec: codec,
        logs,
      });

      if (frameIndex % 5 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress({
      status: 'rendering',
      currentFrame: totalFrames,
      totalFrames,
      progressPercent: 100,
      elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
      estimatedSecondsLeft: 0,
      activeCodec: 'Menyusun & mengemas file video...',
      logs,
    });

    await videoEncoder.flush();
    videoEncoder.close();

    const finalBlob = new Blob(chunks, { type: settings.format === 'mp4' ? 'video/mp4' : 'video/webm' });
    addLog(`Export successful! Total size: ${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    return finalBlob;
  }

  // -------------------------------------------------------------------------
  // MediaRecorder Fallback Strategy
  // -------------------------------------------------------------------------
  private async exportWithMediaRecorder(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (t: number) => void,
    totalFrames: number,
    frameIntervalSec: number,
    settings: ExportSettings,
    onProgress: (p: ExportProgress) => void,
    addLog: (m: string) => void,
    logs: string[],
    audioStream?: MediaStream | null,
    playAudio?: () => void,
    stopAudio?: () => void
  ): Promise<Blob> {
    let candidateMimes: string[] = [];
    if (settings.format === 'mp4') {
      candidateMimes = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    } else {
      candidateMimes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    }

    const selectedMime = candidateMimes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    addLog(`MediaRecorder using mime: ${selectedMime}`);

    let stream: MediaStream;
    let isRealtime = false;

    if (audioStream) {
      addLog(`Audio stream detected, switching to REAL-TIME rendering mode to capture audio...`);
      isRealtime = true;
      stream = canvas.captureStream ? canvas.captureStream(settings.fps) : (canvas as any).mozCaptureStream(settings.fps);
      
      // Add audio tracks to the video stream
      audioStream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    } else {
      stream = canvas.captureStream ? canvas.captureStream(0) : (canvas as any).mozCaptureStream(0);
    }

    const videoTrack = stream.getVideoTracks()[0];

    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMime,
      videoBitsPerSecond: settings.bitrateKbps * 1000,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start(200); // chunk every 200ms
    const startTime = Date.now();

    if (isRealtime && playAudio) {
      playAudio();
    }

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        if (isRealtime && stopAudio) stopAudio();
        recorder.stop();
        throw new Error('Export dibatalkan oleh pengguna');
      }

      while (this.isPaused) {
        if (isRealtime && stopAudio) stopAudio();
        await new Promise((r) => setTimeout(r, 200));
      }

      const currentTime = frameIndex * frameIntervalSec;
      renderFrameAtTime(currentTime);

      if (!isRealtime && videoTrack && (videoTrack as any).requestFrame) {
        (videoTrack as any).requestFrame();
      }

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const progressPercent = Math.min(99, Math.round(((frameIndex + 1) / totalFrames) * 100));
      const estimatedSecondsLeft = Math.max(0, Math.round((elapsedSeconds / (frameIndex + 1)) * (totalFrames - frameIndex - 1)));

      onProgress({
        status: 'rendering',
        currentFrame: frameIndex + 1,
        totalFrames,
        progressPercent,
        elapsedSeconds: Math.round(elapsedSeconds),
        estimatedSecondsLeft,
        activeCodec: `MediaRecorder (${isRealtime ? 'Real-Time' : 'Offline'})`,
        logs,
      });

      if (isRealtime) {
        const targetTime = startTime + currentTime * 1000;
        const now = Date.now();
        const waitTime = targetTime - now;
        if (waitTime > 0) {
          await new Promise((r) => setTimeout(r, waitTime));
        } else {
          await new Promise((r) => setTimeout(r, 0));
        }
      } else {
        if (frameIndex % 3 === 0) {
          await new Promise((r) => setTimeout(r, 1));
        }
      }
    }

    if (isRealtime && stopAudio) {
      stopAudio();
    }

    onProgress({
      status: 'rendering',
      currentFrame: totalFrames,
      totalFrames,
      progressPercent: 100,
      elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
      estimatedSecondsLeft: 0,
      activeCodec: 'Menyusun & mengemas file video...',
      logs,
    });

    addLog('Menghentikan rekaman & menyusun file hasil render...');

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const mimeBase = selectedMime.split(';')[0] || 'video/webm';
        const blob = new Blob(recordedChunks, { type: mimeBase });
        addLog(`MediaRecorder finished! Size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
        resolve(blob);
      };

      recorder.onerror = (e: any) => {
        reject(e?.error || new Error('MediaRecorder recording error'));
      };

      recorder.stop();
    });
  }

  // -------------------------------------------------------------------------
  // PNG Sequence Zip Export Strategy
  // -------------------------------------------------------------------------
  private async exportPNGSequence(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (t: number) => void,
    totalFrames: number,
    frameIntervalSec: number,
    onProgress: (p: ExportProgress) => void,
    addLog: (m: string) => void,
    logs: string[]
  ): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder('frame_sequence');
    const startTime = Date.now();

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) throw new Error('Export cancelled');

      const currentTime = frameIndex * frameIntervalSec;
      renderFrameAtTime(currentTime);

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const frameName = `frame_${String(frameIndex + 1).padStart(5, '0')}.png`;
      folder?.file(frameName, base64Data, { base64: true });

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const progressPercent = Math.round(((frameIndex + 1) / totalFrames) * 100);
      const estimatedSecondsLeft = Math.round((elapsedSeconds / (frameIndex + 1)) * (totalFrames - frameIndex - 1));

      onProgress({
        status: 'rendering',
        currentFrame: frameIndex + 1,
        totalFrames,
        progressPercent,
        elapsedSeconds: Math.round(elapsedSeconds),
        estimatedSecondsLeft,
        activeCodec: 'PNG Zip Encoder',
        logs,
      });

      if (frameIndex % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    addLog('Generating Zip archive...');
    return await zip.generateAsync({ type: 'blob' });
  }
}
