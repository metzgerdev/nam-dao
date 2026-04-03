import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MusicPlayer from "../MusicPlayer/MusicPlayer";
import { fetchMusicLibrary } from "../MusicPlayer/mockMusicPlayerApi";

describe("mockMusicPlayerApi", () => {
  test("returns the music library with local asset urls", async () => {
    const library = await fetchMusicLibrary();

    expect(library.featuredTrackId).toBe("like-an-animal");
    expect(library.tracks).toHaveLength(3);
    expect(library.tracks[0]?.audio.src).toContain("like-an-animal.wav");
    expect(library.tracks[1]?.artwork.src).toContain("sideways-cover.png");
    expect(library.tracks[2]?.audio.src).toContain("landslide.wav");
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
    render(<MusicPlayer />);

    expect(screen.getByText(/Loading GraphQL library/i)).toBeTruthy();
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
    render(<MusicPlayer />);

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
