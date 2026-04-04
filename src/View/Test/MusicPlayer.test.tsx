import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MusicPlayer from "../MusicPlayer/MusicPlayer";
import {
  executeMusicLibraryQuery,
  fetchMusicLibrary,
} from "../MusicPlayer/mockMusicPlayerApi";
import { createAppQueryClient } from "../../queryClient";

function renderMusicPlayer() {
  const queryClient = createAppQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MusicPlayer />
    </QueryClientProvider>,
  );
}

describe("mockMusicPlayerApi", () => {
  test("returns the music library with local asset urls", async () => {
    const library = await fetchMusicLibrary();

    expect(library.featuredTrackId).toBe("like-an-animal");
    expect(library.tracks).toHaveLength(3);
    expect(library.tracks[0]?.audio.src).toContain("like-an-animal.m4a");
    expect(library.tracks[1]?.artwork.src).toContain("sideways-cover.png");
    expect(library.tracks[2]?.audio.src).toContain("landslide.m4a");
  });

  test("serves track data through the mock /graphql endpoint", async () => {
    await fetchMusicLibrary();

    const response = await window.fetch("/graphql", {
      body: JSON.stringify({
        query: `
          query Track {
            track(id: "sideways") {
              id
              title
              artist
            }
          }
        `,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      data?: {
        track?: {
          artist: string;
          id: string;
          title: string;
        };
      };
    };

    expect(response.ok).toBe(true);
    expect(payload.data?.track).toEqual({
      artist: "Zynar",
      id: "sideways",
      title: "Sideways",
    });
  });

  test("throws when a graphql query is invalid", async () => {
    await expect(
      executeMusicLibraryQuery(`
        query BrokenLibraryQuery {
          missingField
        }
      `),
    ).rejects.toThrow(/Cannot query field "missingField" on type "Query"/i);
  });

  test("throws when a request does not match the musicLibrary schema", async () => {
    await expect(
      executeMusicLibraryQuery(`
        query InvalidMusicLibraryShape {
          musicLibrary {
            tracks {
              id
              bpm
              unsupportedField
            }
          }
        }
      `),
    ).rejects.toThrow(
      /Cannot query field "unsupportedField" on type "MusicTrack"/i,
    );
  });

  test("returns graphql errors with a 400 response at the mock endpoint", async () => {
    await fetchMusicLibrary();

    const response = await window.fetch("/graphql", {
      body: JSON.stringify({
        query: `
          query BrokenEndpointQuery {
            missingField
          }
        `,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      errors?: Array<{ message?: string }>;
    };

    expect(response.status).toBe(400);
    expect(payload.errors?.[0]?.message).toMatch(
      /Cannot query field "missingField" on type "Query"/i,
    );
  });
});

describe("MusicPlayer", () => {
  beforeEach(() => {
    jest
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders the featured track and switches tracks from the library", async () => {
    renderMusicPlayer();

    expect(screen.getByText(/Loading music library/i)).toBeTruthy();
    expect(
      await screen.findByRole("heading", { name: "Like an Animal" }),
    ).toBeTruthy();

    const sidewaysButton = screen.getByRole("button", {
      name: /Select Sideways/i,
    });

    fireEvent.click(sidewaysButton);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sideways" })).toBeTruthy();
      expect(sidewaysButton.getAttribute("aria-pressed")).toBe("true");
    });
  });

  test("starts and pauses playback from the transport controls", async () => {
    renderMusicPlayer();

    expect(
      await screen.findByRole("heading", { name: "Like an Animal" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Play track/i }));

    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Pause track/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Pause track/i }));

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Play track/i })).toBeTruthy();
  });
});
