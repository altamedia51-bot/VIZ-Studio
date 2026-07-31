import JSZip from 'jszip';
import { ExportSettings, ExportProgress } from '../types';
import { Muxer as WebMMuxer, ArrayBufferTarget as WebMArrayBufferTarget } from 'webm-muxer';
import { Muxer as MP4Muxer, ArrayBufferTarget as MP4ArrayBufferTarget } from 'mp4-muxer';

export class EncoderEngine {
  private isCancelled: boolean = false;
  private isPaused: boolean = false;

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
    audioBuffer?: AudioBuffer | null
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

    if (settings.format === 'png_sequence') {
      return this.exportPNGSequence(canvas, renderFrameAtTime, totalFrames, frameIntervalSec, onProgress, addLog, logs);
    }

    if (typeof (window as any).VideoEncoder === 'undefined') {
      throw new Error('Browser Anda tidak mendukung WebCodecs VideoEncoder.');
    }

    try {
      return await this.exportWithMuxer(
        canvas,
        renderFrameAtTime,
        totalFrames,
        frameIntervalSec,
        durationSec,
        settings,
        onProgress,
        addLog,
        logs,
        audioBuffer
      );
    } catch (err: any) {
      addLog(`Export failed: ${err.message}`);
      throw new Error(`Gagal mengekspor video: ${err.message}`);
    }
  }

  private async exportWithMuxer(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (t: number) => void,
    totalFrames: number,
    frameIntervalSec: number,
    durationSec: number,
    settings: ExportSettings,
    onProgress: (p: ExportProgress) => void,
    addLog: (m: string) => void,
    logs: string[],
    audioBuffer?: AudioBuffer | null
  ): Promise<Blob> {
    const isMp4 = settings.format === 'mp4';
    let muxer: any;

    const width = settings.width % 2 !== 0 ? settings.width - 1 : settings.width;
    const height = settings.height % 2 !== 0 ? settings.height - 1 : settings.height;

    let encoderError: Error | null = null;

    if (isMp4) {
      muxer = new MP4Muxer({
        target: new MP4ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: width,
          height: height,
        },
        audio: audioBuffer ? {
          codec: 'aac',
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels
        } : undefined,
        fastStart: 'in-memory',
      });
    } else {
      muxer = new WebMMuxer({
        target: new WebMArrayBufferTarget(),
        video: {
          codec: 'V_VP9',
          width: width,
          height: height,
          frameRate: settings.fps,
        },
        audio: audioBuffer ? {
          codec: 'A_OPUS',
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels
        } : undefined
      });
    }

    let videoCodec = isMp4 ? 'avc1.4d402a' : 'vp09.00.10.08'; // Main Profile, Level 4.2
    
    try {
      const support = await (window as any).VideoEncoder.isConfigSupported({
        codec: videoCodec,
        width: width,
        height: height,
        bitrate: settings.bitrateKbps * 1000,
        framerate: settings.fps,
      });
      if (!support.supported) {
        // Fallback codecs
        videoCodec = isMp4 ? 'avc1.64002a' : 'vp8'; // High Profile, Level 4.2
        addLog(`Codec not supported, falling back to ${videoCodec}`);
      }
    } catch (e) {
      addLog(`Failed to check codec support, proceeding with ${videoCodec}`);
    }

    const videoEncoder = new (window as any).VideoEncoder({
      output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
      error: (e: any) => {
        encoderError = e;
        addLog(`VideoEncoder error: ${e.message}`);
      }
    });

    videoEncoder.configure({
      codec: videoCodec,
      width: width,
      height: height,
      bitrate: settings.bitrateKbps * 1000,
      framerate: settings.fps,
    });

    let audioEncoder: any = null;

    if (audioBuffer && (window as any).AudioEncoder) {
      const aCodec = isMp4 ? 'mp4a.40.2' : 'opus';
      
      const sampleRate = audioBuffer.sampleRate;
      
      const aConfig = {
        codec: aCodec,
        sampleRate: sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        bitrate: 128000,
      };
      
      try {
        const aSupport = await (window as any).AudioEncoder.isConfigSupported(aConfig);
        if (aSupport.supported) {
          audioEncoder = new (window as any).AudioEncoder({
            output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
            error: (e: any) => {
              encoderError = e;
              addLog(`AudioEncoder error: ${e.message}`);
            },
          });
          audioEncoder.configure(aConfig);
        } else {
          addLog(`AudioEncoder config not supported for ${aCodec}`);
        }
      } catch (e) {
        addLog(`AudioEncoder error during configure: ${e}`);
      }
    }

    addLog(`Mulai rendering video dengan codec ${videoCodec}...`);
    const startTime = Date.now();

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        if (videoEncoder.state !== 'closed') videoEncoder.close();
        if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();
        throw new Error('Export cancelled by user');
      }

      if (encoderError || videoEncoder.state === 'closed') {
        throw encoderError || new Error('VideoEncoder closed unexpectedly');
      }

      while (this.isPaused) {
        await new Promise((r) => setTimeout(r, 200));
      }

      while (videoEncoder.state !== 'closed' && videoEncoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 10));
      }

      if (encoderError || videoEncoder.state === 'closed') {
        throw encoderError || new Error('VideoEncoder closed unexpectedly');
      }

      const currentTime = frameIndex * frameIntervalSec;
      renderFrameAtTime(currentTime);

      const bitmap = await createImageBitmap(canvas);
      const videoFrame = new (window as any).VideoFrame(bitmap, {
        timestamp: Math.round(currentTime * 1000000), // microseconds
      });

      const keyFrame = frameIndex % (settings.fps * 2) === 0;
      if (videoEncoder.state !== 'closed') {
        videoEncoder.encode(videoFrame, { keyFrame });
      } else {
        videoFrame.close();
        bitmap.close();
        throw encoderError || new Error('VideoEncoder closed unexpectedly');
      }
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
        activeCodec: `Video (${isMp4 ? 'MP4' : 'WebM'})`,
        logs,
      });

      if (frameIndex % 5 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    await videoEncoder.flush();
    videoEncoder.close();

    if (audioEncoder && audioBuffer) {
      addLog(`Menyusun trek audio...`);
      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      
      // Calculate how many samples are needed for the exported duration
      const totalSamplesToEncode = Math.ceil(durationSec * sampleRate);

      // Copy channel data
      const channelData: Float32Array[] = [];
      for (let i = 0; i < numChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }

      // Encode audio in chunks of 0.5s
      const chunkSize = Math.floor(sampleRate * 0.5); 
      for (let offset = 0; offset < totalSamplesToEncode; offset += chunkSize) {
        if (this.isCancelled) throw new Error('Export cancelled');
        
        while (audioEncoder.encodeQueueSize > 10) {
          await new Promise((r) => setTimeout(r, 10));
        }

        const size = Math.min(chunkSize, totalSamplesToEncode - offset);
        const planarData = new Float32Array(size * numChannels);
        
        for (let c = 0; c < numChannels; c++) {
          const channelDestOffset = c * size;
          // If we read past the audio buffer length, pad with 0s (silence)
          if (offset >= audioBuffer.length) {
            // Already 0s due to Float32Array init
          } else {
            const copySize = Math.min(size, audioBuffer.length - offset);
            planarData.set(channelData[c].subarray(offset, offset + copySize), channelDestOffset);
          }
        }

        const audioData = new (window as any).AudioData({
          format: 'f32-planar',
          sampleRate: sampleRate,
          numberOfFrames: size,
          numberOfChannels: numChannels,
          timestamp: Math.round((offset / sampleRate) * 1000000), // microsec
          data: planarData,
        });

        audioEncoder.encode(audioData);
        audioData.close();
      }

      await audioEncoder.flush();
      audioEncoder.close();
    }

    muxer.finalize();
    const buffer = muxer.target.buffer;
    const finalBlob = new Blob([buffer], { type: isMp4 ? 'video/mp4' : 'video/webm' });
    
    addLog(`Export berhasil! Ukuran: ${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    return finalBlob;
  }

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
