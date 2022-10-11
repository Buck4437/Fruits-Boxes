class AudioLibrary {

    static BGM = 1;
    static SFX = 2;

    static audios = {
        bgm: {
            type: AudioLibrary.BGM,
            src: "res/fruitbox.mp3",
        },
        delete: {
            type: AudioLibrary.SFX,
            src: "res/delete.mp3" 
        },
        end: {
            type: AudioLibrary.SFX,
            src: "res/end.mp3"
        }
    }

    static $playingAudios = {};

    static getAudioData(name) {
        return AudioLibrary.audios[name];
    }

    static play(name, settings={}) {
        const audioData = AudioLibrary.getAudioData(name);
        if (audioData == undefined) return;

        AudioLibrary.stop(name);

        const audioObject = new Audio(audioData.src);
        for (let keys of Object.keys(settings)) {
            audioObject[keys] = settings[keys];
        }
        audioObject.play();
        AudioLibrary.$playingAudios[name] = audioObject;
    }

    static stop(name) {
        AudioLibrary.$playingAudios[name]?.pause();
        delete AudioLibrary.$playingAudios[name];
    }

}