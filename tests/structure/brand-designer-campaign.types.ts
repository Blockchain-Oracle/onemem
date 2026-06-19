export type DesignerCampaignManifest = {
  sourceDownload: string;
  boundary: string;
  staticBoardTargets: Record<string, string>;
  launchVideo: {
    size: string;
    durationSeconds: number;
    audio: string;
    silent: boolean;
    beats: string[];
  };
  files: Array<{
    id: string;
    path: string;
    sizeBytes: number;
    sha256: string;
  }>;
};

export type DesignerCampaignExportManifest = {
  source: {
    boundary: string;
    exportPatches: string[];
  };
  staticBoards: Array<{
    id: string;
    file: string;
    width: number;
    height: number;
    sizeBytes: number;
    sha256: string;
  }>;
  launchVideos: Array<{
    id: string;
    file: string;
    width: number;
    height: number;
    fps: number;
    frameRate: string;
    audioFile: string;
    audioSha256: string;
    sizeBytes: number;
    sha256: string;
    durationSeconds: number;
  }>;
};

export type DesignerReferenceBenchmark = {
  boundary: string;
  references: Array<{
    id: string;
    sourceUrl: string;
    zipEntry: string;
    boundary: string;
    durationSeconds: number;
    video: { width: number; height: number; r_frame_rate: string };
    audio: { codec_name: string };
    volume: { meanDb: number | null; maxDb: number | null };
    takeaways: string[];
  }>;
  currentLaunch: {
    id: string;
    file: string;
    video: { width: number; height: number };
    audio: { codec_name: string };
    takeaways: string[];
  };
};
