import JSZip from 'jszip';
import { ExportSettings, ExportProgress } from '../types';
import { globalAudioEngine } from '../audio/AudioEngine';

export class EncoderEngine {
  private isCancelled: boolean = false;
  private isPaused: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;

  public cancelExport() {
    this.isCancelled = true;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  public pauseExport() {
    this.isPaused = true;
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  public resumeExport() {
    this.isPaused = false;
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  public async startExport(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (timeSec: number) => Promise<void> | void,
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

    addLog(`Initiating export (Screen Record): ${settings.format.toUpperCase()} ${settings.width}x${settings.height} @ ${settings.fps} FPS`);

    if (settings.format === 'png_sequence') {
      return this.exportPNGSequence(canvas, renderFrameAtTime, totalFrames, frameIntervalSec, onProgress, addLog, logs);
    }

    return new Promise((resolve, reject) => {
      try {
        const stream = canvas.captureStream(settings.fps || 60);
        
        const audioStream = globalAudioEngine.getAudioStream();
        if (audioStream) {
          audioStream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
          });
        }

        let mimeType = 'video/webm;codecs=vp8,opus';
        if (settings.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        }

        addLog(`Format rekaman yang digunakan: ${mimeType}`);

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: (settings.bitrateKbps || 8000) * 1000
        });
        
        this.mediaRecorder = recorder;

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        const startTime = performance.now();
        let animationFrameId: number;

        recorder.onstop = () => {
          globalAudioEngine.pause();
          globalAudioEngine.seek(0);
          cancelAnimationFrame(animationFrameId);
          
          if (this.isCancelled) {
            reject(new Error('Export dibatalkan.'));
            return;
          }
          
          const blob = new Blob(chunks, { type: mimeType });
          addLog(`Perekaman selesai. Ukuran: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
          onProgress({
            status: 'completed',
            currentFrame: totalFrames,
            totalFrames,
            progressPercent: 100,
            elapsedSeconds: (performance.now() - startTime) / 1000,
            estimatedSecondsLeft: 0,
            activeCodec: mimeType,
            logs
          });
          resolve(blob);
        };

        recorder.onerror = (e: any) => {
          reject(new Error(`MediaRecorder error: ${e.message || e.name || e}`));
        };

        // Reset audio ke awal
        globalAudioEngine.pause();
        globalAudioEngine.seek(0);
        
        // Start record
        recorder.start(1000); // chunk setiap 1 detik
        globalAudioEngine.play(0); // putar audio secara real time

        const renderLoop = () => {
          if (this.isCancelled) return;

          const now = performance.now();
          const elapsedSec = (now - startTime) / 1000;

          if (elapsedSec >= durationSec) {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            return;
          }

          // Render sinkron diabaikan karena PreviewCanvas berjalan secara real time (isExporting dihilangkan)
          // renderFrameAtTime(elapsedSec);

          const currentFrame = Math.floor(elapsedSec * settings.fps);
          const progressPercent = Math.min((elapsedSec / durationSec) * 100, 99);
          
          onProgress({
            status: 'encoding',
            currentFrame,
            totalFrames,
            progressPercent,
            elapsedSeconds: elapsedSec,
            estimatedSecondsLeft: Math.max(0, durationSec - elapsedSec),
            activeCodec: `Screen Record (${mimeType})`,
            logs
          });

          animationFrameId = requestAnimationFrame(renderLoop);
        };

        animationFrameId = requestAnimationFrame(renderLoop);

      } catch (err: any) {
        reject(err);
      }
    });
  }

  private async exportPNGSequence(
    canvas: HTMLCanvasElement,
    renderFrameAtTime: (t: number) => Promise<void> | void,
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
      await renderFrameAtTime(currentTime);

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
