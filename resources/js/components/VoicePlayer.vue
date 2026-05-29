<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Play, Pause } from '@lucide/vue';
import WaveSurfer from 'wavesurfer.js';
import { formatDuration } from '@/lib/utils';

const props = defineProps<{
    src: string;
    isSent: boolean;
}>();

const waveformContainer = ref<HTMLDivElement | null>(null);
let wavesurfer: WaveSurfer | null = null;

const isPlaying = ref(false);
const duration = ref(0);
const currentTime = ref(0);
const playbackSpeed = ref(1.0);

const initWaveSurfer = () => {
    if (!waveformContainer.value) return;

    wavesurfer = WaveSurfer.create({
        container: waveformContainer.value,
        waveColor: props.isSent ? '#a5b4fc' : '#cbd5e1',
        progressColor: props.isSent ? '#ffffff' : '#4f46e5',
        cursorColor: 'transparent',
        barWidth: 3,
        barRadius: 3,
        barGap: 3,
        height: 26,
        url: props.src,
        normalize: true,
    });

    wavesurfer.on('play', () => {
        isPlaying.value = true;
    });

    wavesurfer.on('pause', () => {
        isPlaying.value = false;
    });

    wavesurfer.on('ready', () => {
        duration.value = wavesurfer?.getDuration() ?? 0;
        wavesurfer?.setPlaybackRate(playbackSpeed.value);
    });

    wavesurfer.on('audioprocess', () => {
        currentTime.value = wavesurfer?.getCurrentTime() ?? 0;
    });

    wavesurfer.on('seeking', () => {
        currentTime.value = wavesurfer?.getCurrentTime() ?? 0;
    });
};

const togglePlay = () => {
    wavesurfer?.playPause();
};

const cycleSpeed = () => {
    if (playbackSpeed.value === 1.0) {
        playbackSpeed.value = 1.5;
    } else if (playbackSpeed.value === 1.5) {
        playbackSpeed.value = 2.0;
    } else {
        playbackSpeed.value = 1.0;
    }
    
    wavesurfer?.setPlaybackRate(playbackSpeed.value);
};

onMounted(() => {
    setTimeout(() => {
        initWaveSurfer();
    }, 50);
});

onUnmounted(() => {
    if (wavesurfer) {
        wavesurfer.destroy();
    }
});

watch(() => props.src, () => {
    if (wavesurfer) {
        wavesurfer.destroy();
    }
    currentTime.value = 0;
    isPlaying.value = false;
    setTimeout(() => {
        initWaveSurfer();
    }, 50);
});
</script>

<template>
    <div class="voice-player-card" :class="isSent ? 'voice-player-sent' : 'voice-player-received'">
        <button
            type="button"
            @click="togglePlay"
            class="play-btn"
            :class="isSent ? 'play-btn-sent' : 'play-btn-received'"
            aria-label="Play voice note"
        >
            <Pause v-if="isPlaying" class="h-4.5 w-4.5" />
            <Play v-else class="h-4.5 w-4.5 pl-0.5" />
        </button>

        <div class="flex-1 flex flex-col justify-center min-w-0 space-y-1">
            <div ref="waveformContainer" class="waveform-container"></div>

            <div class="flex items-center justify-between text-[10px] select-none opacity-80 leading-none"
                :class="isSent ? 'text-indigo-100' : 'text-slate-500'">
                <span>{{ formatDuration(currentTime) }} / {{ formatDuration(duration || 0) }}</span>
            </div>
        </div>

        <button
            type="button"
            @click="cycleSpeed"
            class="speed-btn"
            :class="isSent ? 'speed-btn-sent' : 'speed-btn-received'"
        >
            {{ playbackSpeed.toFixed(1) }}x
        </button>
    </div>
</template>

<style scoped>
.voice-player-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    width: 280px;
    max-width: 100%;
    margin-top: 0.25rem;
    box-sizing: border-box;
}

.voice-player-sent {
    background: transparent;
}

.voice-player-received {
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.8);
}

.play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.play-btn-sent {
    background-color: #ffffff;
    color: #4f46e5;
}
.play-btn-sent:hover {
    transform: scale(1.05);
    background-color: #f8fafc;
}

.play-btn-received {
    background-color: #4f46e5;
    color: #ffffff;
}
.play-btn-received:hover {
    transform: scale(1.05);
    background-color: #4338ca;
}

.waveform-container {
    position: relative;
    height: 26px;
    width: 100%;
    cursor: pointer;
    overflow: hidden;
}

.speed-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    padding: 0.25rem 0.4rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
    min-width: 32px;
}

.speed-btn-sent {
    background-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
}
.speed-btn-sent:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.speed-btn-received {
    background-color: #f1f5f9;
    color: #475569;
}
.speed-btn-received:hover {
    background-color: #e2e8f0;
}
</style>
