import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LangLabel } from "./LangLabel";

describe("LangLabel", () => {
  it("shows the flag, the name and a non-default region", () => {
    const { container } = renderWithProviders(
      <LangLabel lang="es" region="BO" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/flags/bo.svg",
    );
    expect(screen.getByText(/Español/)).toBeInTheDocument();
    expect(screen.getByText(/Bolivia/)).toBeInTheDocument();
  });

  it("falls back to the default flag and hides the default region name", () => {
    const { container } = renderWithProviders(<LangLabel lang="en" />);

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/flags/gb.svg",
    );
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.queryByText(/United Kingdom/)).not.toBeInTheDocument();
  });

  it("shows the flag of the region even when the name is shared with other regions", () => {
    const { container } = renderWithProviders(
      <LangLabel lang="fr" region="CA" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/flags/ca.svg",
    );
    expect(screen.getByText(/Français/)).toBeInTheDocument();
    expect(screen.getByText(/Canada/)).toBeInTheDocument();
  });

  describe("with a profile", () => {
    afterEach(() => vi.unstubAllGlobals());

    function stubProfile(languages: { lang: string; region: string }[]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json({ languages })),
      );
    }

    it("shows the flag of the region the user picked for the language", async () => {
      stubProfile([{ lang: "es", region: "BO" }]);
      const { container } = renderWithProviders(<LangLabel lang="es" />);

      await waitFor(() =>
        expect(container.querySelector("img")).toHaveAttribute(
          "src",
          "/flags/bo.svg",
        ),
      );
      // The region is not spelled out: only the flag follows the profile.
      expect(screen.queryByText(/Bolivia/)).not.toBeInTheDocument();
    });

    it("keeps the usual flag for a language that is not in the profile", async () => {
      stubProfile([{ lang: "es", region: "BO" }]);
      const { container } = renderWithProviders(<LangLabel lang="en" />);

      await waitFor(() => expect(fetch).toHaveBeenCalled());
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "/flags/gb.svg",
      );
    });

    it("lets an explicit region win over the profile", async () => {
      stubProfile([{ lang: "es", region: "BO" }]);
      const { container } = renderWithProviders(
        <LangLabel lang="es" region="MX" />,
      );

      await waitFor(() => expect(fetch).toHaveBeenCalled());
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "/flags/mx.svg",
      );
    });
  });
});
