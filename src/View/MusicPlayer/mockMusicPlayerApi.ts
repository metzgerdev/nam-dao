import { buildSchema, graphql } from "graphql";

const MOCK_NETWORK_DELAY_MS = 500;
const GRAPHQL_ENDPOINT_PATH = "/graphql";
const MOCK_FETCH_INSTALLED = Symbol.for("music-player.mock-graphql-fetch");

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function getGraphqlEndpointUrl(): string {
  if (typeof window === "undefined") {
    return `http://localhost${GRAPHQL_ENDPOINT_PATH}`;
  }

  return new URL(GRAPHQL_ENDPOINT_PATH, window.location.origin).href;
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
        fileName: "like-an-animal.m4a",
        mimeType: "audio/mp4",
        src: new URL("./data/like-an-animal.m4a", import.meta.url).href,
      },
      bpm: 126,
      description:
        "My remix of a modern classic.",
      id: "like-an-animal",
      mixNotes: "44.1kHz AAC preview",
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
        fileName: "sideways.m4a",
        mimeType: "audio/mp4",
        src: new URL("./data/sideways.m4a", import.meta.url).href,
      },
      bpm: 132,
      description:
        "Melodic yet driving with a rnb vocal top line",
      id: "sideways",
      mixNotes: "44.1kHz AAC preview",
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
        fileName: "landslide.m4a",
        mimeType: "audio/mp4",
        src: new URL("./data/landslide.m4a", import.meta.url).href,
      },
      bpm: 130,
      description: "My remake of Fleetwood Mac's Landslide",
      id: "landslide",
      mixNotes: "44.1kHz AAC preview",
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

function isGraphqlEndpoint(input: RequestInfo | URL): boolean {
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    const url = new URL(requestUrl, window.location.origin);
    return url.pathname === GRAPHQL_ENDPOINT_PATH;
  } catch {
    return requestUrl === GRAPHQL_ENDPOINT_PATH;
  }
}

async function readGraphqlRequestBody(init?: RequestInit): Promise<{
  query: string;
  variables?: Record<string, unknown>;
}> {
  const bodyText =
    typeof init?.body === "string"
      ? init.body
      : init?.body instanceof URLSearchParams
        ? init.body.toString()
        : "";

  const parsedBody = JSON.parse(bodyText) as {
    query?: string;
    variables?: Record<string, unknown>;
  };

  return {
    query: parsedBody.query ?? "",
    variables: parsedBody.variables,
  };
}

async function handleGraphqlRequest(init?: RequestInit): Promise<Response> {
  await wait(MOCK_NETWORK_DELAY_MS);
  const { query, variables } = await readGraphqlRequestBody(init);

  const response = await graphql({
    rootValue,
    schema: musicLibrarySchema,
    source: query,
    variableValues: variables,
  });

  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json",
    },
    status: response.errors?.length ? 400 : 200,
  });
}

function installMockGraphqlFetch(): void {
  if (typeof window === "undefined" || typeof globalThis.fetch !== "function") {
    return;
  }

  const fetchState = window as Window & {
    [MOCK_FETCH_INSTALLED]?: boolean;
  };

  if (fetchState[MOCK_FETCH_INSTALLED]) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (isGraphqlEndpoint(input)) {
      return handleGraphqlRequest(init);
    }

    return originalFetch(input, init);
  };

  globalThis.fetch = mockFetch as typeof globalThis.fetch;
  window.fetch = mockFetch as typeof window.fetch;

  fetchState[MOCK_FETCH_INSTALLED] = true;
}

export async function executeMusicLibraryQuery<TData>(source: string) {
  installMockGraphqlFetch();

  const response = await fetch(getGraphqlEndpointUrl(), {
    body: JSON.stringify({
      query: source,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: TData;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "GraphQL request failed.");
  }

  return payload.data as TData;
}

export async function fetchMusicLibrary(): Promise<MusicLibrary> {
  const data = await executeMusicLibraryQuery<MusicLibraryQueryResult>(
    MUSIC_LIBRARY_QUERY,
  );

  return data.musicLibrary;
}
