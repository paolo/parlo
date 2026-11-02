import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LANG_CODES, type Lang } from "../shared/languages";
import { CountryPicker } from "./CountryPicker";

const natives: Lang[] = LANG_CODES.filter((l) => l !== "en" && l !== "fr");
const country = (name: string) => screen.getByRole("button", { name });

function pickerOf(langs: readonly Lang[] = natives) {
  const onPick = vi.fn();
  renderWithProviders(<CountryPicker langs={langs} onPick={onPick} />);
  return onPick;
}

describe("CountryPicker", () => {
  it("lists the countries where the languages on offer are spoken, with their flags", () => {
    const { container } = renderWithProviders(
      <CountryPicker langs={natives} onPick={vi.fn()} />,
    );

    expect(country("Bolivia")).toBeInTheDocument();
    expect(country("Brazil")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nigeria" })).toBeNull();
    expect(container.querySelector('img[src="/flags/bo.svg"]')).not.toBeNull();
  });

  it("filters the countries by what is typed, ignoring case", async () => {
    pickerOf();

    await userEvent.type(screen.getByRole("searchbox"), "BOL");

    expect(country("Bolivia")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Brazil" })).toBeNull();
  });

  it("picks straight away for a country with one language, keeping the country", async () => {
    const onPick = pickerOf();

    await userEvent.click(country("Bolivia"));

    expect(onPick).toHaveBeenCalledWith({ lang: "es", region: "BO" });
  });

  it("asks which language for a country with several, then picks it with the country", async () => {
    const onPick = pickerOf();

    await userEvent.click(country("Ukraine"));
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByText("Which language?")).toBeInTheDocument();
    await userEvent.click(country("Русский"));

    expect(onPick).toHaveBeenCalledWith({ lang: "ru", region: "UA" });
  });

  it("goes back from the language step to the countries", async () => {
    pickerOf();
    await userEvent.click(country("India"));

    await userEvent.click(country("Back"));

    expect(country("Bolivia")).toBeInTheDocument();
    expect(screen.queryByText("Which language?")).toBeNull();
  });

  it("offers English and French for Canada when they are on offer", async () => {
    const onPick = pickerOf(LANG_CODES);

    await userEvent.click(country("Canada"));
    await userEvent.click(country("Français"));

    expect(onPick).toHaveBeenCalledWith({ lang: "fr", region: "CA" });
  });

  it("lets someone whose country is missing pick a language directly, with its default country", async () => {
    const onPick = pickerOf();

    await userEvent.click(country("My country isn't listed"));
    expect(screen.getByText("Which language?")).toBeInTheDocument();
    await userEvent.click(country("Português"));

    expect(onPick).toHaveBeenCalledWith({ lang: "pt", region: "PT" });
  });

  it("offers the language fallback when nothing matches the search", async () => {
    pickerOf();

    await userEvent.type(screen.getByRole("searchbox"), "zzzz");

    expect(screen.getByText(/no country matches/i)).toBeInTheDocument();
    expect(country("My country isn't listed")).toBeInTheDocument();
  });
});
