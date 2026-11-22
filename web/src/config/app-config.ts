import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "WMC NEXUS",
  version: packageJson.version,
  copyright: `© ${currentYear}, ARTEX.`,
  meta: {
    title: "WMC NEXUS — AI Security Workbench",
    description: "Local-first AI security workbench for authorized defensive security teams",
  },
};
