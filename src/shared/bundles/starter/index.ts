import type { Bundle } from "../types";
import { emergencies } from "./emergencies";
import { greetings } from "./greetings";
import { health } from "./health";
import { housing } from "./housing";
import { phoneBanking } from "./phone-banking";
import { restaurants } from "./restaurants";
import { shops } from "./shops";
import { smallTalk } from "./small-talk";
import { transit } from "./transit";
import { workSchool } from "./work-school";

export const starter: Bundle = {
  id: "starter",
  name: "Starter",
  phrases: [
    ...greetings,
    ...transit,
    ...shops,
    ...restaurants,
    ...health,
    ...workSchool,
    ...housing,
    ...phoneBanking,
    ...smallTalk,
    ...emergencies,
  ],
};
