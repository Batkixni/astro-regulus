import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VideoPlayerProps {
    src: string;
    title?: string;
    poster?: string;
}

export function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
    return (
        <MediaPlayer
            title={title}
            src={src}
            poster={poster}
            aspectRatio="16/9"
            className="w-full h-full bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-media-focus data-[focus]:ring-4"
        >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
    );
}
