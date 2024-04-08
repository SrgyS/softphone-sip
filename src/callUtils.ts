import { ICallData } from './App';
import inGreen from '../public/inGreen.png';
import inRed from '../public/inRed.png';
import outGreen from '../public/outGreen.png';
import outRed from '../public/outRed.png';
import { RefObject } from 'react';

export const callStatuses = {
    idle: '',
    calling: 'вызов',
    inCall: 'разговор',
    ended: 'завершено',
};
export const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
};
export const getCallStatusIcon = (item: ICallData) => {
    if (item.isIncoming) {
        return item.success ? inGreen : inRed;
    } else {
        return item.success ? outGreen : outRed;
    }
};
export const formatDate = (date: Date) => {
    const options = {
        day: '2-digit' as const,
        month: '2-digit' as const,
        year: 'numeric' as const,
        hour: '2-digit' as const,
        minute: '2-digit' as const,
    };
    return new Intl.DateTimeFormat('ru-RU', options).format(date);
};
export const startPlayAudio = (ref: RefObject<HTMLAudioElement>) => {
    if (ref.current) {
        ref.current.play();
        console.log('play audio');
    }
};

export const stopPlayAudio = (ref: RefObject<HTMLAudioElement>) => {
    if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
    }
};
