import { buildSchema, graphql } from "graphql";

const MOCK_NETWORK_DELAY_MS = 500;

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

export interface MusicAsset {
  alt?: string;
  fileName?: string;
  mimeType?: string;
  src: string;
}

export interface MusicTrack {
  album: string;
  artist: string;
  artwork: MusicAsset;
  audio: MusicAsset;
  bpm: number;
  description: string;
  id: string;
  mixNotes: string;
  runtimeLabel: string;
  year: number;
  title: string;
}

export interface MusicLibrary {
  featuredTrackId: string;
  tracks: MusicTrack[];
}

interface MusicLibraryQueryResult {
  musicLibrary: MusicLibrary;
}

const musicLibrarySchema = buildSchema(`
  type MusicAsset {
    alt: String
    fileName: String
    mimeType: String
    src: String!
  }

  type MusicTrack {
    album: String!
    artist: String!
    artwork: MusicAsset!
    audio: MusicAsset!
    bpm: Int!
    description: String!
    id: ID!
    mixNotes: String!
    runtimeLabel: String!
    year: Int!
    title: String!
  }

  type MusicLibrary {
    featuredTrackId: ID!
    tracks: [MusicTrack!]!
  }

  type Query {
    musicLibrary: MusicLibrary!
    track(id: ID!): MusicTrack
  }
`);

const library: MusicLibrary = {
  featuredTrackId: "like-an-animal",
  tracks: [
    {
      album: "Like an Animal (Zynar Extended Mix)",
      artist: "Rufus Du Sol",
      artwork: {
        alt: "Like an Animal cover art with a dark studio palette.",
        fileName: "like-an-animal-cover.png",
        mimeType: "image/png",
        src: new URL(
          "./data/like-an-animal-cover.png",
          import.meta.url,
        ).href,
      },
      audio: {
        fileName: "like-an-animal.wav",
        mimeType: "audio/wav",
        src: new URL("./data/like-an-animal.wav", import.meta.url).href,
      },
      bpm: 126,
      description:
        "My remix of a modern classic.",
      id: "like-an-animal",
      mixNotes: "44.1kHz / 16-bit PCM",
      runtimeLabel: "3:15",
      title: "Like an Animal",
      year: 2026,
    },
    {
      album: "Sideways",
      artist: "Zynar",
      artwork: {
        alt: "Sideways cover art in a moody copper and charcoal palette.",
        fileName: "sideways-cover.png",
        mimeType: "image/png",
        src: new URL("./data/sideways-cover.png", import.meta.url).href,
      },
      audio: {
        fileName: "sideways.wav",
        mimeType: "audio/wav",
        src: new URL("./data/sideways.wav", import.meta.url).href,
      },
      bpm: 132,
      description:
        "Melodic yet driving with a rnb vocal top line",
      id: "sideways",
      mixNotes: "44.1kHz / 16-bit PCM",
      runtimeLabel: "3:28",
      title: "Sideways",
      year: 2026,
    },
    {
      album: "Landslide",
      artist: "Zynar",
      artwork: {
        alt: "Landslide cover art.",
        fileName: "landslide-cover.png",
        mimeType: "image/png",
        src: new URL("./data/landslide-cover.png", import.meta.url).href,
      },
      audio: {
        fileName: "landslide.wav",
        mimeType: "audio/wav",
        src: new URL("./data/landslide.wav", import.meta.url).href,
      },
      bpm: 130,
      description: "My remake of Fleetwood Mac's Landslide",
      id: "landslide",
      mixNotes: "44.1kHz / 16-bit PCM",
      runtimeLabel: "0:00",
      title: "Landslide",
      year: 2026,
    },
  ],
};

const rootValue = {
  musicLibrary() {
    return library;
  },
  track({ id }: { id: string }) {
    return library.tracks.find((track) => track.id === id) ?? null;
  },
};

const MUSIC_LIBRARY_QUERY = `
  query MusicLibrary {
    musicLibrary {
      featuredTrackId
      tracks {
        album
        artist
        artwork {
          alt
          fileName
          mimeType
          src
        }
        audio {
          fileName
          mimeType
          src
        }
        bpm
        description
        id
        mixNotes
        runtimeLabel
        title
        year
      }
    }
  }
`;

export async function executeMusicLibraryQuery<TData>(source: string) {
  await wait(MOCK_NETWORK_DELAY_MS);

  const response = await graphql({
    rootValue,
    schema: musicLibrarySchema,
    source,
  });

  if (response.errors?.length) {
    throw new Error(response.errors[0]?.message ?? "GraphQL request failed.");
  }

  return response.data as TData;
}

export async function fetchMusicLibrary(): Promise<MusicLibrary> {
  const data = await executeMusicLibraryQuery<MusicLibraryQueryResult>(
    MUSIC_LIBRARY_QUERY,
  );

  return data.musicLibrary;
}
