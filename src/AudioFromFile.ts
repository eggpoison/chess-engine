class AudioFromFile {
   private context!: AudioContext;

   constructor(name: string) {
      try {
         this.context = new AudioContext();
      } catch {
         alert("Web Audio API is not supported in your browser!");
      }

      const path = require("./audio/" + name);
      const audio = new Audio(path);

      const source = this.context.createMediaElementSource(audio);
      source.connect(this.context.destination);

      this.context.resume();
      audio.play();

      audio.addEventListener("ended", () => this.remove(source, audio));
   }

   private remove(source: MediaElementAudioSourceNode, audio: HTMLAudioElement): void {
      source.disconnect();
      audio.remove();
      this.context.close();
   }
}

export default AudioFromFile;