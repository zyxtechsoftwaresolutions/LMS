import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string;
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl) return;

    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`);
      return;
    }

    // Check if it's a Vimeo URL
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      setEmbedUrl(`https://player.vimeo.com/video/${videoId}`);
      return;
    }

    // Check if it's a direct video file (mp4, webm, etc.)
    const videoFileRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
    if (videoFileRegex.test(videoUrl)) {
      setEmbedUrl(videoUrl);
      return;
    }

    // If none of the above, try to use as iframe src (for other embeddable URLs)
    setEmbedUrl(videoUrl);
  }, [videoUrl]);

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Invalid video URL</p>
      </div>
    );
  }

  // Check if it's a direct video file
  const isDirectVideo = embedUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);

  if (isDirectVideo) {
    return (
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
        <video
          src={embedUrl}
          controls
          className="w-full h-full"
          poster={thumbnailUrl || undefined}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // For YouTube, Vimeo, or other embeddable URLs
  if (!isPlaying) {
    return (
      <div className="aspect-video w-full relative bg-black rounded-lg overflow-hidden group cursor-pointer">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
            <Play className="h-16 w-16 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Button
            size="lg"
            className="rounded-full h-20 w-20 bg-primary/90 hover:bg-primary"
            onClick={() => setIsPlaying(true)}
          >
            <Play className="h-10 w-10 text-white fill-white ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title || "Video player"}
      />
    </div>
  );
}





